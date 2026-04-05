import "server-only";

import { env } from "~/env";
import { userRoleEnum, type User } from "~/server/db/schema";

import {
  createDevelopmentUserData,
  findUserByEmailData,
  updateDevelopmentUserData,
} from "./data";

const DEFAULT_DEV_AUTH_EMAIL = "dev@sharply.local";

type DevelopmentAuthConfig = {
  nodeEnv: "development" | "test" | "production";
  devAuthFlag?: string;
  devAuthEmail?: string;
  localhostOnlyFlag?: string;
};

export function isDevelopmentAuthEnabledForConfig({
  nodeEnv,
  devAuthFlag,
}: DevelopmentAuthConfig) {
  return nodeEnv !== "production" && devAuthFlag === "true";
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
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function isDevelopmentAuthRequestAllowed(host: string | null | undefined) {
  return isDevelopmentAuthEnabled() && isDevelopmentAuthHostAllowed(host);
}

export async function getOrCreateDevelopmentAuthUser(): Promise<User> {
  return getOrCreateDevelopmentAuthUserWithOverrides();
}

export async function getOrCreateDevelopmentAuthUserWithOverrides(params?: {
  email?: string;
  name?: string;
  role?: string;
  handle?: string | null;
}): Promise<User> {
  if (!isDevelopmentAuthEnabled()) {
    throw new Error(
      "Development auth bypass is disabled. Set DEV_AUTH=true outside production to enable it.",
    );
  }

  const email = params?.email ?? getDevelopmentAuthEmail();
  const name = params?.name ?? "Development User";
  const requestedRole = params?.role ?? "USER";
  const role = userRoleEnum.enumValues.includes(
    requestedRole as (typeof userRoleEnum.enumValues)[number],
  )
    ? (requestedRole as (typeof userRoleEnum.enumValues)[number])
    : "USER";
  const handle = params?.handle ?? null;
  const existingUser = await findUserByEmailData(email);

  if (existingUser) {
    return updateDevelopmentUserData(existingUser.id, {
      name,
      role,
      handle,
    });
  }

  return createDevelopmentUserData({
    email,
    name,
    role,
    handle,
  });
}
