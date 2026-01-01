import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
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
import { type SignupFormData, signupSchema } from "@/schemas/signup.schema";

export const Route = createFileRoute("/auth/signup")({
	component: SignUpComponent,
});

function SignUpComponent() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [userEmail, setUserEmail] = useState("");
	const [isResending, setIsResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
	});

	const onSubmit = async (data: SignupFormData) => {
		setError(null);
		setIsLoading(true);

		await authClient.signUp.email(
			{
				name: data.name,
				email: data.email,
				password: data.password,
				callbackURL: `${window.location.origin}/auth/email-verified`,
			},
			{
				onSuccess: () => {
					setUserEmail(data.email);
					setSuccess(true);
				},
				onError: (ctx) => {
					setError(ctx.error.message);
					setIsLoading(false);
				},
			},
		);
	};

	const handleResendEmail = async () => {
		if (!userEmail) return;

		setIsResending(true);
		setResendSuccess(false);
		setError(null);

		await authClient.sendVerificationEmail(
			{
				email: userEmail,
				callbackURL: `${window.location.origin}/auth/email-verified`,
			},
			{
				onSuccess: () => {
					setResendSuccess(true);
					setIsResending(false);
				},
				onError: (ctx) => {
					setError(ctx.error.message);
					setIsResending(false);
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
							We've sent a verification link to <strong>{userEmail}</strong>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						{resendSuccess && (
							<Alert>
								<AlertDescription>
									Verification email sent successfully! Please check your inbox.
								</AlertDescription>
							</Alert>
						)}
						<p className="text-center text-sm text-muted-foreground">
							Click the link in the email to verify your account. If you don't
							see the email, check your spam folder.
						</p>
					</CardContent>
					<CardFooter className="flex flex-col space-y-2">
						<Button
							variant="outline"
							className="w-full"
							onClick={handleResendEmail}
							disabled={isResending}
						>
							{isResending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Sending...
								</>
							) : (
								"Resend verification link"
							)}
						</Button>
						<Button
							variant="ghost"
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
					<CardTitle className="text-2xl font-bold">
						Create an account
					</CardTitle>
					<CardDescription>
						Enter your information to create a new account
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
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="John Doe"
								{...register("name")}
								disabled={isLoading}
								autoComplete="name"
							/>
							{errors.name && (
								<p className="text-xs text-destructive">
									{errors.name.message}
								</p>
							)}
						</div>
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
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
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
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									placeholder="Confirm your password"
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
					<CardFooter className="flex flex-col space-y-4">
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating account...
								</>
							) : (
								"Create account"
							)}
						</Button>
						<div className="text-center text-sm text-muted-foreground">
							Already have an account?{" "}
							<Button
								type="button"
								variant="link"
								className="h-auto p-0 text-xs"
								onClick={() => navigate({ to: "/auth/login" })}
							>
								Sign in
							</Button>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
