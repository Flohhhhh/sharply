import { describe, expect, it, vi } from "vitest";

const discordLogMocks = vi.hoisted(() => ({
  notifyUserSignup: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/discord-logs/general", () => discordLogMocks);

import {
  dispatchUserSignupNotification,
  resolveUserSignupProvider,
} from "~/server/discord-logs/user-signup";

describe("Better Auth signup notification adapter", () => {
  it("maps known and unknown OAuth provider ids", () => {
    expect(resolveUserSignupProvider("google")).toBe("Google");
    expect(resolveUserSignupProvider("discord")).toBe("Discord");
    expect(resolveUserSignupProvider("passkey")).toBe("Unknown");
    expect(resolveUserSignupProvider(undefined)).toBe("Unknown");
  });

  it("schedules one Google signup notification outside the auth hook", async () => {
    const backgroundTasks: Promise<unknown>[] = [];
    discordLogMocks.notifyUserSignup.mockResolvedValue({ status: "sent" });

    dispatchUserSignupNotification({
      name: "Ada Lovelace",
      authContext: {
        params: { id: "google" },
        context: {
          runInBackground: (task) => {
            backgroundTasks.push(task);
          },
        },
      },
    });

    expect(discordLogMocks.notifyUserSignup).toHaveBeenCalledTimes(1);
    expect(discordLogMocks.notifyUserSignup).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      provider: "Google",
    });
    expect(backgroundTasks).toHaveLength(1);
    await expect(backgroundTasks[0]).resolves.toEqual({ status: "sent" });
  });

  it("prefers the direct social provider from the request body", () => {
    discordLogMocks.notifyUserSignup.mockResolvedValue({ status: "sent" });

    dispatchUserSignupNotification({
      name: "Ada Lovelace",
      authContext: {
        body: {
          provider: "discord",
        },
        params: { id: "google" },
      },
    });

    expect(discordLogMocks.notifyUserSignup).toHaveBeenLastCalledWith({
      name: "Ada Lovelace",
      provider: "Discord",
    });
  });

  it("uses the account provider before falling back to the route parameter", () => {
    discordLogMocks.notifyUserSignup.mockResolvedValue({ status: "sent" });

    dispatchUserSignupNotification({
      name: "Ada Lovelace",
      authContext: {
        body: {
          account: {
            providerId: "google",
          },
        },
        params: { id: "discord" },
      },
    });

    expect(discordLogMocks.notifyUserSignup).toHaveBeenLastCalledWith({
      name: "Ada Lovelace",
      provider: "Google",
    });
  });
});
