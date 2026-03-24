import { beforeEach, describe, expect, it, vi } from "vitest";

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const gearServiceMocks = vi.hoisted(() => ({
  resolveGearLinkMpb: vi.fn(),
}));

vi.mock("next/headers", () => headerMocks);
vi.mock("~/server/gear/service", () => gearServiceMocks);
vi.mock("server-only", () => ({}));

import { GET } from "../../src/app/(app)/api/out/mpb/route";

describe("MPB out route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headerMocks.headers.mockResolvedValue(new Headers());
    gearServiceMocks.resolveGearLinkMpb.mockResolvedValue(null);
  });

  it("redirects to the explicit market storefront", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/out/mpb?destinationPath=https%3A%2F%2Fwww.mpb.com%2Fen-us%2Fproduct%2Fnikon-z6-iii&market=EU",
      ) as any,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.mpb.com/en-eu/product/nikon-z6-iii",
    );
  });

  it("falls back to the geo-detected EU storefront", async () => {
    headerMocks.headers.mockResolvedValue(
      new Headers([["x-vercel-ip-country", "FR"]]),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/out/mpb?destinationPath=%2Fproduct%2Fnikon-z6-iii",
      ) as any,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.mpb.com/en-eu/product/nikon-z6-iii",
    );
  });

  it("falls back to the geo-detected UK storefront", async () => {
    headerMocks.headers.mockResolvedValue(
      new Headers([["x-vercel-ip-country", "GB"]]),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/out/mpb?destinationPath=%2Fproduct%2Fnikon-z6-iii",
      ) as any,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.mpb.com/en-uk/product/nikon-z6-iii",
    );
  });

  it("defaults to the US storefront when no market signal is available", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/out/mpb?destinationPath=%2Fproduct%2Fnikon-z6-iii",
      ) as any,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.mpb.com/en-us/product/nikon-z6-iii",
    );
  });

  it("resolves the MPB link from the service when a gear slug is provided", async () => {
    gearServiceMocks.resolveGearLinkMpb.mockResolvedValue(
      "https://www.mpb.com/en-us/product/nikon-z6-iii",
    );

    const response = await GET(
      new Request(
        "http://localhost/api/out/mpb?gearSlug=nikon-z6-iii&market=EU",
      ) as any,
    );

    expect(gearServiceMocks.resolveGearLinkMpb).toHaveBeenCalledWith({
      slug: "nikon-z6-iii",
      gearId: null,
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.mpb.com/en-eu/product/nikon-z6-iii",
    );
  });

  it("returns 400 when no destination can be resolved", async () => {
    const response = await GET(
      new Request("http://localhost/api/out/mpb?gearSlug=nikon-z6-iii") as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      message: "Missing destinationPath or gear reference with a valid MPB link.",
    });
  });

  it("returns 400 for non-MPB absolute URLs", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/out/mpb?destinationPath=https%3A%2F%2Fexample.com%2Fproduct%2Fnikon-z6-iii",
      ) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      message: "Invalid MPB destinationPath.",
    });
  });
});
