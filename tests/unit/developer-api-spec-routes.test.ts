import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  getSelectedSpecs: vi.fn(),
  parseSpecSelectors: vi.fn(),
  serializeSpecs: vi.fn(),
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
vi.mock("~/server/developer-api/specs", () => ({
  getDeveloperApiSpecsCatalog: mocks.getCatalog,
  getDeveloperGearSelectedSpecs: mocks.getSelectedSpecs,
}));
vi.mock("~/server/developer-api/schemas", () => ({
  parseSpecSelectors: mocks.parseSpecSelectors,
}));
vi.mock("~/server/developer-api/serializers", () => ({
  serializeDeveloperApiSpecs: mocks.serializeSpecs,
}));

import { GET as getSpecs } from "~/app/api/v1/specs/route";
import { GET as getGearSpecs } from "~/app/api/v1/gear/[slug]/specs/route";

describe("developer API spec routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCatalog.mockReturnValue([{ id: "camera.sensor", fields: [] }]);
    mocks.parseSpecSelectors.mockReturnValue(["camera.sensor"]);
    mocks.getSelectedSpecs.mockResolvedValue([
      {
        id: "camera.sensor.isoRange",
        raw: { min: 100, max: 51200 },
        display: "ISO 100 - 51200",
      },
    ]);
    mocks.serializeSpecs.mockReturnValue({
      data: [{ id: "camera.sensor.isoRange" }],
    });
  });

  it("returns the live catalog through existing gear usage protection", async () => {
    await expect(
      getSpecs(new Request("https://sharply.test/api/v1/specs")),
    ).resolves.toEqual({
      data: { categories: [{ id: "camera.sensor", fields: [] }] },
      headers: { "Cache-Control": "no-store" },
    });
    expect(mocks.runRequest).toHaveBeenCalledWith(
      expect.any(Request),
      "gear",
      expect.any(Function),
    );
  });

  it("validates a gear slug and forwards parsed selectors to the projection", async () => {
    await expect(
      getGearSpecs(
        new Request(
          "https://sharply.test/api/v1/gear/nikon-z6-iii/specs?fields=camera.sensor",
        ),
        { params: Promise.resolve({ slug: "nikon-z6-iii" }) },
      ),
    ).resolves.toEqual({
      data: [{ id: "camera.sensor.isoRange" }],
      headers: { "Cache-Control": "no-store" },
    });
    expect(mocks.getSelectedSpecs).toHaveBeenCalledWith({
      slug: "nikon-z6-iii",
      selectors: ["camera.sensor"],
    });
  });

  it("rejects an invalid gear slug before selecting specs", async () => {
    await expect(
      getGearSpecs(new Request("https://sharply.test/api/v1/gear//specs"), {
        params: Promise.resolve({ slug: "" }),
      }),
    ).rejects.toMatchObject({ code: "invalid_request", status: 400 });
    expect(mocks.getSelectedSpecs).not.toHaveBeenCalled();
  });
});
