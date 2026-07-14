import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeveloperApiError } from "~/server/developer-api/errors";

const mocks = vi.hoisted(() => ({
  createDeveloperApiKey: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("~/server/developer-api/service", () => ({
  createDeveloperApiKey: mocks.createDeveloperApiKey,
  createDeveloperApiKeyForAdmin: vi.fn(),
  revokeDeveloperApiKey: vi.fn(),
  revokeDeveloperApiKeyForAdmin: vi.fn(),
  setDeveloperAccessForUser: vi.fn(),
}));

import { actionCreateDeveloperApiKey } from "~/server/developer-api/actions";

describe("developer API actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves expected DeveloperApiError details", async () => {
    mocks.createDeveloperApiKey.mockRejectedValue(
      new DeveloperApiError(
        "key_limit_reached",
        409,
        "You can have up to three active API keys.",
      ),
    );

    const formData = new FormData();
    formData.set("name", "Production");

    await expect(actionCreateDeveloperApiKey(formData)).resolves.toEqual({
      ok: false,
      code: "key_limit_reached",
      message: "You can have up to three active API keys.",
    });
  });

  it("returns a safe failure for unexpected errors", async () => {
    mocks.createDeveloperApiKey.mockRejectedValue(new Error("Database down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(actionCreateDeveloperApiKey(new FormData())).resolves.toEqual({
      ok: false,
      code: undefined,
      message: undefined,
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Developer API action failed:",
      expect.any(Error),
    );
  });
});
