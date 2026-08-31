// Reads a Playwright JSON report and emits a GitHub Actions warning for every
// test that passed only on retry ("flaky" status). Green checks hide these;
// this keeps them visible. Always exits 0 — it warns, it never fails a run.
import { appendFileSync, readFileSync } from "node:fs";

/** @param {unknown} value @returns {any[]} */
const asArray = (value) => (Array.isArray(value) ? value : []);

/**
 * @param {any} report Parsed Playwright JSON report (untrusted shape).
 * @returns {string[]} Human-readable titles of tests that passed only on retry.
 */
export function collectFlakyTests(report) {
  /** @type {string[]} */
  const flaky = [];
  /** @type {(suite: any, trail: string[]) => void} */
  const walk = (suite, trail) => {
    for (const child of asArray(suite?.suites))
      walk(child, [...trail, child?.title]);
    for (const spec of asArray(suite?.specs)) {
      if (
        asArray(spec?.tests).some(
          (/** @type {any} */ t) => t?.status === "flaky",
        )
      ) {
        flaky.push([...trail, spec?.title].filter(Boolean).join(" › "));
      }
    }
  };
  for (const suite of asArray(report?.suites)) walk(suite, [suite?.title]);
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
  // Let the workflow upload the report/traces on flaky-but-green runs, so
  // the quarantine decision never has to be made without evidence.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `flaky=${flaky.length > 0 ? "true" : "false"}\n`,
    );
  }
}
