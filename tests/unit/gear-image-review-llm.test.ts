import { beforeEach, describe, expect, it, vi } from "vitest";

const envMocks = vi.hoisted(() => ({
  env: {
    OPENROUTER_API_KEY: undefined as string | undefined,
    GEAR_IMAGE_REVIEW_MODEL: undefined as string | undefined,
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => envMocks);

import {
  DEFAULT_GEAR_IMAGE_REVIEW_MODEL,
  LLM_GEAR_IMAGE_REVIEW_REASONS,
  reviewGearImageWithLlm,
} from "~/server/gear-image-review/llm";
import type { GearImageReviewContext } from "~/server/gear-image-review/service";

const context = {
  actor: { id: "editor-1", role: "EDITOR" },
  gearId: "gear-1",
  imageType: "thumbnail",
  imageUrl: "https://utfs.io/f/front.webp",
} as GearImageReviewContext;

function completion(verdict: unknown) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(verdict) } }] }),
    { status: 200 },
  );
}

describe("OpenRouter gear image review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMocks.env.OPENROUTER_API_KEY = undefined;
    envMocks.env.GEAR_IMAGE_REVIEW_MODEL = undefined;
    vi.stubGlobal("fetch", vi.fn());
  });

  it("passes without a key so contributors do not need OpenRouter", async () => {
    await expect(reviewGearImageWithLlm(context)).resolves.toEqual({
      status: "passed",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("passes a valid model verdict and uses compact structured output", async () => {
    envMocks.env.OPENROUTER_API_KEY = "key";
    vi.mocked(fetch).mockResolvedValue(
      completion({ decision: "pass", confidence: 99, reason: "NONE" }),
    );

    await expect(reviewGearImageWithLlm(context)).resolves.toEqual({
      status: "passed",
    });
    const [, request] = vi.mocked(fetch).mock.calls[0]!;
    const body = JSON.parse(String(request?.body));
    expect(body).toMatchObject({
      model: DEFAULT_GEAR_IMAGE_REVIEW_MODEL,
      temperature: 0,
      max_tokens: 80,
      reasoning: { enabled: false },
      provider: { sort: "price", require_parameters: true },
      response_format: { type: "json_schema" },
    });
    expect(body.messages[0].content[1]).toEqual({
      type: "image_url",
      image_url: { url: context.imageUrl },
    });
    expect(body.messages[0].content[0].text).toContain(
      "camera gear or a camera-gear product image",
    );
    expect(body.messages[0].content[0].text).toContain(
      "If you cannot determine that camera gear is the primary subject",
    );
  });

  it("blocks a high-confidence clear violation", async () => {
    envMocks.env.OPENROUTER_API_KEY = "key";
    vi.mocked(fetch).mockResolvedValue(
      completion({
        decision: "block",
        confidence: 95,
        reason: "OBSCENE_OR_SEXUAL_CONTENT",
      }),
    );

    await expect(reviewGearImageWithLlm(context)).resolves.toEqual({
      status: "blocked",
      reason: LLM_GEAR_IMAGE_REVIEW_REASONS.OBSCENE_OR_SEXUAL_CONTENT,
    });
  });

  it("blocks whenever the model returns a block decision", async () => {
    envMocks.env.OPENROUTER_API_KEY = "key";
    vi.mocked(fetch).mockResolvedValue(
      completion({
        decision: "block",
        confidence: 0.99,
        reason: "NOT_PHOTOGRAPHY_GEAR",
      }),
    );

    await expect(reviewGearImageWithLlm(context)).resolves.toEqual({
      status: "blocked",
      reason: LLM_GEAR_IMAGE_REVIEW_REASONS.NOT_PHOTOGRAPHY_GEAR,
    });
  });

  it("passes when OpenRouter usage has run out", async () => {
    envMocks.env.OPENROUTER_API_KEY = "key";
    vi.mocked(fetch).mockResolvedValue(
      new Response("insufficient credits", { status: 402 }),
    );

    await expect(reviewGearImageWithLlm(context)).resolves.toEqual({
      status: "passed",
    });
  });

  it("blocks when the provider fails or returns malformed output", async () => {
    envMocks.env.OPENROUTER_API_KEY = "key";
    vi.mocked(fetch).mockResolvedValue(new Response("down", { status: 503 }));

    await expect(reviewGearImageWithLlm(context)).resolves.toEqual({
      status: "blocked",
      reason: LLM_GEAR_IMAGE_REVIEW_REASONS.LLM_REVIEW_UNAVAILABLE,
    });

    vi.mocked(fetch).mockResolvedValue(
      completion({ decision: "block", confidence: "high", reason: "UNKNOWN" }),
    );
    await expect(reviewGearImageWithLlm(context)).resolves.toEqual({
      status: "blocked",
      reason: LLM_GEAR_IMAGE_REVIEW_REASONS.LLM_REVIEW_UNAVAILABLE,
    });
  });
});
