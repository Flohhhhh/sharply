import { beforeEach,describe,expect,it,vi } from "vitest";

const botIdMocks = vi.hoisted(() => ({
  classifyBotTraffic: vi.fn(),
}));

const gearServiceMocks = vi.hoisted(() => ({
  fetchApprovedReviews: vi.fn(),
  fetchMyReviewStatus: vi.fn(),
  submitReview: vi.fn(),
}));

vi.mock("~/server/security/botid", () => botIdMocks);
vi.mock("~/server/gear/service", () => gearServiceMocks);

import { POST } from "~/app/api/gear/[slug]/reviews/route";

describe("gear review route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    botIdMocks.classifyBotTraffic.mockResolvedValue({ isBot: false });
  });

  it("rejects bot-classified review submissions before the service runs", async () => {
    botIdMocks.classifyBotTraffic.mockResolvedValue({ isBot: true });

    const response = await POST(
      new Request("http://localhost/api/gear/nikon-zf/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "Great camera",
          genres: ["street"],
          recommend: true,
        }),
      }) as any,
      {
        params: Promise.resolve({ slug: "nikon-zf" }),
      },
    );

    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({
      ok: false,
      type: "MODERATION_BLOCKED",
      code: "REVIEW_BOT_BLOCKED",
      message: "Access denied.",
    });
    expect(gearServiceMocks.submitReview).not.toHaveBeenCalled();
  });

  it("preserves the success path for human submissions", async () => {
    gearServiceMocks.submitReview.mockResolvedValue({
      ok: true,
      review: {
        id: "review-1",
        gearId: "gear-1",
        createdById: "user-1",
        status: "APPROVED",
        genres: ["street"],
        recommend: true,
        content: "Great camera",
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
      },
      moderation: { decision: "APPROVED" },
    });

    const response = await POST(
      new Request("http://localhost/api/gear/nikon-zf/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "Great camera",
          genres: ["street"],
          recommend: true,
        }),
      }) as any,
      {
        params: Promise.resolve({ slug: "nikon-zf" }),
      },
    );

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(gearServiceMocks.submitReview).toHaveBeenCalledWith("nikon-zf", {
      content: "Great camera",
      genres: ["street"],
      recommend: true,
    });
  });
});
