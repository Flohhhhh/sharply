import { describe,expect,it } from "vitest";
import {
  calculateInactivityExpiry,
  hasBingoLine,
  shouldExpireForInactivity,
} from "~/server/bingo/lifecycle";

describe("bingo lifecycle helpers", () => {
  it("calculates inactivity expiry from now + duration", () => {
    const now = new Date("2026-03-06T12:00:00.000Z");
    const expiry = calculateInactivityExpiry(now, 4 * 60 * 60);
    expect(expiry.toISOString()).toBe("2026-03-06T16:00:00.000Z");
  });

  it("expires only when a started timer reaches expiresAt", () => {
    const now = new Date("2026-03-06T16:00:00.000Z");
    expect(
      shouldExpireForInactivity({
        now,
        firstCompletedAt: null,
        expiresAt: null,
      }),
    ).toBe(false);

    expect(
      shouldExpireForInactivity({
        now,
        firstCompletedAt: new Date("2026-03-06T12:00:00.000Z"),
        expiresAt: new Date("2026-03-06T16:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("detects a horizontal bingo line", () => {
    expect(hasBingoLine([0, 1, 2, 3, 4])).toBe(true);
  });

  it("detects a vertical bingo line", () => {
    expect(hasBingoLine([1, 6, 11, 16, 21])).toBe(true);
  });

  it("detects both diagonal bingo lines", () => {
    expect(hasBingoLine([0, 6, 12, 18, 24])).toBe(true);
    expect(hasBingoLine([4, 8, 12, 16, 20])).toBe(true);
  });

  it("returns false when no full line is completed", () => {
    expect(hasBingoLine([0, 1, 2, 3, 6, 7, 8])).toBe(false);
  });
});
