import { readFileSync } from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("static route safety", () => {
  it("keeps the shared header free of dynamic request APIs", () => {
    const header = readSource("src/components/layout/header.tsx");

    expect(header).not.toMatch(/from "next\/headers"/);
    expect(header).not.toMatch(/\bawait headers\(/);
    expect(header).not.toMatch(/\bawait cookies\(/);
  });

  it("keeps search param syncing isolated behind Suspense in the header client", () => {
    const headerClient = readSource("src/components/layout/header-client.tsx");

    expect(headerClient).toMatch(
      /<Suspense fallback=\{null\}>\s*<HeaderSearchParamsSync/,
    );
  });

  it("keeps the footer language switcher isolated behind Suspense", () => {
    const footer = readSource("src/components/layout/footer.tsx");

    expect(footer).toMatch(
      /<Suspense fallback=\{<div aria-hidden="true" className="h-9 min-w-\[210px\]" \/>\}>\s*<LanguageSwitcher/,
    );
  });

  it("keeps browse ISR routes anchored to params locale and off request APIs", () => {
    const browsePage = readSource(
      "src/app/[locale]/(pages)/browse/[[...segments]]/page.tsx",
    );

    expect(browsePage).toMatch(/setRequestLocale\(locale\);/);
    expect(browsePage).not.toMatch(/\bheaders\(/);
    expect(browsePage).not.toMatch(/\bcookies\(/);
  });

  it("keeps gear ISR routes anchored to params locale and off request APIs", () => {
    const gearPage = readSource("src/app/[locale]/(pages)/gear/[slug]/page.tsx");

    expect(gearPage).toMatch(/setRequestLocale\(locale\);/);
    expect(gearPage).not.toMatch(/searchParams:/);
    expect(gearPage).not.toMatch(/await searchParams/);
    expect(gearPage).not.toMatch(/\bheaders\(/);
    expect(gearPage).not.toMatch(/\bcookies\(/);
    expect(gearPage).toMatch(/<EditAppliedToast \/>/);
  });

  it("keeps the locale segment bounded to known locales", () => {
    const localeLayout = readSource("src/app/[locale]/layout.tsx");

    expect(localeLayout).toMatch(/export const dynamicParams = false;/);
    expect(localeLayout).toMatch(/if \(!isLocale\(requestedLocale\)\) {\s*notFound\(\);/);
  });
});
