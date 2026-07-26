import { beforeEach, describe, expect, it, vi } from "vitest";

const sharpMocks = vi.hoisted(() => ({
  metadata: vi.fn(),
  sharp: vi.fn(),
}));
const llmMocks = vi.hoisted(() => ({
  LLM_GEAR_IMAGE_REVIEW_REASONS: {
    LLM_REVIEW_UNAVAILABLE: "LLM_REVIEW_UNAVAILABLE",
    OBSCENE_OR_SEXUAL_CONTENT: "OBSCENE_OR_SEXUAL_CONTENT",
    UNSAFE_CONTENT: "UNSAFE_CONTENT",
    NOT_PHOTOGRAPHY_GEAR: "NOT_PHOTOGRAPHY_GEAR",
    SUSPICIOUS_CONTENT: "SUSPICIOUS_CONTENT",
  },
  reviewGearImageWithLlm: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("sharp", () => ({ default: sharpMocks.sharp }));
vi.mock("~/server/gear-image-review/llm", () => llmMocks);

import {
  GEAR_IMAGE_REVIEW_REASONS,
  llmImageReviewCheck,
  minimumImageLongEdgeCheck,
  reviewGearImageUpload,
  runGearImageReviewChecks,
  type GearImageReviewContext,
} from "~/server/gear-image-review/service";

function actor(role: GearImageReviewContext["actor"]["role"]) {
  return { id: `${role.toLowerCase()}-1`, role } as GearImageReviewContext["actor"];
}

const editorContext: GearImageReviewContext = {
  actor: actor("EDITOR"),
  gearId: "gear-1",
  imageType: "thumbnail",
  imageUrl: "https://utfs.io/f/front.webp",
};

describe("gear image review service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sharpMocks.sharp.mockReturnValue({ metadata: sharpMocks.metadata });
    sharpMocks.metadata.mockResolvedValue({ width: 1000, height: 700 });
    llmMocks.reviewGearImageWithLlm.mockResolvedValue({ status: "passed" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
      ),
    );
  });

  it("passes the registered baseline and LLM review slots for editors", async () => {
    await expect(reviewGearImageUpload(editorContext)).resolves.toEqual({
      status: "passed",
      checksRun: 2,
    });
  });

  it("keeps the LLM review slot as a pass-through until configured", async () => {
    await expect(llmImageReviewCheck(editorContext)).resolves.toEqual({
      status: "passed",
    });
  });

  it("skips checks for admins and superadmins", async () => {
    await expect(
      reviewGearImageUpload({
        ...editorContext,
        actor: actor("ADMIN"),
      }),
    ).resolves.toEqual({ status: "skipped", checksRun: 0 });
    await expect(
      reviewGearImageUpload({
        ...editorContext,
        actor: actor("SUPERADMIN"),
      }),
    ).resolves.toEqual({ status: "skipped", checksRun: 0 });
  });

  it("stops on the first blocking future check", async () => {
    const secondCheck = vi.fn(() => ({ status: "passed" as const }));

    await expect(
      runGearImageReviewChecks(editorContext, [
        () => ({ status: "blocked", reason: "Rejected" }),
        secondCheck,
      ]),
    ).resolves.toEqual({
      status: "blocked",
      checksRun: 1,
      reason: "Rejected",
    });
    expect(secondCheck).not.toHaveBeenCalled();
  });

  it("blocks an image whose long edge is under 800px", async () => {
    sharpMocks.metadata.mockResolvedValue({ width: 799, height: 600 });

    await expect(minimumImageLongEdgeCheck(editorContext)).resolves.toEqual({
      status: "blocked",
      reason: GEAR_IMAGE_REVIEW_REASONS.IMAGE_TOO_SMALL,
    });
  });

  it("rejects an image response larger than the upload limit before decoding", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1]), {
          status: 200,
          headers: { "content-length": String(4 * 1024 * 1024 + 1) },
        }),
      ),
    );

    await expect(minimumImageLongEdgeCheck(editorContext)).resolves.toEqual({
      status: "blocked",
      reason: GEAR_IMAGE_REVIEW_REASONS.IMAGE_UNREADABLE,
    });
    expect(sharpMocks.sharp).not.toHaveBeenCalled();
  });

  it("rejects a too-small editor upload before it can be persisted", async () => {
    sharpMocks.metadata.mockResolvedValue({ width: 799, height: 600 });

    await expect(reviewGearImageUpload(editorContext)).rejects.toMatchObject({
      message: "GEAR_IMAGE_REVIEW_REJECTED:IMAGE_TOO_SMALL",
      status: 422,
      code: "GEAR_IMAGE_REVIEW_REJECTED",
    });
  });

  it("rejects a non-UploadThing URL before fetching it", async () => {
    await expect(
      reviewGearImageUpload({
        ...editorContext,
        imageUrl: "http://169.254.169.254/latest/meta-data",
      }),
    ).rejects.toMatchObject({
      message: "GEAR_IMAGE_REVIEW_REJECTED:INVALID_UPLOAD_URL",
      status: 422,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
