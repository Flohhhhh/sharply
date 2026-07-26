import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BULK_GEAR_REVIEW_DEBOUNCE_MS,
  createBulkGearReviewDebouncer,
} from "~/lib/admin/gear-bulk-review-debounce";

afterEach(() => {
  vi.useRealTimers();
});

describe("bulk gear review check debounce", () => {
  it("runs only the latest queued check after typing settles", () => {
    vi.useFakeTimers();
    const debouncer = createBulkGearReviewDebouncer();
    const checks: string[] = [];

    debouncer.schedule("row-1", () => checks.push("first"));
    vi.advanceTimersByTime(BULK_GEAR_REVIEW_DEBOUNCE_MS - 1);
    debouncer.schedule("row-1", () => checks.push("latest"));
    vi.advanceTimersByTime(BULK_GEAR_REVIEW_DEBOUNCE_MS - 1);

    expect(checks).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(checks).toEqual(["latest"]);
  });

  it("cancels a removed row without delaying checks for other rows", () => {
    vi.useFakeTimers();
    const debouncer = createBulkGearReviewDebouncer();
    const checks: string[] = [];

    debouncer.schedule("removed-row", () => checks.push("removed"));
    debouncer.schedule("active-row", () => checks.push("active"));
    debouncer.cancel("removed-row");
    vi.advanceTimersByTime(BULK_GEAR_REVIEW_DEBOUNCE_MS);

    expect(checks).toEqual(["active"]);
  });
});
