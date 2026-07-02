import { describe, expect, it } from "vitest";
import { resolveBrandSortSaveCompletion } from "~/lib/brand-sort-order-save";

describe("resolveBrandSortSaveCompletion", () => {
  it("commits when the response matches the latest request and nothing is queued", () => {
    expect(
      resolveBrandSortSaveCompletion({
        responseRequestId: 2,
        latestRequestId: 2,
        queuedSignature: null,
      }),
    ).toEqual({ kind: "commit" });
  });

  it("ignores stale responses after a newer save starts", () => {
    expect(
      resolveBrandSortSaveCompletion({
        responseRequestId: 1,
        latestRequestId: 2,
        queuedSignature: null,
      }),
    ).toEqual({ kind: "stale" });
  });

  it("requeues when changes arrived while the current save was in flight", () => {
    expect(
      resolveBrandSortSaveCompletion({
        responseRequestId: 1,
        latestRequestId: 1,
        queuedSignature: '[{"id":"canon","sortOrder":2}]',
      }),
    ).toEqual({ kind: "requeue" });
  });
});
