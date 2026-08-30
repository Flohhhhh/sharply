import "server-only";

import { env } from "~/env";

const DISCORD_CONTENT_LIMIT = 2_000;
const DISPLAY_NAME_LIMIT = 120;
const WEBHOOK_TIMEOUT_MS = 5_000;

export const USER_SIGNUP_PROVIDERS = [
  "Google",
  "Discord",
  "Development bypass",
  "Unknown",
] as const;

export type UserSignupProvider = (typeof USER_SIGNUP_PROVIDERS)[number];

export type NotifyUserSignupParams = {
  name: string | null | undefined;
  provider: UserSignupProvider;
};

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type NotifyUserSignupDeps = {
  fetch?: FetchLike;
  webhookUrl?: string;
};

export type NotifyUserSignupResult =
  | { status: "skipped_no_webhook" }
  | { status: "sent" }
  | { status: "failed" };

function sanitizeDisplayName(name: NotifyUserSignupParams["name"]) {
  const normalized = (name ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, DISPLAY_NAME_LIMIT);

  if (!normalized) return "Unnamed user";

  return normalized
    .replace(/@/g, "@\u200b")
    .replace(/([\\`*_{}\[\]<>|~])/g, "\\$1")
    .slice(0, DISPLAY_NAME_LIMIT);
}

function buildUserSignupContent(params: NotifyUserSignupParams) {
  const content = [
    "👋 **New user signup**",
    `- Name: ${sanitizeDisplayName(params.name)}`,
    `- Provider: ${params.provider}`,
  ].join("\n");

  return content.slice(0, DISCORD_CONTENT_LIMIT);
}

/**
 * Sends the general operational signup log. This notifier intentionally
 * absorbs every transport error so it can never interrupt account creation.
 */
export async function notifyUserSignup(
  params: NotifyUserSignupParams,
  deps?: NotifyUserSignupDeps,
): Promise<NotifyUserSignupResult> {
  const webhookUrl = deps?.webhookUrl ?? env.DISCORD_GENERAL_LOGS_WEBHOOK_URL;
  if (!webhookUrl) {
    return { status: "skipped_no_webhook" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await (deps?.fetch ?? fetch)(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Sharply General Logs",
        content: buildUserSignupContent(params),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[discord:general-logs] user signup webhook failed", {
        status: response.status,
      });
      return { status: "failed" };
    }

    return { status: "sent" };
  } catch (error) {
    console.error("[discord:general-logs] user signup webhook failed", {
      error,
    });
    return { status: "failed" };
  } finally {
    clearTimeout(timeout);
  }
}
