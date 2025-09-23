import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";
import type { SessionRole } from ".";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "USER" | "EDITOR" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "USER" | "EDITOR" | "ADMIN";
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Resend({
      from: process.env.RESEND_EMAIL_FROM!,
      apiKey: process.env.RESEND_API_KEY, // optional if you use AUTH_RESEND_KEY
    }),
    DiscordProvider,
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify",
    newUser: "/auth/welcome",
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Suppress noisy console errors for expected auth flows (e.g. account-not-linked)
  logger: {
    error(error) {
      // Ignore OAuthAccountNotLinked which is handled on the client UI
      if (
        error?.name === "OAuthAccountNotLinked" ||
        error?.message?.toLowerCase().includes("accountnotlinked")
      ) {
        return;
      }
      console.error(error);
    },
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: (user as { role?: SessionRole })?.role ?? "USER",
      },
    }),
    async redirect({ url, baseUrl }) {
      try {
        // Allow relative callback paths
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        const target = new URL(url);
        // Allow same-origin absolute URLs
        if (target.origin === baseUrl) return url;
      } catch {
        // ignore and fallback
      }
      // Fallback to site root
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;
