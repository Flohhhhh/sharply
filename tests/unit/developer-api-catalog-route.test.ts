import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSnapshot: vi.fn(),
  matchesEtag: vi.fn(),
  runRequest: vi.fn(
    async (
      _request: Request,
      _endpoint: string,
      handler: () => Promise<unknown>,
    ) => {
      const response = (await handler()) as { response?: Response };
      return response.response ?? response;
    },
  ),
}));

vi.mock("~/server/developer-api/http", () => ({
  runDeveloperApiRequest: mocks.runRequest,
}));
vi.mock("~/server/developer-api/service", () => ({
  getDeveloperCatalogSnapshot: mocks.getSnapshot,
  createDeveloperCatalogEtag: (version: string) => `"${version}"`,
  matchesDeveloperCatalogEtag: mocks.matchesEtag,
}));

import { GET } from "~/app/api/v1/catalog/route";

describe("developer API catalog route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSnapshot.mockResolvedValue({
      version: "sha256-catalog",
      generatedAt: "2026-07-15T15:00:00.000Z",
      itemCount: 1,
      data: [{ slug: "nikon-z6iii" }],
    });
    mocks.matchesEtag.mockReturnValue(false);
  });

  it("returns the cached snapshot with revalidation headers", async () => {
    await expect(
      GET(new Request("https://sharply.test/api/v1/catalog")),
    ).resolves.toEqual({
      version: "sha256-catalog",
      generatedAt: "2026-07-15T15:00:00.000Z",
      itemCount: 1,
      data: [{ slug: "nikon-z6iii" }],
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
        Vary: "Authorization, If-None-Match",
        ETag: '"sha256-catalog"',
      },
    });
    expect(mocks.runRequest).toHaveBeenCalledWith(
      expect.any(Request),
      "catalog",
      expect.any(Function),
    );
  });

  it("returns native 304 when the request snapshot matches", async () => {
    mocks.matchesEtag.mockReturnValue(true);

    const response = await GET(
      new Request("https://sharply.test/api/v1/catalog", {
        headers: { "If-None-Match": 'W/"sha256-catalog"' },
      }),
    );

    expect(response.status).toBe(304);
    expect(response.headers.get("ETag")).toBe('"sha256-catalog"');
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=0, must-revalidate",
    );
  });
});
