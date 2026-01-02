import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@ino-trips/backend/convex/_generated/api";
import { ArrowLeft, Building2, Users, Shield, User, Plus, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddMemberDialog } from "./components/add-member-dialog";
import type { Id } from "@ino-trips/backend/convex/_generated/dataModel";

export const Route = createFileRoute("/organizations/$orgId")({
	component: OrganizationDetailPage,
});

function MemberItem({
	member,
	currentUserId,
	canManage,
	onRemove,
	onUpdateRole,
}: {
	member: { _id: Id<"members">; userId: string; role: "ADMIN" | "MEMBER" };
	currentUserId?: string;
	canManage?: boolean;
	onRemove: (memberId: Id<"members">) => void;
	onUpdateRole: (memberId: Id<"members">, newRole: "ADMIN" | "MEMBER") => void;
}) {
	const memberUser = useQuery(api.auth.getUserById, { userId: member.userId });

	return (
		<div className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
			<div className="flex items-center gap-3">
				<div
					className={`p-2 rounded ${
						member.role === "ADMIN"
							? "bg-purple-100 text-purple-600"
							: "bg-blue-100 text-blue-600"
					}`}
				>
					{member.role === "ADMIN" ? (
						<Shield className="w-4 h-4" />
					) : (
						<User className="w-4 h-4" />
					)}
				</div>
				<div>
					<span className="text-sm font-medium text-gray-900">
						{memberUser?.name || memberUser?.email || memberUser?.username || memberUser?.displayUsername || member.userId}
					</span>
					{member.userId === currentUserId && (
						<span className="ml-2 text-xs text-gray-500">(You)</span>
					)}
				</div>
				<span
					className={`px-2 py-1 text-xs font-medium rounded ${
						member.role === "ADMIN"
							? "bg-purple-100 text-purple-700"
							: "bg-blue-100 text-blue-700"
					}`}
				>
					{member.role}
				</span>
			</div>
			{canManage && member.userId !== currentUserId && (
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							onUpdateRole(
								member._id,
								member.role === "ADMIN" ? "MEMBER" : "ADMIN",
							)
						}
						className="h-8 w-8 p-0"
					>
						<Edit className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onRemove(member._id)}
						className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			)}
		</div>
	);
}

function OrganizationDetailPage() {
	const navigate = useNavigate();
	const { orgId } = Route.useParams();
	const allOrgs = useQuery(api.organizations.getAllOrgs);
	const user = useQuery(api.auth.getCurrentUser);
		const userPrimaryOrg = useQuery(api.organizations.getUserPrimaryOrg);
	const isMainAdmin = useQuery(api.organizations.isMainOrgAdmin);
	const canManage = useQuery(api.organizations.canManageOrg, {
		orgId: orgId as Id<"organizations">,
	});
	const canAddMembers = useQuery(api.organizations.canAddMembersToOrg, {
		orgId: orgId as Id<"organizations">,
	});
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const removeMember = useMutation(api.organizations.removeMember);
	const updateMemberRole = useMutation(api.organizations.updateMemberRole);
	const deleteOrganization = useMutation(api.organizations.deleteOrganization);

	const organization =
		allOrgs?.mainOrg?._id === orgId
			? allOrgs.mainOrg
			: allOrgs?.childOrgs.find((org) => org._id === orgId);

	if (allOrgs === undefined) {
		return (
			<div className="min-h-screen bg-gray-50 p-4 md:p-8">
				<div className="max-w-4xl mx-auto">
					<p className="text-gray-500">Loading...</p>
				</div>
			</div>
		);
	}

	if (!organization) {
		return (
			<div className="min-h-screen bg-gray-50 p-4 md:p-8">
				<div className="max-w-4xl mx-auto">
					<Button
						variant="ghost"
						onClick={() => navigate({ to: "/organizations" })}
						className="mb-4"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Organizations
					</Button>
					<Card className="p-8 text-center">
						<p className="text-gray-500">Organization not found</p>
					</Card>
				</div>
			</div>
		);
	}

	const isMainOrg = organization.parentOrgId === null;
	const currentUserId = user?.userId ?? user?._id;
	
	// Permission checks
	const isChildOrgAdmin = !isMainOrg && userPrimaryOrg?.organization._id === orgId && userPrimaryOrg?.role === "ADMIN";
	const canManageMembers = isMainAdmin || isChildOrgAdmin;
	const canDeleteOrg = isMainAdmin || isChildOrgAdmin;

	const handleRemoveMember = async (memberId: Id<"members">) => {
		if (!confirm("Are you sure you want to remove this member?")) return;
		try {
			await removeMember({
				organizationId: orgId as Id<"organizations">,
				memberId,
			});
		} catch (error) {
			alert(error instanceof Error ? error.message : "Failed to remove member");
		}
	};

	const handleUpdateRole = async (
		memberId: Id<"members">,
		newRole: "ADMIN" | "MEMBER",
	) => {
		try {
			await updateMemberRole({
				organizationId: orgId as Id<"organizations">,
				memberId,
				role: newRole,
			});
		} catch (error) {
			alert(error instanceof Error ? error.message : "Failed to update role");
		}
	};

	const handleDeleteOrg = async () => {
		const message = isMainOrg
			? "Are you sure you want to delete the main organization? This action cannot be undone."
			: "Are you sure you want to delete this organization? This will also delete all members. This action cannot be undone.";
		
		if (!confirm(message)) return;
		
		try {
			await deleteOrganization({
				organizationId: orgId as Id<"organizations">,
			});
			navigate({ to: "/organizations" });
		} catch (error) {
			alert(error instanceof Error ? error.message : "Failed to delete organization");
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-8">
			<div className="max-w-4xl mx-auto">
				<Button
							variant="ghost"
							onClick={() => navigate({ to: "/organizations" })}
							className="mb-6"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Organizations
						</Button>

				{/* Organization Header */}
				<Card
					className={`p-6 mb-6 ${
						isMainOrg ? "border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50" : ""
					}`}
				>
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-4">
							<div
								className={`p-3 rounded-lg ${
									isMainOrg
										? "bg-purple-100 text-purple-600"
										: "bg-blue-100 text-blue-600"
								}`}
							>
								<Building2 className="w-8 h-8" />
							</div>
							<div>
								<div className="flex items-center gap-3 mb-2">
									<h1 className="text-3xl font-bold text-gray-900">
										{organization.name}
									</h1>
									{isMainOrg && (
										<span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded">
											Main Organization
										</span>
									)}
								</div>
								<p className="text-gray-600">/{organization.slug}</p>
							</div>
						</div>
						{canDeleteOrg && (
							<Button
								variant="destructive"
								size="sm"
								onClick={handleDeleteOrg}
								className="flex items-center gap-2"
							>
								<Trash2 className="w-4 h-4" />
								Delete Organization
							</Button>
						)}
					</div>
				</Card>

				{/* Members Section */}
				<Card className="p-6 mb-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold text-lg flex items-center gap-2">
							<Users className="w-5 h-5 text-blue-600" />
							Members ({organization.members.length})
						</h3>
						{canAddMembers && (
							<Button
								size="sm"
								onClick={() => setIsAddMemberOpen(true)}
								className="flex items-center gap-2"
							>
								<Plus className="w-4 h-4" />
								Add Member
							</Button>
						)}
					</div>

					<div className="space-y-2">
						{organization.members.length > 0 ? (
							organization.members.map((member) => (
								<MemberItem
									key={member._id}
									member={member}
									currentUserId={currentUserId}
									canManage={canManageMembers}
									onRemove={handleRemoveMember}
									onUpdateRole={handleUpdateRole}
								/>
							))
						) : (
							<p className="text-sm text-gray-500 text-center py-4">
								No members yet
							</p>
						)}
					</div>
				</Card>

				{/* Add Member Dialog */}
				{canAddMembers && (
					<AddMemberDialog
						open={isAddMemberOpen}
						onOpenChange={setIsAddMemberOpen}
						organizationId={orgId as Id<"organizations">}
					/>
				)}
			</div>
		</div>
	);
}

