import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	organizations: defineTable({
		name: v.string(),
		slug: v.string(),
		parentOrgId: v.union(v.id("organizations"), v.null()),
	})
		.index("by_slug", ["slug"])
		.index("by_parent", ["parentOrgId"]),

	members: defineTable({
		organizationId: v.id("organizations"),
		userId: v.string(), // better-auth user id
		role: v.union(v.literal("ADMIN"), v.literal("MEMBER")),
	})
		.index("by_organization", ["organizationId"])
		.index("by_user", ["userId"])
		.index("by_org_and_user", ["organizationId", "userId"]),
});
