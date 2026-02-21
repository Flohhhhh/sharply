import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db"; // your drizzle instance
import * as schema from "~/server/db/schema";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";
import { passkey } from "@better-auth/passkey";
import { resend } from "~/lib/email";

const userRoleValues = schema.userRoleEnum.enumValues;
const emailOtpEnabled =
  !!resend &&
  !!process.env.RESEND_API_KEY &&
  !!process.env.RESEND_EMAIL_FROM;

function normalizeTrustedOrigin(origin: string) {
  const value = origin.trim();
  if (!value) return null;
  if (value.includes("*") || value.includes("?")) return value;
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

const additionalTrustedOrigins = process.env.AUTH_ADDITIONAL_TRUSTED_ORIGINS
  ?.split(",")
  .map(normalizeTrustedOrigin)
  .filter(Boolean) as string[] | undefined;
const canonicalAuthBaseUrl = normalizeTrustedOrigin(
  process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "",
);
const trustedOrigins = [
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000"] : []),
  ...(canonicalAuthBaseUrl ? [canonicalAuthBaseUrl] : []),
  ...(additionalTrustedOrigins ?? []),
].filter(Boolean) as string[];

if (process.env.NODE_ENV === "production") {
  console.info("[auth-callback-debug] trusted_origins_config", {
    betterAuthURL: process.env.BETTER_AUTH_URL ?? null,
    nextPublicBaseURL: process.env.NEXT_PUBLIC_BASE_URL,
    authBaseURL: canonicalAuthBaseUrl ?? null,
    oauthProxyEnabled: true,
    additionalTrustedOrigins: process.env.AUTH_ADDITIONAL_TRUSTED_ORIGINS,
    normalizedTrustedOrigins: trustedOrigins,
  });
}

export const auth = betterAuth({
  // config
  appName: "Sharply",
  baseURL: canonicalAuthBaseUrl!,
  trustedOrigins,
  secret: process.env.AUTH_SECRET!,

  // database adapter
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
      passkey: schema.passkeys,
    },
  }),

  // providers
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      redirectURI: new URL(
        "/api/auth/callback/google",
        canonicalAuthBaseUrl!,
      ).toString(),
    },
    discord: {
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      redirectURI: new URL(
        "/api/auth/callback/discord",
        canonicalAuthBaseUrl!,
      ).toString(),
    },
  },

  // tables

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "discord"],
      allowDifferentEmails: true,
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "compact",
    },
  },

  user: {
    modelName: "user",
    additionalFields: {
      handle: {
        type: "string",
        required: false,
      },
      role: {
        type: userRoleValues,
        required: true,
        defaultValue: "USER",
      },
      memberNumber: {
        type: "number",
        required: false,
      },
      inviteId: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      socialLinks: {
        type: "json",
        required: false,
        defaultValue: [],
      },
    },
  },
  // session: {
  //   modelName: "auth_sessions",
  // },
  // account: {
  //   modelName: "auth_accounts",
  // },
  // verification: {
  //   modelName: "auth_verifications",
  // },
  // plugins
  plugins: [
    oAuthProxy({
      productionURL: canonicalAuthBaseUrl!,
      maxAge: 60,
    }),
    nextCookies(),
    passkey(),
    ...(emailOtpEnabled
      ? [
          emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
              const subject =
                type === "sign-in"
                  ? "Your Sharply sign-in code"
                  : type === "email-verification"
                    ? "Verify your Sharply email"
                    : "Reset your Sharply password";
              const text = `Your code is ${otp}. It expires in 10 minutes. If you didn’t request this, please ignore.`;
              await resend!.emails.send({
                from: process.env.RESEND_EMAIL_FROM!,
                to: email,
                subject,
                text,
              });
            },
          }),
        ]
      : []),
  ],
});

// auth types
// TODO: replace any user type imports from schema with this and remove the old export from schema (just moving it here)
export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"];
export type UserRole = (typeof userRoleValues)[number];
