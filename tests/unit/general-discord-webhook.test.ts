import { afterEach,describe,expect,it,vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DISCORD_GENERAL_LOGS_WEBHOOK_URL: undefined,
  },
}));

import { notifyUserSignup } from "~/server/discord-logs/general";

describe("general Discord signup webhook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips delivery when the optional webhook is unset", async () => {
    const fetch = vi.fn();

    await expect(
      notifyUserSignup(
        { name: "Ada", provider: "Google" },
        { fetch },
      ),
    ).resolves.toEqual({ status: "skipped_no_webhook" });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts a stable, mention-safe, length-bounded signup message", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    const unsafeName = `@everyone **${"A".repeat(160)}**`;

    await expect(
      notifyUserSignup(
        { name: unsafeName, provider: "Discord" },
        { fetch, webhookUrl: "https://discord.example/webhook" },
      ),
    ).resolves.toEqual({ status: "sent" });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, request] = fetch.mock.calls[0] as [string, RequestInit];
    expect(request.method).toBe("POST");

    const payload = JSON.parse(String(request.body)) as {
      username: string;
      content: string;
    };
    expect(payload.username).toBe("Sharply General Logs");
    expect(payload.content).toContain("New user signup");
    expect(payload.content).toContain("Provider: Discord");
    expect(payload.content).toContain("@\u200beveryone");
    expect(payload.content).not.toContain("@everyone");
    const nameLine = payload.content.split("\n")[1] ?? "";
    expect(nameLine.length).toBeLessThanOrEqual(128);
    expect(payload.content.length).toBeLessThanOrEqual(2_000);
  });

  it("returns a failure result for a Discord error response without throwing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 });

    await expect(
      notifyUserSignup(
        { name: "Ada", provider: "Google" },
        { fetch, webhookUrl: "https://discord.example/webhook" },
      ),
    ).resolves.toEqual({ status: "failed" });

    expect(error).toHaveBeenCalledWith(
      "[discord:general-logs] user signup webhook failed",
      { status: 429 },
    );
  });

  it("returns a failure result for a network error without throwing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetch = vi.fn().mockRejectedValue(new Error("network unavailable"));

    await expect(
      notifyUserSignup(
        { name: "Ada", provider: "Google" },
        { fetch, webhookUrl: "https://discord.example/webhook" },
      ),
    ).resolves.toEqual({ status: "failed" });

    expect(error).toHaveBeenCalledWith(
      "[discord:general-logs] user signup webhook failed",
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
