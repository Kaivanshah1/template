import { zodResolver } from "@hookform/resolvers/zod";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
	type ResetPasswordFormData,
	resetPasswordSchema,
} from "@/schemas/reset-password.schema";

export const Route = createFileRoute("/auth/reset-password")({
	component: ResetPasswordComponent,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			token: (search.token as string) || "",
		};
	},
});

function ResetPasswordComponent() {
	const navigate = useNavigate();
	const { token } = useSearch({ from: "/auth/reset-password" });
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
	});

	const onSubmit = async (data: ResetPasswordFormData) => {
		if (!token) {
			setError(
				"Invalid reset token. Please request a new password reset link.",
			);
			return;
		}

		setError(null);
		setIsLoading(true);

		await authClient.resetPassword(
			{
				newPassword: data.password,
				token,
			},
			{
				onSuccess: () => {
					setSuccess(true);
					setIsLoading(false);
					setTimeout(() => {
						navigate({ to: "/auth/login" });
					}, 2000);
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
						<CardTitle className="text-2xl font-bold">
							Password reset successful
						</CardTitle>
						<CardDescription>
							Your password has been reset. Redirecting to login...
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">
						Reset your password
					</CardTitle>
					<CardDescription>Enter your new password below</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className="space-y-2">
							<Label htmlFor="password">New Password</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="At least 8 characters"
									{...register("password")}
									disabled={isLoading}
									autoComplete="new-password"
									className="pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowPassword(!showPassword)}
									disabled={isLoading}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4 text-muted-foreground" />
									) : (
										<Eye className="h-4 w-4 text-muted-foreground" />
									)}
								</Button>
							</div>
							{errors.password && (
								<p className="text-xs text-destructive">
									{errors.password.message}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Must be at least 8 characters long
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm New Password</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									placeholder="Confirm your new password"
									{...register("confirmPassword")}
									disabled={isLoading}
									autoComplete="new-password"
									className="pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									disabled={isLoading}
								>
									{showConfirmPassword ? (
										<EyeOff className="h-4 w-4 text-muted-foreground" />
									) : (
										<Eye className="h-4 w-4 text-muted-foreground" />
									)}
								</Button>
							</div>
							{errors.confirmPassword && (
								<p className="text-xs text-destructive">
									{errors.confirmPassword.message}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4 pt-6">
						<Button
							type="submit"
							className="w-full"
							disabled={isLoading || !token}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Resetting password...
								</>
							) : (
								"Reset password"
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
