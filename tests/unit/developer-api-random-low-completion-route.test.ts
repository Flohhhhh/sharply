import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRandomUrl: vi.fn(),
  runRequest: vi.fn(
    async (
      _request: Request,
      _endpoint: string,
      handler: () => Promise<unknown>,
    ) => handler(),
  ),
}));

vi.mock("~/server/developer-api/http", () => ({
  runDeveloperApiRequest: mocks.runRequest,
}));
vi.mock("~/server/developer-api/service", () => ({
  getDeveloperRandomLowCompletionGearUrl: mocks.getRandomUrl,
}));

import { GET } from "~/app/api/v1/gear/random-low-completion/route";

describe("developer API random low-completion route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a canonical gear URL through the authenticated gear wrapper", async () => {
    mocks.getRandomUrl.mockResolvedValue(
      "https://www.sharplyphoto.com/gear/nikon-z6iii",
    );
    const request = new Request(
      "https://sharply.test/api/v1/gear/random-low-completion",
    );

    await expect(GET(request)).resolves.toEqual({
      data: {
        url: "https://www.sharplyphoto.com/gear/nikon-z6iii",
      },
      headers: { "Cache-Control": "no-store" },
    });
    expect(mocks.runRequest).toHaveBeenCalledWith(
      request,
      "gear",
      expect.any(Function),
    );
  });

  it("returns a successful null URL when no published gear exists", async () => {
    mocks.getRandomUrl.mockResolvedValue(null);

    await expect(
      GET(
        new Request("https://sharply.test/api/v1/gear/random-low-completion"),
      ),
    ).resolves.toEqual({
      data: { url: null },
      headers: { "Cache-Control": "no-store" },
    });
  });
});
