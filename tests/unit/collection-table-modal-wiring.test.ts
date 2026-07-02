import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/[locale]/(pages)/u/_components/collection/collection-table-modal.tsx",
  ),
  "utf8",
);

describe("CollectionTableModal colorway controls", () => {
  it("only offers front-view colorways and only shows a select for multi-choice items", () => {
    expect(source).toContain(
      "(item.colorways ?? []).filter((colorway) => colorway.frontImageUrl)",
    );
    expect(source).toContain("eligibleColorways.length > 1");
    expect(source).toContain('DEFAULT_COLLECTION_COLORWAY_VALUE = "__default__"');
    expect(source).toContain('value === DEFAULT_COLLECTION_COLORWAY_VALUE');
  });

  it("uses translated labels for collection table headers", () => {
    expect(source).toContain('{t("collectionColorway")}');
    expect(source).toContain('{t("actionsColumnLabel")}');
    expect(source).not.toContain(">Actions</TableHead>");
  });

  it("updates the owned colorway through the server action and refreshes the route", () => {
    expect(source).toContain("actionUpdateOwnedGearColorway");
    expect(source).toContain("gearId: item.id");
    expect(source).toContain('toast.success(t("collectionColorwayUpdated"))');
    expect(source).toContain('toast.error(t("collectionColorwayUpdateFailed"))');
    expect(source).toContain("startTransition(() => router.refresh())");
  });
});
