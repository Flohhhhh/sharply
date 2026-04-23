import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("static route locale handling", () => {
  it("keeps browse ISR components on explicit locale-scoped translations", () => {
    const files = [
      "src/app/[locale]/(pages)/browse/[[...segments]]/page.tsx",
      "src/app/[locale]/(pages)/browse/_components/all-gear-content.tsx",
      "src/app/[locale]/(pages)/browse/_components/brand-content.tsx",
      "src/app/[locale]/(pages)/browse/_components/breadcrumbs.tsx",
      "src/app/[locale]/(pages)/browse/_components/mount-buttons.tsx",
    ];

    for (const file of files) {
      const source = readSource(file);
      expect(source).not.toMatch(/getTranslations\(\s*["']browsePage["']\s*\)/);
      expect(source).toMatch(
        /getTranslations\(\{\s*locale,\s*namespace:\s*["']browsePage["']\s*\}\)/,
      );
    }
  });

  it("keeps gear ISR helpers and the shared discord banner off implicit request locale resolution", () => {
    const gearPage = readSource("src/app/[locale]/(pages)/gear/[slug]/page.tsx");
    expect(gearPage).not.toMatch(/searchParams:/);
    expect(gearPage).not.toMatch(/await searchParams/);
    expect(gearPage).toMatch(/<EditAppliedToast \/>/);
    expect(gearPage).toMatch(/<ConstructionFullPage\s+locale=\{locale\}/);
    expect(gearPage).toMatch(/<StaffVerdictSection locale=\{locale\}/);
    expect(gearPage).toMatch(/<CreatorVideosSection locale=\{locale\}/);
    expect(gearPage).toMatch(/<GearStatsCard locale=\{locale\}/);
    expect(gearPage).toMatch(/<DiscordBanner locale=\{locale\}/);

    const localizedServerComponents = [
      "src/app/[locale]/(pages)/gear/_components/construction-full.tsx",
      "src/app/[locale]/(pages)/gear/_components/construction-notice.tsx",
      "src/app/[locale]/(pages)/gear/_components/creator-videos-section.tsx",
      "src/app/[locale]/(pages)/gear/_components/gear-stats-card.tsx",
      "src/app/[locale]/(pages)/gear/_components/staff-verdict-section.tsx",
      "src/components/discord-banner.tsx",
    ];

    for (const file of localizedServerComponents) {
      const source = readSource(file);
      expect(source).not.toMatch(/getTranslations\(\s*["'][^"']+["']\s*\)/);
      expect(source).toMatch(/getTranslations\(\{\s*locale,\s*namespace:/);
    }
  });
});
