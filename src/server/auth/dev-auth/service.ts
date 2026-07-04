import "server-only";

import { env } from "~/env";
import type { User } from "~/server/db/schema";

import {
  createDevelopmentUserData,
  findUserByEmailData,
} from "./data";

const DEFAULT_DEV_AUTH_EMAIL = "dev@sharply.local";

type DevelopmentAuthConfig = {
  nodeEnv: "development" | "test" | "production";
  devAuthFlag?: string;
  devAuthEmail?: string;
  localhostOnlyFlag?: string;
  devAuthPreviewFlag?: string;
};

export function isDevelopmentAuthEnabledForConfig({
  nodeEnv,
  devAuthFlag,
  devAuthPreviewFlag,
}: DevelopmentAuthConfig) {
  if (devAuthFlag !== "true") {
    return false;
  }

  if (nodeEnv !== "production") {
    return true;
  }

  return devAuthPreviewFlag === "true";
}

export function resolveDevelopmentAuthEmail({
  devAuthEmail,
}: DevelopmentAuthConfig) {
  return devAuthEmail ?? DEFAULT_DEV_AUTH_EMAIL;
}

export function isDevelopmentAuthEnabled() {
  // Keep this logic centralized so the route and service both reject the bypass
  // whenever production code is running, even if DEV_AUTH is accidentally set.
  return isDevelopmentAuthEnabledForConfig({
    nodeEnv: env.NODE_ENV,
    devAuthFlag: env.DEV_AUTH,
    devAuthPreviewFlag: env.DEV_AUTH_PREVIEW,
  });
}

export function getDevelopmentAuthEmail() {
  return resolveDevelopmentAuthEmail({
    nodeEnv: env.NODE_ENV,
    devAuthFlag: env.DEV_AUTH,
    devAuthEmail: env.DEV_AUTH_EMAIL,
  });
}

export function isDevelopmentAuthHostAllowed(
  host: string | null | undefined,
  localhostOnlyFlag = env.DEV_AUTH_LOCALHOST_ONLY,
) {
  if (localhostOnlyFlag === "false") {
    return true;
  }

  if (!host) {
    return false;
  }

  const hostname = host.split(":")[0]?.toLowerCase();
  return hostname === "localhost";
}

export function isDevelopmentAuthRequestAllowed(host: string | null | undefined) {
  return isDevelopmentAuthEnabled() && isDevelopmentAuthHostAllowed(host);
}

export async function getOrCreateDevelopmentAuthUser(): Promise<User> {
  if (!isDevelopmentAuthEnabled()) {
    throw new Error(
      "Development auth bypass is disabled. Set DEV_AUTH=true outside production, or add DEV_AUTH_PREVIEW=true for localhost preview/e2e runs.",
    );
  }

  const email = getDevelopmentAuthEmail();
  const existingUser = await findUserByEmailData(email);

  if (existingUser) {
    return existingUser;
  }

  return createDevelopmentUserData(email);
}
