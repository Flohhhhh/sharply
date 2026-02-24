import { describe, expect, it } from "vitest";
import { testReviewSafety } from "~/server/reviews/moderation/service";

const USER_ID = "test-user-id";

describe("testReviewSafety", () => {
  it("allows a clean review", async () => {
    const result = await testReviewSafety({
      userId: USER_ID,
      body: "This camera has excellent autofocus and battery life.",
      now: 100_000,
      recentReviewCreatedAts: [],
    });

    expect(result).toEqual({
      ok: true,
      normalizedBody: "This camera has excellent autofocus and battery life.",
    });
  });

  it("blocks profanity", async () => {
    const result = await testReviewSafety({
      userId: USER_ID,
      body: "fuck this",
      now: 100_000,
      recentReviewCreatedAts: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected moderation failure");
    }
    expect(result.code).toBe("REVIEW_PROFANITY_BLOCKED");
  });

  it("blocks explicit URLs and plain domains", async () => {
    const explicitUrl = await testReviewSafety({
      userId: USER_ID,
      body: "check this https://example.com",
      now: 100_000,
      recentReviewCreatedAts: [],
    });
    expect(explicitUrl.ok).toBe(false);
    if (explicitUrl.ok) {
      throw new Error("Expected URL block");
    }
    expect(explicitUrl.code).toBe("REVIEW_LINK_BLOCKED");

    const plainDomain = await testReviewSafety({
      userId: USER_ID,
      body: "visit example.com for details",
      now: 100_000,
      recentReviewCreatedAts: [],
    });
    expect(plainDomain.ok).toBe(false);
    if (plainDomain.ok) {
      throw new Error("Expected domain block");
    }
    expect(plainDomain.code).toBe("REVIEW_LINK_BLOCKED");
  });

  it("blocks known bot UAs and allows legitimate UAs", async () => {
    const blocked = await testReviewSafety({
      userId: USER_ID,
      body: "normal text",
      userAgent: "Mozilla/5.0 HeadlessChrome/122.0.0.0",
      now: 100_000,
      recentReviewCreatedAts: [],
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) {
      throw new Error("Expected bot UA block");
    }
    expect(blocked.code).toBe("REVIEW_BOT_UA_BLOCKED");

    const allowed = await testReviewSafety({
      userId: USER_ID,
      body: "normal text",
      userAgent: "WhatsApp/2.24.5 i",
      now: 100_000,
      recentReviewCreatedAts: [],
    });
    expect(allowed.ok).toBe(true);
  });

  it("applies rate limits with retryAfterMs", async () => {
    const now = 100_000;
    const belowThreshold = await testReviewSafety({
      userId: USER_ID,
      body: "Second review attempt",
      now,
      recentReviewCreatedAts: [now - 11_000],
    });
    expect(belowThreshold.ok).toBe(true);

    const aboveThreshold = await testReviewSafety({
      userId: USER_ID,
      body: "Too fast",
      now,
      recentReviewCreatedAts: [now - 2_000],
    });
    expect(aboveThreshold.ok).toBe(false);
    if (aboveThreshold.ok) {
      throw new Error("Expected rate limit block");
    }
    expect(aboveThreshold.code).toBe("REVIEW_RATE_LIMITED");
    expect(aboveThreshold.retryAfterMs).toBeGreaterThan(0);
  });
});
