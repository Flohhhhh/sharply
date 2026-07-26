import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("gear page stacking", () => {
  it("keeps the sticky intra-page nav above gear content", () => {
    const gearPage = readSource(
      "src/app/[locale]/(pages)/gear/[slug]/page.tsx",
    );

    expect(gearPage).toMatch(
      /<section className="bg-background sticky top-16 z-20 hidden border-b py-2 md:block">/,
    );
  });

  it("keeps the staff verdict and action controls in the initial server-rendered fold", () => {
    const gearPage = readSource(
      "src/app/[locale]/(pages)/gear/[slug]/page.tsx",
    );

    expect(gearPage).toContain("fetchStaffVerdictByGearId(item.id)");
    expect(gearPage.indexOf("<StaffVerdictSection")).toBeLessThan(
      gearPage.indexOf("<EditorialReviewSection"),
    );
    expect(gearPage).toContain("<GearActionButtons");
    expect(gearPage).toContain("initialIsAuthenticated={isAuthenticated}");
  });

  it("streams optional navigation links without holding back the core nav", () => {
    const gearPage = readSource(
      "src/app/[locale]/(pages)/gear/[slug]/page.tsx",
    );

    expect(gearPage).toContain("<EditorialReviewNavItem");
    expect(gearPage).toContain("<AlternativesNavItem");
    expect(gearPage).toContain("<CreatorVideosNavItem");
    expect(gearPage).toContain("<RelatedArticlesNavItem");
  });

  it("keeps the dock shell restricted to editors and waits for relationship data", () => {
    const dock = readSource(
      "src/components/gear/gear-tools-dock/gear-item-dock.client.tsx",
    );
    const dockButtons = readSource(
      "src/components/gear/gear-tools-dock/dock-buttons.tsx",
    );

    expect(dock).toContain('if (!requireRole(user, ["EDITOR"])) return null;');
    expect(dockButtons).toContain("relationshipDataReady &&");
  });

  it("keeps client-only stats as a skeleton until a response is available", () => {
    const stats = readSource(
      "src/app/[locale]/(pages)/gear/_components/gear-stats-client.tsx",
    );

    expect(stats).toContain("isLoading || !data || error");
  });

  it("avoids assigning the video summary grid its own competing z-index", () => {
    const videoSummary = readSource(
      "src/app/[locale]/(pages)/gear/_components/video/video-summary.tsx",
    );

    expect(videoSummary).toMatch(/className="relative"/);
    expect(videoSummary).not.toMatch(/className="relative z-10"/);
  });
});
