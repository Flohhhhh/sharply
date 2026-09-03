import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  selections: [] as Array<Record<string, unknown> | undefined>,
  whereClauses: [] as unknown[],
  orderByClauses: [] as unknown[],
}));

function createSelectBuilder() {
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    orderBy: vi.fn((...clauses: unknown[]) => {
      state.orderByClauses.push(...clauses);
      return Promise.resolve([]);
    }),
    where: vi.fn((clause: unknown) => {
      state.whereClauses.push(clause);
      return builder;
    }),
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

import {
  fetchPublicTagOptionsData,
  fetchTagsByGearIdData,
  fetchTagsData,
} from "~/server/tags/data";

describe("editor tag data projections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.selections = [];
    state.whereClauses = [];
    state.orderByClauses = [];
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

  it("selects only client-safe fields for public tag options", async () => {
    await fetchPublicTagOptionsData();

    expect(state.selections[0]).toEqual({
      id: expect.anything(),
      name: expect.anything(),
      slug: expect.anything(),
      icon: expect.anything(),
    });
    expect(state.selections[0]).not.toHaveProperty("internalNotes");
    expect(state.selections[0]).not.toHaveProperty("unlisted");
    const dialect = new PgDialect();
    const where = dialect.sqlToQuery(state.whereClauses[0] as never);
    const orderBy = dialect.sqlToQuery(state.orderByClauses[0] as never);
    expect(where.sql).toContain('"app"."tags"."unlisted" = $1');
    expect(where.params).toEqual([false]);
    expect(orderBy.sql).toContain('"app"."tags"."name" asc');
  });
});
