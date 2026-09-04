import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));

import { buildSearchFilterClause } from "~/server/search/data";

describe("search tag filter", () => {
  it("matches any selected listed tag through a correlated subquery", () => {
    const clause = buildSearchFilterClause({
      tags: ["wildlife", "travel"],
    });

    expect(clause).toBeDefined();
    const query = new PgDialect().sqlToQuery(clause!);

    expect(query.sql).toContain("EXISTS");
    expect(query.sql).toContain('FROM "app"."gear_tags"');
    expect(query.sql).toContain('"app"."tags"."unlisted" = false');
    expect(query.sql).toContain('"app"."tags"."slug" IN ($1, $2)');
    expect(query.params).toEqual(["wildlife", "travel"]);
  });
});
