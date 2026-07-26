import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { locales } from "~/i18n/config";
import { DEFAULT_OG_IMAGE_PATH } from "~/lib/seo/default-og-image";

const analyticsMock = vi.hoisted(() =>
  vi.fn(() => createElement("div", { "data-testid": "analytics" })),
);
const speedInsightsMock = vi.hoisted(() =>
  vi.fn(() => createElement("div", { "data-testid": "speed-insights" })),
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
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: speedInsightsMock,
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
  const originalSpeedInsightsEnabled = process.env.ENABLE_VERCEL_SPEED_INSIGHTS;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_ENV;
    delete process.env.ENABLE_VERCEL_SPEED_INSIGHTS;
    i18nMessageMocks.getMessagesForLocale.mockResolvedValue({});
    intlServerMocks.getTranslations.mockResolvedValue((key: string) => {
      if (key === "siteDescription") return "Sharply description";
      return key;
    });
  });

  afterEach(() => {
    delete process.env.VERCEL_ENV;
    delete process.env.ENABLE_VERCEL_SPEED_INSIGHTS;
  });

  afterAll(() => {
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }

    if (originalSpeedInsightsEnabled === undefined) {
      delete process.env.ENABLE_VERCEL_SPEED_INSIGHTS;
    } else {
      process.env.ENABLE_VERCEL_SPEED_INSIGHTS = originalSpeedInsightsEnabled;
    }
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
    expect(speedInsightsMock).not.toHaveBeenCalled();
  });

  it("mounts Speed Insights only when explicitly enabled in production", async () => {
    process.env.VERCEL_ENV = "production";
    process.env.ENABLE_VERCEL_SPEED_INSIGHTS = "true";

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: createElement("main", null, "content"),
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(markup).toContain('data-testid="speed-insights"');
    expect(speedInsightsMock).toHaveBeenCalledTimes(1);
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
    process.env.ENABLE_VERCEL_SPEED_INSIGHTS = "true";

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: createElement("main", null, "content"),
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(markup).not.toContain("data-testid=\"analytics\"");
    expect(analyticsMock).not.toHaveBeenCalled();
    expect(markup).not.toContain('data-testid="speed-insights"');
    expect(speedInsightsMock).not.toHaveBeenCalled();
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

  it("uses the root app OG image for default open graph and twitter metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "Sharply - Photography Gear Database",
      },
    ]);
    expect(metadata.twitter?.images).toEqual([DEFAULT_OG_IMAGE_PATH]);
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
