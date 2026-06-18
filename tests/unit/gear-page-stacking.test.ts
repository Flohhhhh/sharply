import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

const projectRoot = process.cwd();

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("gear page stacking", () => {
  it("keeps the sticky intra-page nav above gear content", () => {
    const gearPage = readSource("src/app/[locale]/(pages)/gear/[slug]/page.tsx");

    expect(gearPage).toMatch(
      /<section className="bg-background sticky top-16 z-20 hidden border-b py-2 md:block">/,
    );
  });

  it("avoids assigning the video summary grid its own competing z-index", () => {
    const videoSummary = readSource(
      "src/app/[locale]/(pages)/gear/_components/video/video-summary.tsx",
    );

    expect(videoSummary).toMatch(/className="relative"/);
    expect(videoSummary).not.toMatch(/className="relative z-10"/);
  });
});
