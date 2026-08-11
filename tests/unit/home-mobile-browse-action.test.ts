import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const homePageSource = fs.readFileSync(
  path.join(process.cwd(), "src/app/[locale]/(pages)/page.tsx"),
  "utf8",
);

describe("home mobile browse action", () => {
  it("renders a full-width browse link directly below the landing-page search", () => {
    expect(homePageSource).toContain(
      'href={localizePathname("/browse", locale)}',
    );
    expect(homePageSource).toContain('className="mt-3 w-full md:hidden"');
    expect(homePageSource).toContain('{t("browseAllGear")}');
  });

  it("keeps the search callout out of the mobile action area", () => {
    expect(homePageSource).toContain(
      'className="text-muted-foreground mx-auto mt-2 hidden max-w-2xl text-balance md:block"',
    );
  });
});
