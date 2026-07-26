import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  fetchGearEditorRelationships: vi.fn(),
}));

vi.mock("~/server/gear/service", () => serviceMocks);

import { GET } from "../../src/app/api/gear/[slug]/relationships/route";

describe("gear editor relationships route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns relationship data supplied by the authorized service", async () => {
    const relationships = {
      alternatives: [{ id: "alternative-1" }],
      lineage: { predecessor: null, successor: null },
    };
    serviceMocks.fetchGearEditorRelationships.mockResolvedValue(relationships);

    const response = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ slug: "nikon-zf" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(relationships);
    expect(serviceMocks.fetchGearEditorRelationships).toHaveBeenCalledWith(
      "nikon-zf",
    );
  });

  it("does not expose relationships when the service rejects an unauthorized user", async () => {
    serviceMocks.fetchGearEditorRelationships.mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 }),
    );

    const response = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ slug: "nikon-zf" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});
