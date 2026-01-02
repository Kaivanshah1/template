import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@ino-trips/backend/convex/_generated/api";
import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrganizationFormDialog } from "./components/organization-form-dialog";
import { OrganizationsTable } from "./components/organizations-table";
import { AddMemberDialog } from "./components/add-member-dialog";

export const Route = createFileRoute("/organizations/")({
	component: OrganizationsPage,
});

function OrganizationsPage() {
	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const allOrgs = useQuery(api.organizations.getAllOrgs);
	const isMainAdmin = useQuery(api.organizations.isMainOrgAdmin);
	const userPrimaryOrg = useQuery(api.organizations.getUserPrimaryOrg);

	// Filter organizations based on user type
	const displayOrgs = userPrimaryOrg?.isChildOrg
		? {
				mainOrg: null,
				childOrgs: allOrgs?.childOrgs.filter(
					(org) => org._id === userPrimaryOrg.organization._id,
				) || [],
			}
		: allOrgs || { mainOrg: null, childOrgs: [] };

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							{userPrimaryOrg?.isChildOrg
								? userPrimaryOrg.organization.name
								: "Organizations"}
						</h1>
						<p className="text-gray-600">
							{userPrimaryOrg?.isChildOrg
								? "Your organization workspace"
								: "Manage your organization hierarchy and child organizations"}
						</p>
					</div>
					{!allOrgs?.mainOrg && (
						<Button onClick={() => setIsFormDialogOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Create Main Organization
						</Button>
					)}
					{allOrgs?.mainOrg && isMainAdmin && (
						<Button onClick={() => setIsFormDialogOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Create Child Org
						</Button>
					)}
				</div>

				{/* Organizations Table */}
				{allOrgs === undefined || userPrimaryOrg === undefined ? (
					<div className="text-center py-12">
						<p className="text-gray-500">Loading organizations...</p>
					</div>
				) : displayOrgs.mainOrg || displayOrgs.childOrgs.length > 0 ? (
					<div className="space-y-6">
						{/* Main Organization */}
						{displayOrgs.mainOrg && (
							<div>
								<h2 className="text-xl font-semibold text-gray-800 mb-4">
									Main Organization
								</h2>
								<OrganizationsTable
									organizations={[displayOrgs.mainOrg]}
									isMainOrg={true}
								/>
							</div>
						)}

						{/* Child Organizations */}
						{displayOrgs.childOrgs.length > 0 && (
							<div>
								<h2 className="text-xl font-semibold text-gray-800 mb-4">
									{userPrimaryOrg?.isChildOrg
										? "Organization Details"
										: `Child Organizations (${displayOrgs.childOrgs.length})`}
								</h2>
								<OrganizationsTable
									organizations={displayOrgs.childOrgs}
									isMainOrg={false}
								/>
							</div>
						)}
					</div>
				) : (
					<Card className="p-12 text-center">
						<Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							No organizations yet
						</h3>
						<p className="text-gray-600 mb-4">
							{!allOrgs?.mainOrg
								? "Create your main organization to get started"
								: "You need to be a main organization admin to create organizations"}
						</p>
						{!allOrgs?.mainOrg && (
							<Button onClick={() => setIsFormDialogOpen(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Create Main Organization
							</Button>
						)}
					</Card>
				)}

				{/* Organization Form Dialog */}
				{(!allOrgs?.mainOrg || isMainAdmin) && (
					<OrganizationFormDialog
						open={isFormDialogOpen}
						onOpenChange={setIsFormDialogOpen}
						isMainOrgExists={!!allOrgs?.mainOrg}
					/>
				)}

			</div>
		</div>
	);
}
