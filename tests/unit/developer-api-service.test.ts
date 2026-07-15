import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchGearBySlug: vi.fn(),
  fetchMounts: vi.fn(),
  fetchSensorFormats: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("~/server/db", () => ({
  db: {},
}));

vi.mock("~/server/gear/service", () => ({
  fetchGearBySlug: mocks.fetchGearBySlug,
}));

vi.mock("~/server/auth", () => ({
  getSessionOrThrow: vi.fn(),
}));

vi.mock("~/server/search/service", () => ({
  getSuggestions: vi.fn(),
  searchGear: vi.fn(),
}));

vi.mock("~/server/developer-api/data", () => ({
  consumeRateLimitBucket: vi.fn(),
  createApiKeyWithinActiveLimitData: vi.fn(),
  findUsableApiKeyByHash: vi.fn(),
  fetchDeveloperGearMountsData: mocks.fetchMounts,
  fetchDeveloperSensorFormatsData: mocks.fetchSensorFormats,
  getDeveloperAccessData: vi.fn(),
  getUsageForKeyIdsSince: vi.fn(),
  incrementUsageData: vi.fn(),
  listApiKeysForUser: vi.fn(),
  listAllApiKeysData: vi.fn(),
  listDeveloperUsersData: vi.fn(),
  revokeAllApiKeysForUser: vi.fn(),
  revokeApiKeyData: vi.fn(),
  setDeveloperAccessData: vi.fn(),
  touchApiKeyLastUsed: vi.fn(),
}));

import { getDeveloperGear } from "~/server/developer-api/service";

describe("getDeveloperGear", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchGearBySlug.mockResolvedValue({
      id: "gear-id",
      slug: "nikon-z6",
      name: "Nikon Z6",
      gearType: "CAMERA",
      mountIds: ["mount-z", "mount-l"],
      cameraSpecs: { gearId: "gear-id", sensorFormatId: "format-camera" },
      lensSpecs: { gearId: "gear-id", imageCircleSizeId: "format-lens" },
      fixedLensSpecs: {
        gearId: "gear-id",
        imageCircleSizeId: "missing-format",
      },
    });
    mocks.fetchMounts.mockResolvedValue([
      { value: "Nikon Z", shortName: "Z" },
      { value: "Leica L", shortName: "L" },
    ]);
    mocks.fetchSensorFormats.mockResolvedValue(
      new Map([
        [
          "format-camera",
          { slug: "full-frame", name: "Full Frame", cropFactor: "1.00" },
        ],
        ["format-lens", { slug: "aps-c", name: "APS-C", cropFactor: "1.50" }],
      ]),
    );
  });

  it("composes named taxonomy DTOs without exposing foreign keys", async () => {
    const gear = await getDeveloperGear("nikon-z6");

    expect(gear).toMatchObject({
      slug: "nikon-z6",
      mounts: [
        { value: "Nikon Z", shortName: "Z" },
        { value: "Leica L", shortName: "L" },
      ],
      cameraSpecs: {
        sensorFormat: {
          slug: "full-frame",
          name: "Full Frame",
          cropFactor: "1.00",
        },
      },
      lensSpecs: {
        imageCircle: {
          slug: "aps-c",
          name: "APS-C",
          cropFactor: "1.50",
        },
      },
      fixedLensSpecs: { imageCircle: null },
    });

    expect(gear).not.toHaveProperty("mountIds");
    expect(gear.cameraSpecs).not.toHaveProperty("sensorFormatId");
    expect(gear.lensSpecs).not.toHaveProperty("imageCircleSizeId");
    expect(gear.fixedLensSpecs).not.toHaveProperty("imageCircleSizeId");
    expect(mocks.fetchMounts).toHaveBeenCalledWith("gear-id");
    expect(mocks.fetchSensorFormats).toHaveBeenCalledWith([
      "format-camera",
      "format-lens",
      "missing-format",
    ]);
  });
});
