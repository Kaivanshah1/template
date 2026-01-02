import { useState, useEffect } from "react";
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

interface OrganizationFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isMainOrgExists: boolean;
}

export function OrganizationFormDialog({
	open,
	onOpenChange,
	isMainOrgExists,
}: OrganizationFormDialogProps) {
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const createMainOrg = useMutation(api.organizations.createMainOrg);
	const createChildOrg = useMutation(api.organizations.createChildOrg);

	useEffect(() => {
		if (!open) {
			setName("");
		}
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || isSubmitting) return;

		setIsSubmitting(true);
		try {
			if (isMainOrgExists) {
				await createChildOrg({ name: name.trim() });
			} else {
				await createMainOrg({ name: name.trim() });
			}
			setName("");
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to save organization:", error);
			alert(error instanceof Error ? error.message : "Failed to save organization");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isMainOrgExists ? "Create Child Organization" : "Create Main Organization"}
					</DialogTitle>
					<DialogDescription>
						{isMainOrgExists
							? "Create a new child organization under the main organization."
							: "Create the main organization. This can only be done once."}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Organization Name</Label>
							<Input
								id="name"
								placeholder="Enter organization name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={isSubmitting}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || !name.trim()}>
							{isSubmitting ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

