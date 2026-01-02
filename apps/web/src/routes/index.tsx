import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import { useEffect } from "react";
import { api } from "@ino-trips/backend/convex/_generated/api";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const navigate = useNavigate();
	const user = useQuery(api.auth.getCurrentUser);

	useEffect(() => {
		if (user === null) {
			navigate({ to: "/auth/login" });
		} else if (user) {
			navigate({ to: "/organizations" });
		}
	}, [user, navigate]);

	return (
		<>
			<Authenticated>
				<div className="flex min-h-screen items-center justify-center">
					<p>Redirecting...</p>
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
