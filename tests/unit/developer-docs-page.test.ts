import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeveloperApiError } from "~/server/developer-api/errors";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getTranslations: vi.fn(),
  getDeveloperApiSpecsCatalog: vi.fn(),
  redirect: vi.fn(),
  requireDeveloperPortalUser: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mocks.getTranslations,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

vi.mock("~/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("~/server/developer-api/service", () => ({
  requireDeveloperPortalUser: mocks.requireDeveloperPortalUser,
}));

vi.mock("~/server/developer-api/specs", () => ({
  getDeveloperApiSpecsCatalog: mocks.getDeveloperApiSpecsCatalog,
}));

import DeveloperDocsPage from "~/app/[locale]/(pages)/developer/docs/page";

describe("DeveloperDocsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.requireDeveloperPortalUser.mockResolvedValue({ id: "user-1" });
    mocks.getDeveloperApiSpecsCatalog.mockReturnValue([
      {
        id: "camera.sensor",
        label: "Camera sensor",
        fields: [
          {
            id: "camera.sensor.isoRange",
            label: "ISO Range",
            searchTerms: [],
          },
        ],
      },
    ]);
    mocks.getTranslations.mockResolvedValue((key: string) => key);
  });

  it("renders the documented developer API endpoints for approved users", async () => {
    const markup = renderToStaticMarkup(
      await DeveloperDocsPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(markup).toContain("/api/v1/search");
    expect(markup).toContain("/api/v1/catalog");
    expect(markup).toContain("/api/v1/gear/random-low-completion");
    expect(markup).toContain("/api/v1/specs");
    expect(markup).toContain("/api/v1/gear/:slug/specs");
    expect(markup).toContain("camera.sensor");
    expect(markup).toContain("camera.sensor.isoRange");
    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).not.toContain("<details");
    expect(markup).toContain("/api/v1/gear/:slug");
    expect(markup).toContain("/api/v1/gear/nikon-z6iii");
    expect(markup).toContain("cameraSpecs");
    expect(markup).toContain("sensorFormat");
    expect(markup).toContain("mounts");
    expect(markup).toContain("gearTaxonomyNote");
    expect(markup).toContain("Authorization: Bearer sharply_live_…");
    expect(markup).toContain("serverOnlyNote");
    expect(markup).toContain("exampleRequest");
    expect(markup.match(/exampleCurl/g)).toHaveLength(6);
    expect(markup.match(/exampleTypeScript/g)).toHaveLength(6);
    expect(markup.match(/curl -sS/g)).toHaveLength(6);
    expect(markup.match(/class="pl-12"/g)).toHaveLength(6);
    expect(markup).not.toContain("tracking-wide uppercase");
    const endpointOrder = [
      "/api/v1/search</code>",
      "/api/v1/catalog</code>",
      "/api/v1/gear/random-low-completion</code>",
      "/api/v1/gear/:slug</code>",
      "/api/v1/gear/:slug/specs</code>",
      "/api/v1/specs</code>",
    ].map((endpoint) => markup.indexOf(endpoint));
    expect(endpointOrder).toEqual([...endpointOrder].sort((a, b) => a - b));
  });

  it("redirects users without developer access back to the portal", async () => {
    mocks.requireDeveloperPortalUser.mockRejectedValue(
      new DeveloperApiError("developer_access_required", 403, "Denied"),
    );
    mocks.redirect.mockImplementation((href: string) => {
      throw new Error(`redirect:${href}`);
    });

    await expect(
      DeveloperDocsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/developer");
  });
});
