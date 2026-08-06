import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/[locale]/(admin)/admin/tags/tags-manager.tsx",
  ),
  "utf8",
);

describe("tag manager editor controls", () => {
  it("keeps creation and assignment available while reserving existing-tag controls for admins", () => {
    expect(source).toContain("<Button onClick={openCreate}>");
    expect(source).toContain("assignmentTag ? `/api/admin/tags/");
    expect(source).toContain("{canManage && isAdminTagRow(tag) ? (");
    expect(source).toContain('aria-label={t("edit")}');
    expect(source).toContain('aria-label={t("delete")}');
  });

  it("renders private tag fields only for administrators", () => {
    expect(source).toContain("{canManage ? (");
    expect(source).toContain('htmlFor="tag-internal-notes"');
    expect(source).toContain('id="tag-unlisted"');
  });
});
