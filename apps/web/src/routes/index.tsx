import { api } from "@ino-trips/backend/convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const navigate = useNavigate();
	const user = useQuery(api.auth.getCurrentUser);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	useEffect(() => {
		if (user === null) {
			navigate({ to: "/auth/login" });
		}
	}, [user, navigate]);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await authClient.signOut();
			navigate({ to: "/auth/login" });
		} catch (error) {
			console.error("Error logging out:", error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<>
			<Authenticated>
				<div className="container mx-auto max-w-4xl px-4 py-8">
					<div className="flex items-start justify-between mb-6">
						<div>
							<h1 className="text-3xl font-bold mb-4">Welcome back!</h1>
							<p className="text-muted-foreground">
								You are successfully authenticated.
							</p>
						</div>
						<Button
							variant="outline"
							onClick={handleLogout}
							disabled={isLoggingOut}
							className="flex items-center gap-2"
						>
							<LogOut className="h-4 w-4" />
							{isLoggingOut ? "Logging out..." : "Logout"}
						</Button>
					</div>
				</div>
			</Authenticated>
			<Unauthenticated>
				<div className="flex min-h-screen items-center justify-center">
					<p>Redirecting to login...</p>
				</div>
			</Unauthenticated>
			<AuthLoading>
				<div className="flex min-h-screen items-center justify-center">
					<p>Loading...</p>
				</div>
			</AuthLoading>
		</>
	);
}
