import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { locales } from "~/i18n/config";

const analyticsMock = vi.hoisted(() =>
  vi.fn(() => createElement("div", { "data-testid": "analytics" })),
);
const botIdClientMock = vi.hoisted(() =>
  vi.fn(() => createElement("meta", { name: "botid-client" })),
);
const providersMock = vi.hoisted(() =>
  vi.fn(
    ({
      children,
    }: {
      children: ReactNode;
      locale: string;
      messages: Record<string, unknown>;
      timeZone: string;
    }) => createElement(Fragment, null, children),
  ),
);
const toasterMock = vi.hoisted(() =>
  vi.fn(() => createElement("div", { "data-testid": "toaster" })),
);
const nextFontGoogleMocks = vi.hoisted(() => ({
  Archivo: vi.fn(() => ({ variable: "font-archivo" })),
  Crimson_Text: vi.fn(() => ({ variable: "font-fancy" })),
}));
const intlServerMocks = vi.hoisted(() => ({
  getTranslations: vi.fn(),
  setRequestLocale: vi.fn(),
}));
const i18nMessageMocks = vi.hoisted(() => ({
  getMessagesForLocale: vi.fn(),
}));
const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(),
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: analyticsMock,
}));
vi.mock("botid/client", () => ({
  BotIdClient: botIdClientMock,
}));
vi.mock("~/components/ui/sonner", () => ({
  Toaster: toasterMock,
}));
vi.mock("next/font/google", () => nextFontGoogleMocks);
vi.mock("~/i18n/messages", () => i18nMessageMocks);
vi.mock("next-intl/server", () => intlServerMocks);
vi.mock("next/navigation", () => navigationMocks);
vi.mock("~/app/[locale]/providers", () => ({
  Providers: providersMock,
}));

import RootLayout, {
  generateMetadata,
  generateStaticParams,
} from "~/app/[locale]/layout";

describe("locale root layout", () => {
  const originalVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_ENV;
    i18nMessageMocks.getMessagesForLocale.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.VERCEL_ENV;
  });

  afterAll(() => {
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
      return;
    }

    process.env.VERCEL_ENV = originalVercelEnv;
  });

  it("mounts analytics in production", async () => {
    process.env.VERCEL_ENV = "production";

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: createElement("main", null, "content"),
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(markup).toContain("data-testid=\"analytics\"");
    expect(analyticsMock).toHaveBeenCalledTimes(1);
  });

  it("renders the validated locale as the document language", async () => {
    const markup = renderToStaticMarkup(
      await RootLayout({
        children: createElement("main", null, "content"),
        params: Promise.resolve({ locale: "ja" }),
      }),
    );

    expect(markup).toContain("<html lang=\"ja\"");
  });

  it("mounts BotID in the locale root head", async () => {
    const markup = renderToStaticMarkup(
      await RootLayout({
        children: createElement("main", null, "content"),
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(markup).toContain("<head><meta name=\"botid-client\"/></head>");
    expect(botIdClientMock).toHaveBeenCalledTimes(1);
  });

  it("skips analytics outside production", async () => {
    process.env.VERCEL_ENV = "preview";

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: createElement("main", null, "content"),
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(markup).not.toContain("data-testid=\"analytics\"");
    expect(analyticsMock).not.toHaveBeenCalled();
  });

  it("keeps the locale static params list in sync with supported locales", () => {
    expect(generateStaticParams()).toEqual(locales.map((locale) => ({ locale })));
  });

  it("rejects invalid locales during metadata generation", async () => {
    navigationMocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      generateMetadata({
        params: Promise.resolve({ locale: "load.php" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("rejects invalid locales in the root layout", async () => {
    navigationMocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      RootLayout({
        children: createElement("main", null, "content"),
        params: Promise.resolve({ locale: "load.php" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
