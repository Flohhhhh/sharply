// Reads a Playwright JSON report and emits a GitHub Actions warning for every
// test that passed only on retry ("flaky" status). Green checks hide these;
// this keeps them visible. Always exits 0 — it warns, it never fails a run.
import { readFileSync } from "node:fs";

/**
 * @param {any} report Parsed Playwright JSON report.
 * @returns {string[]} Human-readable titles of tests that passed only on retry.
 */
export function collectFlakyTests(report) {
  /** @type {string[]} */
  const flaky = [];
  /** @type {(suite: any, trail: string[]) => void} */
  const walk = (suite, trail) => {
    for (const child of suite.suites ?? [])
      walk(child, [...trail, child.title]);
    for (const spec of suite.specs ?? []) {
      if (
        (spec.tests ?? []).some((/** @type {any} */ t) => t.status === "flaky")
      ) {
        flaky.push([...trail, spec.title].filter(Boolean).join(" › "));
      }
    }
  };
  for (const suite of report?.suites ?? []) walk(suite, [suite.title]);
  return flaky;
}

const isMain = process.argv[1]?.endsWith("report-flakes.mjs");
if (isMain) {
  const reportPath = process.argv[2] ?? "test-results/results.json";
  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8"));
  } catch {
    process.exit(0); // no report (e.g. run aborted before tests) — nothing to say
  }
  const flaky = collectFlakyTests(report);
  for (const name of flaky) {
    console.log(
      `::warning title=Flaky e2e test (passed on retry)::${name} — two flakes in a week means quarantine it (docs/e2e-testing.md)`,
    );
  }
  if (flaky.length === 0) console.log("[e2e] no pass-on-retry flakes");
}
