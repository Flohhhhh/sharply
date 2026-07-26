import { describe, expect, it, vi } from "vitest";

import {
  findBlobByFilename,
  findDuplicateFilenames,
  hasMatchingSize,
  migratePreparedMedia,
  prepareMediaMigration,
} from "../../src/server/payload/media-blob-migration";

describe("Payload media Blob migration", () => {
  it("maps legacy UploadThing media to its exact Payload filename", () => {
    expect(
      prepareMediaMigration({
        id: 7,
        _key: "legacy/key",
        filename: "photo.jpg",
        filesize: 42,
        mimeType: "image/jpeg",
      }),
    ).toEqual({
      ok: true,
      value: {
        id: 7,
        filename: "photo.jpg",
        expectedSize: 42,
        mimeType: "image/jpeg",
        sourceUrl: "https://utfs.io/f/legacy%2Fkey",
      },
    });
  });

  it("rejects media missing a filename or legacy key", () => {
    expect(prepareMediaMigration({ id: 1, _key: "key" })).toEqual({
      ok: false,
      error: "missing Payload filename",
    });
    expect(prepareMediaMigration({ id: 2, filename: "photo.jpg" })).toEqual({
      ok: false,
      error: "missing legacy UploadThing key",
    });
  });

  it("detects destination size mismatches", () => {
    expect(hasMatchingSize(100, 100)).toBe(true);
    expect(hasMatchingSize(99, 100)).toBe(false);
    expect(hasMatchingSize(99, null)).toBe(true);
  });

  it("detects duplicate destination filenames", () => {
    const base = {
      expectedSize: null,
      mimeType: undefined,
      sourceUrl: "https://utfs.io/f/key",
    };
    expect(
      findDuplicateFilenames([
        { ...base, id: 1, filename: "same.jpg" },
        { ...base, id: 2, filename: "other.jpg" },
        { ...base, id: 3, filename: "same.jpg" },
      ]),
    ).toEqual(["same.jpg"]);
  });

  it("walks Blob pages while hasMore is true and finds an exact pathname", async () => {
    const listPage = vi
      .fn()
      .mockResolvedValueOnce({
        blobs: [{ pathname: "photo.jpg.webp", size: 10, url: "wrong" }],
        cursor: "next",
        hasMore: true,
      })
      .mockResolvedValueOnce({
        blobs: [{ pathname: "photo.jpg", size: 42, url: "exact" }],
        hasMore: false,
      });

    await expect(findBlobByFilename("photo.jpg", listPage)).resolves.toEqual({
      size: 42,
      url: "exact",
    });
    expect(listPage).toHaveBeenNthCalledWith(1, undefined);
    expect(listPage).toHaveBeenNthCalledWith(2, "next");
  });

  it("stops when hasMore is false even if a cursor is present", async () => {
    const listPage = vi.fn().mockResolvedValue({
      blobs: [],
      cursor: "stale-cursor",
      hasMore: false,
    });

    await expect(
      findBlobByFilename("missing.jpg", listPage),
    ).resolves.toBeNull();
    expect(listPage).toHaveBeenCalledTimes(1);
  });

  it("classifies a verified existing object without uploading", async () => {
    const upload = vi.fn();
    const result = await migratePreparedMedia(
      {
        id: 1,
        filename: "photo.jpg",
        expectedSize: 42,
        mimeType: "image/jpeg",
        sourceUrl: "https://utfs.io/f/key",
      },
      {
        apply: true,
        findExisting: async () => ({ size: 42, url: "https://blob/photo.jpg" }),
        download: vi.fn(),
        upload,
        verify: vi.fn(),
      },
    );

    expect(result.status).toBe("already-present");
    expect(upload).not.toHaveBeenCalled();
  });

  it("reports a failed legacy download without silent success", async () => {
    const result = await migratePreparedMedia(
      {
        id: 2,
        filename: "missing.jpg",
        expectedSize: 42,
        mimeType: "image/jpeg",
        sourceUrl: "https://utfs.io/f/missing",
      },
      {
        apply: true,
        findExisting: async () => null,
        download: async () => {
          throw new Error("UploadThing download failed with HTTP 404");
        },
        upload: vi.fn(),
        verify: vi.fn(),
      },
    );

    expect(result).toMatchObject({
      status: "failed",
      error: "UploadThing download failed with HTTP 404",
    });
  });
});
