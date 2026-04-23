import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("admin route rendering config", () => {
  it("forces the main admin layout to stay dynamic with no revalidation", () => {
    const source = read("src/app/[locale]/(admin)/admin/layout.tsx");

    expect(source).toContain('export const dynamic = "force-dynamic";');
    expect(source).toContain("export const revalidate = 0;");
  });

  it("forces admin pages under the public route group to stay dynamic with no revalidation", () => {
    const source = read("src/app/[locale]/(pages)/admin/layout.tsx");
    const recommendedSource = read(
      "src/app/[locale]/(pages)/admin/recommended-lenses/layout.tsx",
    );

    expect(source).toContain('export const dynamic = "force-dynamic";');
    expect(source).toContain("export const revalidate = 0;");
    expect(recommendedSource).toContain(
      'export const dynamic = "force-dynamic";',
    );
    expect(recommendedSource).toContain("export const revalidate = 0;");
  });
});
