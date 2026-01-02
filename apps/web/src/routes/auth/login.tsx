import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { type LoginFormData, loginSchema } from "@/schemas/login.schema";

export const Route = createFileRoute("/auth/login")({
	component: LoginComponent,
});

function LoginComponent() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			rememberMe: true,
		},
	});

	const onSubmit = async (data: LoginFormData) => {
		setError(null);
		setIsLoading(true);

		await authClient.signIn.email(
			{
				email: data.email,
				password: data.password,
				rememberMe: data.rememberMe,
				callbackURL: `${window.location.origin}/`,
			},
			{
				onSuccess: () => {
					// Redirect will be handled by the home page based on user type
					navigate({ to: "/" });
					setIsLoading(false);
				},
				onError: (ctx) => {
					setError(ctx.error.message);
					setIsLoading(false);
				},
			},
		);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
					<CardDescription>
						Enter your email and password to sign in to your account
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
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Password</Label>
								<Button
									type="button"
									variant="link"
									className="h-auto p-0 text-xs"
									onClick={() => navigate({ to: "/auth/forgot-password" })}
								>
									Forgot password?
								</Button>
							</div>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="Enter your password"
									{...register("password")}
									disabled={isLoading}
									autoComplete="current-password"
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
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="remember"
								{...register("rememberMe")}
								className="h-4 w-4 rounded border-gray-300"
								disabled={isLoading}
							/>
							<Label
								htmlFor="remember"
								className="text-xs font-normal cursor-pointer"
							>
								Remember me
							</Label>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4 pt-6">
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Signing in...
								</>
							) : (
								"Sign in"
							)}
						</Button>
						<div className="text-center text-sm text-muted-foreground">
							Don't have an account?{" "}
							<Button
								type="button"
								variant="link"
								className="h-auto p-0 text-xs"
								onClick={() => navigate({ to: "/auth/signup" })}
							>
								Sign up
							</Button>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
