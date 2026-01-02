import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@ino-trips/backend/convex/_generated/api";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Id } from "@ino-trips/backend/convex/_generated/dataModel";

interface AddMemberDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: Id<"organizations">;
}

export function AddMemberDialog({
	open,
	onOpenChange,
	organizationId,
}: AddMemberDialogProps) {
	const [userId, setUserId] = useState("");
	const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
	const [isAdding, setIsAdding] = useState(false);
	const addMember = useMutation(api.organizations.addMember);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userId.trim() || isAdding) return;

		setIsAdding(true);
		try {
			await addMember({
				organizationId,
				userId: userId.trim(),
				role,
			});
			setUserId("");
			setRole("MEMBER");
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to add member:", error);
			alert(error instanceof Error ? error.message : "Failed to add member");
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Member</DialogTitle>
					<DialogDescription>
						Add a new member to this organization by their user ID.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="userId">User ID</Label>
							<Input
								id="userId"
								placeholder="Enter user ID"
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								required
								disabled={isAdding}
							/>
							<p className="text-xs text-gray-500">
								Note: In a production app, you would invite by email. For now, use
								the user ID from better-auth.
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="role">Role</Label>
							<Select
								value={role}
								onValueChange={(value: "ADMIN" | "MEMBER") => setRole(value)}
								disabled={isAdding}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MEMBER">Member</SelectItem>
									<SelectItem value="ADMIN">Admin</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isAdding}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isAdding || !userId.trim()}>
							{isAdding ? "Adding..." : "Add Member"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

