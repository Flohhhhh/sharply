import { describe, expect, it } from "vitest";

import { collectFlakyTests } from "../../scripts/e2e/report-flakes.mjs";

const report = {
  suites: [
    {
      title: "smoke.spec.ts",
      suites: [
        {
          title: "smoke",
          specs: [
            {
              title: "landing renders hero and search",
              tests: [{ status: "flaky" }],
            },
            { title: "stable test", tests: [{ status: "expected" }] },
          ],
        },
      ],
      specs: [],
    },
  ],
};

describe("collectFlakyTests", () => {
  it("returns the titles of pass-on-retry tests only", () => {
    expect(collectFlakyTests(report)).toEqual([
      "smoke.spec.ts › smoke › landing renders hero and search",
    ]);
  });

  it("handles empty and malformed reports", () => {
    expect(collectFlakyTests({})).toEqual([]);
    expect(collectFlakyTests({ suites: [] })).toEqual([]);
    expect(collectFlakyTests(null)).toEqual([]);
    expect(collectFlakyTests("not a report")).toEqual([]);
    expect(collectFlakyTests({ suites: "oops" })).toEqual([]);
    expect(
      collectFlakyTests({
        suites: [{ title: "s", suites: 42, specs: { bad: true } }],
      }),
    ).toEqual([]);
    expect(
      collectFlakyTests({
        suites: [{ title: "s", specs: [{ title: "t", tests: "broken" }] }],
      }),
    ).toEqual([]);
  });
});
