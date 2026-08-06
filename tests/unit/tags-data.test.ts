import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  selections: [] as Array<Record<string, unknown> | undefined>,
}));

function createSelectBuilder() {
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    orderBy: vi.fn(() => Promise.resolve([])),
    where: vi.fn(() => builder),
  };
  return builder;
}

const dbMocks = vi.hoisted(() => ({
  select: vi.fn((selection?: Record<string, unknown>) => {
    state.selections.push(selection);
    return createSelectBuilder();
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({ db: dbMocks }));

import { fetchTagsByGearIdData, fetchTagsData } from "~/server/tags/data";

describe("editor tag data projections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.selections = [];
  });

  it("selects editor assignment guidance without visibility state for the tag list", async () => {
    await fetchTagsData();

    expect(state.selections[0]).toHaveProperty("internalNotes");
    expect(state.selections[0]).not.toHaveProperty("unlisted");
  });

  it("selects editor assignment guidance without visibility state for gear assignments", async () => {
    await fetchTagsByGearIdData("gear-1");

    expect(state.selections[0]).toHaveProperty("internalNotes");
    expect(state.selections[0]).not.toHaveProperty("unlisted");
  });
});
