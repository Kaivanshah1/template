import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";	
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
	type ForgotPasswordFormData,
	forgotPasswordSchema,
} from "@/schemas/forgot-password.schema";

export const Route = createFileRoute("/auth/forgot-password")({
	component: ForgotPasswordComponent,
});

function ForgotPasswordComponent() {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
	});

	const onSubmit = async (data: ForgotPasswordFormData) => {
		setError(null);
		setIsLoading(true);

		await authClient.requestPasswordReset(
			{
				email: data.email,
				redirectTo: window.location.origin + "/auth/reset-password",
			},
			{
				onSuccess: () => {
					setSuccess(true);
					setIsLoading(false);
				},
				onError: (ctx) => {
					setError(ctx.error.message);
					setIsLoading(false);
				},
			},
		);
	};

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1 text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<Mail className="h-6 w-6 text-primary" />
						</div>
						<CardTitle className="text-2xl font-bold">
							Check your email
						</CardTitle>
						<CardDescription>
							We've sent a password reset link to your email
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert>
							<AlertDescription>
								Click the link in the email to reset your password. If you don't
								see the email, check your spam folder.
							</AlertDescription>
						</Alert>
					</CardContent>
					<CardFooter>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => navigate({ to: "/auth/login" })}
						>
							Back to login
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
					<CardDescription>
						Enter your email address and we'll send you a link to reset your
						password
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								{...register("email")}
								disabled={isLoading}
								autoComplete="email"
							/>
							{errors.email && (
								<p className="text-xs text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4">
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Sending...
								</>
							) : (
								"Send reset link"
							)}
						</Button>
						<Button
							type="button"
							variant="link"
							className="w-full"
							onClick={() => navigate({ to: "/auth/login" })}
						>
							Back to login
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
