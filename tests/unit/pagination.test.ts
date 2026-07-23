import { describe, expect, it } from "vitest";
import { getPageLoadingState } from "~/lib/pagination";

describe("getPageLoadingState", () => {
  it("treats an allocated but undefined first page as initial loading", () => {
    expect(getPageLoadingState([undefined], 1, true)).toEqual({
      isLoadingInitial: true,
      isLoadingMore: false,
    });
  });

  it("never treats the initial page as an incremental request", () => {
    expect(getPageLoadingState([undefined], 1, true)).toMatchObject({
      isLoadingInitial: true,
      isLoadingMore: false,
    });
  });

  it("shows incremental loading until the requested page has a payload", () => {
    expect(getPageLoadingState([{ id: 1 }, undefined], 2, true)).toEqual({
      isLoadingInitial: false,
      isLoadingMore: true,
    });
    expect(getPageLoadingState([{ id: 1 }, { id: 2 }], 2, true)).toEqual({
      isLoadingInitial: false,
      isLoadingMore: false,
    });
  });
});
