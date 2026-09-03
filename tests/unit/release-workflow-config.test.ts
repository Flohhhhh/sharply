import fs from "node:fs";
import path from "node:path";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const workflowDirectory = path.join(projectRoot, ".github/workflows");
const standardWorkflows = [
  "lint.yml",
  "unit-tests.yml",
  "build.yml",
  "e2e-tests.yml",
];

function readWorkflow(fileName: string) {
  return parse(
    fs.readFileSync(path.join(workflowDirectory, fileName), "utf8"),
  ) as Record<string, any>;
}

describe("release workflow configuration", () => {
  it("keeps automatic Vercel deployments production-only", () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8"),
    );

    expect(config.git.deploymentEnabled).toEqual({ "**": false, main: true });
    expect(config.buildCommand).toBe("npm run db:migrate && npm run build");
  });

  it.each(standardWorkflows)(
    "%s runs for feature and release pull requests",
    (fileName) => {
      const workflow = readWorkflow(fileName);

      expect(workflow.on.pull_request.branches).toEqual([
        "development",
        "main",
      ]);
      expect(workflow.on.merge_group.branches).toEqual(["development", "main"]);
      expect(workflow.on.push).toBeUndefined();
      expect(workflow.on.workflow_dispatch.inputs.release_sha).toBeDefined();
      expect(workflow.permissions).toEqual({ contents: "read" });

      const job = Object.values(workflow.jobs)[0] as {
        steps: Array<Record<string, unknown>>;
      };
      const verifyStep = job.steps.find(
        (step) => step.name === "Verify dispatched release commit",
      );
      const checkoutStep = job.steps.find(
        (step) => step.uses === "actions/checkout@v4",
      ) as { with: Record<string, unknown> };

      expect(verifyStep).toMatchObject({
        if: "inputs.release_sha != ''",
        run: 'test "$RELEASE_SHA" = "$GITHUB_SHA"',
      });
      expect(checkoutStep.with["persist-credentials"]).toBe(false);
    },
  );

  it("prepares only development-to-main releases in the required order", () => {
    const workflow = readWorkflow("prepare-release.yml");
    const job = workflow.jobs["prepare-release"];
    const stepNames = job.steps.map((step: { name?: string }) => step.name);
    const dispatchStep = job.steps.find(
      (step: { name?: string }) => step.name === "Dispatch release checks",
    );
    const resetStep = job.steps.find(
      (step: { name?: string }) =>
        step.name === "Reset Neon preview database from parent",
    );

    expect(workflow.on.pull_request.branches).toEqual(["main"]);
    expect(job.if).toBe("github.head_ref == 'development'");
    expect(workflow.permissions).toMatchObject({
      actions: "write",
      contents: "write",
    });
    expect(stepNames.indexOf("Generate canonical migration")).toBeLessThan(
      stepNames.indexOf("Reset Neon preview database from parent"),
    );
    expect(stepNames.indexOf("Resolve final development commit")).toBeLessThan(
      stepNames.indexOf("Dispatch release checks"),
    );
    expect(stepNames.indexOf("Dispatch release checks")).toBeLessThan(
      stepNames.indexOf("Trigger Vercel release preview"),
    );
    for (const fileName of standardWorkflows) {
      expect(dispatchStep.run).toContain(fileName);
    }
    expect(resetStep.env.NEON_PROJECT_ID).toBe("${{ vars.NEON_PROJECT_ID }}");
    expect(resetStep.run).toContain("npx --no-install neonctl");
  });
});
