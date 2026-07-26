import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("under-construction table action wiring", () => {
  const tableSource = read(
    "src/app/[locale]/(pages)/lists/under-construction/_components/under-construction-table.tsx",
  );
  const rowSource = read(
    "src/app/[locale]/(pages)/lists/under-construction/_components/under-construction-row.tsx",
  );
  const clientSource = read(
    "src/app/[locale]/(pages)/lists/under-construction/_components/under-construction-client.tsx",
  );

  it("links only the item name section to the gear page", () => {
    expect(rowSource).toContain('import Link from "next/link"');
    expect(rowSource).toContain("href={`/gear/${item.slug}`}");
    expect(tableSource).not.toContain("router.push(`/gear/${it.slug}`)");
    expect(rowSource).not.toContain('role="button"');
  });

  it("gates image management and opens the existing modal with loaded data", () => {
    expect(rowSource).toContain("canManageImages ? (");
    expect(rowSource).toContain('{t("editSpecs")}');
    expect(rowSource).toContain('{imageT("manageButton")}');
    expect(rowSource).not.toContain('size="icon"');
    expect(rowSource.match(/className="cursor-pointer"/g)).toHaveLength(2);
    expect(rowSource).toContain('variant="default"');
    expect(rowSource).toContain('variant="outline"');
    expect(tableSource).toContain("handleImageOpen");
    expect(tableSource).toContain("<GearImageModal");
    expect(tableSource).toContain("trigger={null}");
    expect(tableSource).toContain(
      "currentColorways={gearData.colorways ?? undefined}",
    );
  });

  it("reveals the gradient actions through hover, focus, or touch state", () => {
    expect(rowSource).toContain("bg-gradient-to-r");
    expect(rowSource).toContain("group-hover:pointer-events-auto");
    expect(rowSource).toContain("group-focus-within:pointer-events-auto");
    expect(rowSource).toContain(
      'isRevealed && "pointer-events-auto opacity-100"',
    );
  });

  it("overlays revealed actions without moving or hiding the status indicator", () => {
    expect(rowSource).toContain("via-background/80");
    expect(rowSource).toContain('canManageImages ? "w-[48rem]" : "w-[36rem]"');
    expect(rowSource).not.toContain('className="rounded-full"');
    expect(rowSource).not.toContain("group-hover:-translate-x");
    expect(rowSource).not.toContain("group-focus-within:-translate-x");
    expect(rowSource).not.toContain("group-hover:opacity-0");
    expect(rowSource).not.toContain("group-focus-within:opacity-0");
  });

  it("de-emphasizes the brand without repeating type metadata", () => {
    expect(rowSource).toContain("text-muted-foreground/85");
    expect(rowSource).toContain("splitBrandPrefix");
    expect(rowSource).not.toContain("typeLabel");
    expect(rowSource).not.toContain('useTranslations("search")');
    expect(tableSource).toContain('t("images")');
    expect(rowSource).toContain("{item.imageCount}/{item.imageCapacity}");
    expect(rowSource).toContain('className="size-4 text-orange-500"');
    expect(rowSource).not.toContain(
      'item.imageCount === 0 && "text-orange-500"',
    );
  });

  it("balances item width and uses a subtle warning status label", () => {
    expect(rowSource).toContain('className="w-[420px] max-w-[420px]"');
    expect(rowSource).toContain('className="w-[200px]"');
    expect(rowSource).toContain("border-amber-500/25");
    expect(rowSource).toContain("bg-amber-500/10");
    expect(rowSource).toContain("text-amber-700");
    expect(rowSource).not.toContain("TriangleAlert");
    expect(rowSource).not.toContain('<Badge variant="destructive">');
  });

  it("filters only rows with zero uploaded supported images", () => {
    expect(clientSource).toContain(
      "if (missingImagesOnly && it.imageCount > 0) return false;",
    );
  });

  it("keeps repeated missing labels keyed independently", () => {
    expect(rowSource).toContain("key={`${missingSpec}-${missingSpecIndex}`}");
  });

  it("reports image-data load failures and keeps row types checked", () => {
    expect(tableSource).toContain('toast.error(t("imageLoadError"))');
    expect(clientSource).toContain("items: UnderConstructionRowData[];");
    expect(clientSource).toContain("items={filtered}");
    expect(clientSource).not.toContain("filtered as any");
  });
});
