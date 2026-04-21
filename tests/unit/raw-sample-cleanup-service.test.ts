import { afterAll,beforeEach,describe,expect,it,vi } from "vitest";

const dataMocks = vi.hoisted(() => ({
  countGearAssociationsForRawSample: vi.fn(),
  fetchDeletedRawSamplesForCleanup: vi.fn(),
  hardDeleteRawSampleById: vi.fn(),
}));

const uploadThingMocks = vi.hoisted(() => {
  const deleteFiles = vi.fn();
  return {
    deleteFiles,
    UTApi: vi.fn().mockImplementation(() => ({
      deleteFiles,
    })),
  };
});

vi.mock("~/server/raw-samples/data", () => dataMocks);
vi.mock("server-only", () => ({}));
vi.mock("uploadthing/server", () => ({
  UTApi: uploadThingMocks.UTApi,
}));

import { cleanupDeletedRawSamples } from "../../src/server/raw-samples/service";

describe("cleanupDeletedRawSamples", () => {
  const originalUploadThingToken = process.env.UPLOADTHING_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UPLOADTHING_TOKEN = "uploadthing-token";
    dataMocks.countGearAssociationsForRawSample.mockResolvedValue(0);
  });

  it("returns dry-run results without deleting files", async () => {
    dataMocks.fetchDeletedRawSamplesForCleanup.mockResolvedValue([
      {
        id: "sample-1",
        fileUrl: "https://utfs.io/f/sample-1.jpg",
        originalFilename: "sample-1.jpg",
        deletedAt: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]);

    const result = await cleanupDeletedRawSamples({ dryRun: true, limit: 25 });

    expect(result.dryRun).toBe(true);
    expect(result.scanned).toBe(1);
    expect(result.eligible).toBe(1);
    expect(result.deleted).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.items[0]?.status).toBe("dry_run");
    expect(uploadThingMocks.UTApi).not.toHaveBeenCalled();
    expect(uploadThingMocks.deleteFiles).not.toHaveBeenCalled();
    expect(dataMocks.hardDeleteRawSampleById).not.toHaveBeenCalled();
  });

  it("deletes valid UploadThing files and skips invalid URLs", async () => {
    dataMocks.fetchDeletedRawSamplesForCleanup.mockResolvedValue([
      {
        id: "sample-1",
        fileUrl: "https://utfs.io/f/sample-1.jpg",
        originalFilename: "sample-1.jpg",
        deletedAt: new Date("2025-01-01T00:00:00.000Z"),
      },
      {
        id: "sample-2",
        fileUrl: "https://example.com/file.jpg",
        originalFilename: "sample-2.jpg",
        deletedAt: new Date("2025-01-02T00:00:00.000Z"),
      },
    ]);
    uploadThingMocks.deleteFiles.mockResolvedValue({
      success: true,
      deletedCount: 1,
    });

    const result = await cleanupDeletedRawSamples({ dryRun: false });

    expect(uploadThingMocks.UTApi).toHaveBeenCalledTimes(1);
    expect(uploadThingMocks.deleteFiles).toHaveBeenCalledWith("sample-1.jpg");
    expect(dataMocks.hardDeleteRawSampleById).toHaveBeenCalledWith("sample-1");
    expect(result.scanned).toBe(2);
    expect(result.eligible).toBe(1);
    expect(result.deleted).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.items.map((item) => item.status)).toEqual([
      "deleted",
      "invalid_url",
    ]);
  });

  it("skips file deletion when the raw sample is still associated to gear", async () => {
    dataMocks.fetchDeletedRawSamplesForCleanup.mockResolvedValue([
      {
        id: "sample-1",
        fileUrl: "https://utfs.io/f/sample-1.jpg",
        originalFilename: "sample-1.jpg",
        deletedAt: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]);
    dataMocks.countGearAssociationsForRawSample.mockResolvedValue(1);

    const result = await cleanupDeletedRawSamples({ dryRun: false });

    expect(uploadThingMocks.deleteFiles).not.toHaveBeenCalled();
    expect(dataMocks.hardDeleteRawSampleById).not.toHaveBeenCalled();
    expect(result.deleted).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.items[0]).toMatchObject({
      id: "sample-1",
      status: "still_associated",
    });
  });

  it("requires an UploadThing token for apply mode", async () => {
    process.env.UPLOADTHING_TOKEN = "";
    dataMocks.fetchDeletedRawSamplesForCleanup.mockResolvedValue([]);

    await expect(
      cleanupDeletedRawSamples({ dryRun: false }),
    ).rejects.toThrowError("UPLOADTHING_TOKEN is required to clean up raw samples");
  });

  afterAll(() => {
    process.env.UPLOADTHING_TOKEN = originalUploadThingToken;
  });
});
