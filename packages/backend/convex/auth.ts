import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { sendEmail } from "./email";

const siteUrl = process.env.SITE_URL!;
const secret = process.env.BETTER_AUTH_SECRET!;

export const authComponent = createClient<DataModel>(components.betterAuth);

function createAuth(ctx: GenericCtx<DataModel>) {
	return betterAuth({
		secret,
		trustedOrigins: [siteUrl],
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				try {
					await sendEmail({
						to: user.email,
						subject: "Reset your password",
						html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
					});
				} catch (error) {
					console.error("Failed to send password reset email:", error);
				}
			},
		},
		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				try {
					await sendEmail({
						to: user.email,
						subject: "Verify your email address",
						html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
					});
				} catch (error) {
					console.error("Failed to send verification email:", error);
				}
			},
		},
		plugins: [
			crossDomain({ siteUrl }),
			convex({
				authConfig,
				jwksRotateOnTokenGenerationError: true,
			}),
		],
	});
}

export { createAuth };

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return await authComponent.safeGetAuthUser(ctx);
	},
});

export const getUserById = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		// Try querying by _id first (most common case)
		let user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "user",
			where: [
				{
					field: "_id",
					operator: "eq",
					value: args.userId,
				},
			],
		});
				
		return user;
	},
});
