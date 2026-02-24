if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn("[review-moderation:service] server-only import failed.");
  });
}

import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

const profanityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const URL_PROTOCOL_PATTERN = /\bhttps?:\/\/[^\s]+/i;
const WWW_PATTERN = /\bwww\.[^\s]+/i;
const DOMAIN_PATTERN =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/i;

const BOT_UA_PATTERNS = [
  "googlebot",
  "bingbot",
  "duckduckbot",
  "yandexbot",
  "baiduspider",
  "slurp",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "telegrambot",
  "headlesschrome",
  "phantomjs",
  "selenium",
  "puppeteer",
  "playwright",
] as const;

const RATE_LIMIT_WINDOWS = [
  { limit: 1, windowMs: 10_000 },
  { limit: 5, windowMs: 60_000 },
  { limit: 20, windowMs: 10 * 60_000 },
] as const;

const RATE_LIMIT_LOOKBACK =
  RATE_LIMIT_WINDOWS[RATE_LIMIT_WINDOWS.length - 1]!.limit;

export type ReviewModerationCode =
  | "REVIEW_TOO_SHORT"
  | "REVIEW_LINK_BLOCKED"
  | "REVIEW_PROFANITY_BLOCKED"
  | "REVIEW_BOT_UA_BLOCKED"
  | "REVIEW_RATE_LIMITED";

export type ReviewModerationResult =
  | {
      ok: true;
      normalizedBody: string;
    }
  | {
      ok: false;
      code: ReviewModerationCode;
      message: string;
      retryAfterMs?: number;
    };

export async function testReviewSafety(args: {
  userId: string;
  body: string;
  userAgent?: string;
  now?: number;
  skipRateLimit?: boolean;
  recentReviewCreatedAts?: number[];
}): Promise<ReviewModerationResult> {
  const normalizedBody = args.body.trim();

  if (normalizedBody.length < 2) {
    return {
      ok: false,
      code: "REVIEW_TOO_SHORT",
      message: "Review is too short.",
    };
  }

  if (containsBlockedLink(normalizedBody)) {
    return {
      ok: false,
      code: "REVIEW_LINK_BLOCKED",
      message: "Links are not allowed in reviews.",
    };
  }

  if (profanityMatcher.hasMatch(normalizedBody)) {
    return {
      ok: false,
      code: "REVIEW_PROFANITY_BLOCKED",
      message: "Please remove profanity from your review.",
    };
  }

  if (isBlockedBotUserAgent(args.userAgent)) {
    return {
      ok: false,
      code: "REVIEW_BOT_UA_BLOCKED",
      message: "Automated user agents cannot submit reviews.",
    };
  }

  if (!args.skipRateLimit) {
    const now = args.now ?? Date.now();
    const recentCreatedAts =
      args.recentReviewCreatedAts ??
      (await (async () => {
        const { fetchRecentReviewCreatedAtsByUser } = await import("./data");
        return fetchRecentReviewCreatedAtsByUser(args.userId, RATE_LIMIT_LOOKBACK);
      })());
    const violation = getRateLimitViolation(now, recentCreatedAts);
    if (violation) {
      return {
        ok: false,
        code: "REVIEW_RATE_LIMITED",
        message: "You're submitting reviews too quickly. Please wait.",
        retryAfterMs: violation.retryAfterMs,
      };
    }
  }

  return { ok: true, normalizedBody };
}

function containsBlockedLink(input: string) {
  return (
    URL_PROTOCOL_PATTERN.test(input) ||
    WWW_PATTERN.test(input) ||
    DOMAIN_PATTERN.test(input)
  );
}

function isBlockedBotUserAgent(userAgent: string | undefined) {
  if (!userAgent) return false;
  const normalizedUserAgent = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) =>
    normalizedUserAgent.includes(pattern),
  );
}

function getRateLimitViolation(now: number, createdAts: number[]) {
  let maxRetryAfterMs = 0;

  for (const window of RATE_LIMIT_WINDOWS) {
    const windowStart = now - window.windowMs;
    const withinWindow = createdAts.filter(
      (createdAt) => createdAt > windowStart,
    );
    if (withinWindow.length < window.limit) continue;

    const oldestWithinWindow = withinWindow[withinWindow.length - 1]!;
    const retryAfterMs = Math.max(
      1,
      oldestWithinWindow + window.windowMs - now + 1,
    );
    maxRetryAfterMs = Math.max(maxRetryAfterMs, retryAfterMs);
  }

  return maxRetryAfterMs > 0 ? { retryAfterMs: maxRetryAfterMs } : null;
}
