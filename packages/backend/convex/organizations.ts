import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";
import type { Id } from "./_generated/dataModel";

async function getMainOrg(ctx: QueryCtx) {
	return await ctx.db
		.query("organizations")
		.withIndex("by_parent", (q) => q.eq("parentOrgId", null))
		.first();
}

async function getOrgMembers(ctx: QueryCtx, orgId: Id<"organizations">) {
	return await ctx.db
		.query("members")
		.withIndex("by_organization", (q) => q.eq("organizationId", orgId))
		.collect();
}

async function checkIsAdmin(ctx: QueryCtx, orgId: Id<"organizations">, userId: string) {
	return await ctx.db
		.query("members")
		.withIndex("by_org_and_user", (q) =>
			q.eq("organizationId", orgId).eq("userId", userId),
		)
		.filter((q) => q.eq(q.field("role"), "ADMIN"))
		.first();
}

async function canManageOrganization(ctx: QueryCtx, orgId: Id<"organizations">, userId: string) {
	const directAccess = await checkIsAdmin(ctx, orgId, userId);
	if (directAccess) return true;

	const mainOrg = await getMainOrg(ctx);
	if (!mainOrg) return false;

	return !!(await checkIsAdmin(ctx, mainOrg._id, userId));
}

export const createMainOrg = mutation({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		if (await getMainOrg(ctx)) {
			throw new Error("Main organization already exists");
		}

		const orgId = await ctx.db.insert("organizations", {
			name: args.name,
			slug: args.name.toLowerCase().replace(/\s+/g, "-"),
			parentOrgId: null,
		});

		const userId = user.userId ?? user._id;
		await ctx.db.insert("members", {
			organizationId: orgId,
			userId,
			role: "ADMIN",
		});

		return orgId;
	},
});

export const createChildOrg = mutation({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		const mainOrg = await getMainOrg(ctx);
		if (!mainOrg) throw new Error("Main organization does not exist");

		const userId = user.userId ?? user._id;
		if (!(await checkIsAdmin(ctx, mainOrg._id, userId))) {
			throw new Error("Only main organization admins can create child organizations");
		}

		const orgId = await ctx.db.insert("organizations", {
			name: args.name,
			slug: args.name.toLowerCase().replace(/\s+/g, "-"),
			parentOrgId: mainOrg._id,
		});

		await ctx.db.insert("members", {
			organizationId: orgId,
			userId,
			role: "ADMIN",
		});

		return orgId;
	},
});

export const getAllOrgs = query({
	args: {},
	handler: async (ctx) => {
		const mainOrg = await getMainOrg(ctx);
		const childOrgs = await ctx.db
			.query("organizations")
			.filter((q) => q.neq(q.field("parentOrgId"), null))
			.collect();

		const mainOrgWithMembers = mainOrg
			? { ...mainOrg, members: await getOrgMembers(ctx, mainOrg._id) }
			: null;

		const childOrgsWithMembers = await Promise.all(
			childOrgs.map(async (org) => ({
				...org,
				members: await getOrgMembers(ctx, org._id),
			})),
		);

		return { mainOrg: mainOrgWithMembers, childOrgs: childOrgsWithMembers };
	},
});

export const isMainOrgAdmin = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return false;

		const mainOrg = await getMainOrg(ctx);
		if (!mainOrg) return false;

		const userId = user.userId ?? user._id;
		return !!(await checkIsAdmin(ctx, mainOrg._id, userId));
	},
});

export const canManageOrg = query({
	args: { orgId: v.id("organizations") },
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return false;

		const userId = user.userId ?? user._id;
		return await canManageOrganization(ctx, args.orgId, userId);
	},
});

export const canAddMembersToOrg = query({
	args: { orgId: v.id("organizations") },
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return false;

		const userId = user.userId ?? user._id;
		const org = await ctx.db.get(args.orgId);
		if (!org) return false;

		// If it's a child org, check if user is child org admin OR main org admin
		if (org.parentOrgId !== null) {
			const isChildOrgAdmin = await checkIsAdmin(ctx, args.orgId, userId);
			if (isChildOrgAdmin) return true;

			const mainOrg = await getMainOrg(ctx);
			if (mainOrg) {
				return !!(await checkIsAdmin(ctx, mainOrg._id, userId));
			}
			return false;
		}

		// For main org, only main org admins can add members
		return !!(await checkIsAdmin(ctx, args.orgId, userId));
	},
});

export const getUserPrimaryOrg = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return null;

		const userId = user.userId ?? user._id;
		const memberships = await ctx.db
			.query("members")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		if (memberships.length === 0) return null;

		const orgsWithDetails = await Promise.all(
			memberships.map(async (membership) => {
				const org = await ctx.db.get(membership.organizationId);
				if (!org) return null;
				return {
					organization: { ...org, members: await getOrgMembers(ctx, org._id) },
					role: membership.role,
					membership,
				};
			}),
		);

		const validOrgs = orgsWithDetails.filter((item) => item !== null) as Array<{
			organization: NonNullable<Awaited<ReturnType<typeof ctx.db.get<"organizations">>>> & {
				members: Array<Awaited<ReturnType<typeof ctx.db.get<"members">>>>;
			};
			role: "ADMIN" | "MEMBER";
			membership: Awaited<ReturnType<typeof ctx.db.get<"members">>>;
		}>;

		if (validOrgs.length === 0) return null;

		const mainOrgAdmin = validOrgs.find(
			(item) => item.organization.parentOrgId === null && item.role === "ADMIN",
		);
		if (mainOrgAdmin) {
			return { organization: mainOrgAdmin.organization, role: mainOrgAdmin.role, isMainOrg: true, isChildOrg: false };
		}

		const mainOrgMember = validOrgs.find(
			(item) => item.organization.parentOrgId === null && item.role === "MEMBER",
		);
		if (mainOrgMember) {
			return { organization: mainOrgMember.organization, role: mainOrgMember.role, isMainOrg: true, isChildOrg: false };
		}

		const childOrgAdmin = validOrgs.find(
			(item) => item.organization.parentOrgId !== null && item.role === "ADMIN",
		);
		if (childOrgAdmin) {
			return { organization: childOrgAdmin.organization, role: childOrgAdmin.role, isMainOrg: false, isChildOrg: true };
		}

		const childOrgMember = validOrgs.find(
			(item) => item.organization.parentOrgId !== null,
		);
		if (childOrgMember) {
			return { organization: childOrgMember.organization, role: childOrgMember.role, isMainOrg: false, isChildOrg: true };
		}

		const first = validOrgs[0]!;
		return {
			organization: first.organization,
			role: first.role,
			isMainOrg: first.organization.parentOrgId === null,
			isChildOrg: first.organization.parentOrgId !== null,
		};
	},
});

export const addMember = mutation({
	args: {
		organizationId: v.id("organizations"),
		userId: v.string(),
		role: v.union(v.literal("ADMIN"), v.literal("MEMBER")),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		const currentUserId = user.userId ?? user._id;
		if (!(await canManageOrganization(ctx, args.organizationId, currentUserId))) {
			throw new Error("You don't have permission to add members to this organization");
		}

		const existingMember = await ctx.db
			.query("members")
			.withIndex("by_org_and_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", args.userId),
			)
			.first();

		if (existingMember) {
			throw new Error("User is already a member of this organization");
		}

		await ctx.db.insert("members", {
			organizationId: args.organizationId,
			userId: args.userId,
			role: args.role,
		});

		return { success: true };
	},
});

export const removeMember = mutation({
	args: {
		organizationId: v.id("organizations"),
		memberId: v.id("members"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		const userId = user.userId ?? user._id;
		if (!(await canManageOrganization(ctx, args.organizationId, userId))) {
			throw new Error("You don't have permission to remove members from this organization");
		}

		const member = await ctx.db.get(args.memberId);
		if (!member || member.organizationId !== args.organizationId) {
			throw new Error("Member not found");
		}

		if (member.userId === userId) {
			const admins = await ctx.db
				.query("members")
				.withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
				.filter((q) => q.eq(q.field("role"), "ADMIN"))
				.collect();

			if (admins.length === 1 && member.role === "ADMIN") {
				throw new Error("Cannot remove the last admin from the organization");
			}
		}

		await ctx.db.delete(args.memberId);
		return { success: true };
	},
});

export const updateMemberRole = mutation({
	args: {
		organizationId: v.id("organizations"),
		memberId: v.id("members"),
		role: v.union(v.literal("ADMIN"), v.literal("MEMBER")),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		const userId = user.userId ?? user._id;
		if (!(await canManageOrganization(ctx, args.organizationId, userId))) {
			throw new Error("You don't have permission to update members in this organization");
		}

		const member = await ctx.db.get(args.memberId);
		if (!member || member.organizationId !== args.organizationId) {
			throw new Error("Member not found");
		}

		if (member.userId === userId && member.role === "ADMIN" && args.role === "MEMBER") {
			const admins = await ctx.db
				.query("members")
				.withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
				.filter((q) => q.eq(q.field("role"), "ADMIN"))
				.collect();

			if (admins.length === 1) {
				throw new Error("Cannot demote the last admin from the organization");
			}
		}

		await ctx.db.patch(args.memberId, { role: args.role });
		return { success: true };
	},
});

export const deleteOrganization = mutation({
	args: {
		organizationId: v.id("organizations"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		const userId = user.userId ?? user._id;
		const org = await ctx.db.get(args.organizationId);
		if (!org) throw new Error("Organization not found");

		// Check if it's the main org
		if (org.parentOrgId === null) {
			// Only main org admins can delete main org
			if (!(await checkIsAdmin(ctx, args.organizationId, userId))) {
				throw new Error("Only main organization admins can delete the main organization");
			}

			// Check if there are child orgs
			const childOrgs = await ctx.db
				.query("organizations")
				.filter((q) => q.eq(q.field("parentOrgId"), args.organizationId))
				.collect();

			if (childOrgs.length > 0) {
				throw new Error("Cannot delete main organization while child organizations exist");
			}
		} else {
			// For child orgs, check if user can manage it
			if (!(await canManageOrganization(ctx, args.organizationId, userId))) {
				throw new Error("You don't have permission to delete this organization");
			}
		}

		// Delete all members of this organization
		const members = await ctx.db
			.query("members")
			.withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
			.collect();

		for (const member of members) {
			await ctx.db.delete(member._id);
		}

		// Delete the organization
		await ctx.db.delete(args.organizationId);

		return { success: true };
	},
});


