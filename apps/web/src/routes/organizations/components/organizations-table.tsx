import { useNavigate } from "@tanstack/react-router";
import { Building2, Shield, Users } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Id } from "@ino-trips/backend/convex/_generated/dataModel";

interface Organization {
	_id: Id<"organizations">;
	name: string;
	slug: string;
	parentOrgId: Id<"organizations"> | null;
	members: Array<{
		_id: Id<"members">;
		userId: string;
		role: "ADMIN" | "MEMBER";
	} | null>;
}

interface OrganizationsTableProps {
	organizations: Organization[];
	isMainOrg?: boolean;
}

export function OrganizationsTable({
	organizations,
	isMainOrg = false,
}: OrganizationsTableProps) {
	const navigate = useNavigate();

	if (organizations.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
				<p>No organizations found</p>
			</div>
		);
	}

	return (
		<div className="border rounded-lg">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Slug</TableHead>
						<TableHead>Type</TableHead>
						<TableHead className="text-center">Admins</TableHead>
						<TableHead className="text-center">Members</TableHead>
						<TableHead className="text-center">Total</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{organizations.map((org) => {
						const validMembers = org.members.filter((m): m is NonNullable<typeof m> => m !== null);
						const admins = validMembers.filter((m) => m.role === "ADMIN").length;
						const members = validMembers.filter((m) => m.role === "MEMBER").length;
						const total = validMembers.length;

						return (
							<TableRow
								key={org._id}
								className="cursor-pointer hover:bg-gray-50"
								onClick={() =>
									navigate({
										to: "/organizations/$orgId",
										params: { orgId: org._id },
									})
								}
							>
								<TableCell className="font-medium">
									<div className="flex items-center gap-2">
										<Building2 className="w-4 h-4 text-gray-400" />
										{org.name}
									</div>
								</TableCell>
								<TableCell className="text-gray-600">/{org.slug}</TableCell>
								<TableCell>
									{org.parentOrgId === null ? (
										<span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
											Main Org
										</span>
									) : (
										<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
											Child Org
										</span>
									)}
								</TableCell>
								<TableCell className="text-center">
									<div className="flex items-center justify-center gap-1">
										<Shield className="w-4 h-4 text-purple-600" />
										{admins}
									</div>
								</TableCell>
								<TableCell className="text-center">
									<div className="flex items-center justify-center gap-1">
										<Users className="w-4 h-4 text-blue-600" />
										{members}
									</div>
								</TableCell>
								<TableCell className="text-center font-semibold">{total}</TableCell>
								<TableCell className="text-right">
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											navigate({
												to: "/organizations/$orgId",
												params: { orgId: org._id },
											});
										}}
									>
										View
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

