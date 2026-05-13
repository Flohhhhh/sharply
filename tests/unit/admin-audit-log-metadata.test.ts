import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("admin audit auto-approval metadata wiring", () => {
  it("selects audit metadata in the audit data layer", () => {
    const source = read("src/server/admin/audit/data.ts");

    expect(source).toContain("metadata: auditLogs.metadata");
  });

  it("renders proposal auto-approval details in the audit log list", () => {
    const source = read(
      "src/app/[locale]/(admin)/admin/admin-audit-log-list.tsx",
    );

    expect(source).toContain('r.action === "GEAR_EDIT_PROPOSE"');
    expect(source).toContain("formatAutoApprovalDecisionForAdmin");
    expect(source).toContain("getAutoApprovalDecisionFromMetadata");
  });
});
