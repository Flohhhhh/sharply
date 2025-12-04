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
import { awardBadgeForce } from "~/server/badges/service";

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
      memberNumber?: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "USER" | "EDITOR" | "ADMIN";
    memberNumber?: number | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
// Build providers list conditionally so missing credentials in dev simply disable a provider
const providers: NextAuthConfig["providers"] = [];

if (process.env.RESEND_EMAIL_FROM && process.env.RESEND_API_KEY) {
  providers.push(
    Resend({
      from: process.env.RESEND_EMAIL_FROM,
      apiKey: process.env.RESEND_API_KEY,
    }),
  );
}

if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
  providers.push(
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  );
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

export const authConfig = {
  // debug: true,
  providers,
  pages: {
    signIn: "/auth/signin",
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
        // Ensure session reflects DB values for name and role
        name: (user as { name?: string | null })?.name ?? session.user?.name,
        role: (user as { role?: SessionRole })?.role ?? "USER",
        memberNumber:
          (user as { memberNumber?: number | null })?.memberNumber ?? null,
      },
    }),
    async signIn({ user }) {
      try {
        // Temporarily grant Pioneer badge on every sign-in
        if (user?.id) {
          await awardBadgeForce({
            userId: user.id,
            badgeKey: "pioneer",
            eventType: "auth.signin",
          });
        }
      } catch (err) {
        console.error("Failed to grant Pioneer badge on sign-in", err);
      }
      return true;
    },
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
