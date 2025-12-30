import { betterAuth, url } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db"; // your drizzle instance
import * as schema from "~/server/db/schema";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { resend } from "~/lib/email";

const userRoleValues = schema.userRoleEnum.enumValues;

export const auth = betterAuth({
  // config
  appName: "Sharply",
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
  trustedOrigins: ["http://localhost:3000", process.env.NEXT_PUBLIC_BASE_URL!],
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
    },
    discord: {
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
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

  user: {
    modelName: "user",
    additionalFields: {
      role: {
        type: userRoleValues,
        required: true,
        defaultValue: "USER",
      },
      memberNumber: {
        type: "number",
        required: true,
        defaultValue: 0,
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
    nextCookies(),
    passkey(),
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
        if (!process.env.RESEND_EMAIL_FROM) {
          throw new Error("RESEND_EMAIL_FROM is not set");
        }
        await resend.emails.send({
          from: process.env.RESEND_EMAIL_FROM,
          to: email,
          subject,
          text,
        });
      },
    }),
  ],
});

// auth types
// TODO: replace any user type imports from schema with this and remove the old export from schema (just moving it here)
export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"];
export type UserRole = (typeof userRoleValues)[number];
