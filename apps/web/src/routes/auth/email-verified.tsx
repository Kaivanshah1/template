import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/auth/email-verified")({
	component: EmailVerifiedComponent,
});

function EmailVerifiedComponent() {
	const navigate = useNavigate();

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<Mail className="h-6 w-6 text-primary" />
					</div>
					<CardTitle className="text-2xl font-bold">Email Verified</CardTitle>
					<CardDescription>
						Your email address has been successfully verified.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
						<CheckCircle className="h-4 w-4 text-primary" />
						<p>You can now sign in to your account.</p>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						onClick={() => navigate({ to: "/auth/login" })}
					>
						Sign In
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
