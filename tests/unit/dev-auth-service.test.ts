/*
These tests lock down the development auth bypass safety contract.
If they fail, the bypass may no longer stay opt-in, dev-only, or deterministic.
*/

import { beforeEach,describe,expect,it,vi } from "vitest";

const envMocks = vi.hoisted(() => ({
  env: {
    NODE_ENV: "development" as "development" | "test" | "production",
    DEV_AUTH: undefined as string | undefined,
    DEV_AUTH_EMAIL: undefined as string | undefined,
    DEV_AUTH_LOCALHOST_ONLY: undefined as string | undefined,
    DEV_AUTH_PREVIEW: undefined as string | undefined,
  },
}));

const dataMocks = vi.hoisted(() => ({
  findUserByEmailData: vi.fn(),
  createDevelopmentUserData: vi.fn(),
}));

const discordLogMocks = vi.hoisted(() => ({
  notifyUserSignup: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => envMocks);
vi.mock("~/server/auth/dev-auth/data", () => dataMocks);
vi.mock("~/server/discord-logs/general", () => discordLogMocks);

import {
  getDevelopmentAuthEmail,
  getOrCreateDevelopmentAuthUser,
  isDevelopmentAuthEnabled,
  isDevelopmentAuthEnabledForConfig,
  isDevelopmentAuthHostAllowed,
  isDevelopmentAuthRequestAllowed,
  resolveDevelopmentAuthEmail,
} from "~/server/auth/dev-auth/service";

const baseUser = {
  id: "user-1",
  name: "Development User",
  handle: null,
  email: "dev@sharply.local",
  emailVerified: true,
  image: null,
  role: "USER" as const,
  memberNumber: 1,
  inviteId: null,
  socialLinks: [],
  createdAt: new Date("2026-03-13T00:00:00.000Z"),
  updatedAt: new Date("2026-03-13T00:00:00.000Z"),
};

describe("development auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMocks.env.NODE_ENV = "development";
    envMocks.env.DEV_AUTH = undefined;
    envMocks.env.DEV_AUTH_EMAIL = undefined;
    envMocks.env.DEV_AUTH_LOCALHOST_ONLY = undefined;
    envMocks.env.DEV_AUTH_PREVIEW = undefined;
  });

  it("keeps production disabled unless the preview override is explicit", () => {
    expect(
      isDevelopmentAuthEnabledForConfig({
        nodeEnv: "production",
        devAuthFlag: "true",
      }),
    ).toBe(false);

    expect(
      isDevelopmentAuthEnabledForConfig({
        nodeEnv: "production",
        devAuthFlag: "true",
        devAuthPreviewFlag: "true",
      }),
    ).toBe(true);
  });

  it("requires the explicit DEV_AUTH=true opt-in", () => {
    expect(
      isDevelopmentAuthEnabledForConfig({
        nodeEnv: "development",
        devAuthFlag: undefined,
      }),
    ).toBe(false);

    expect(
      isDevelopmentAuthEnabledForConfig({
        nodeEnv: "development",
        devAuthFlag: "true",
      }),
    ).toBe(true);
  });

  it("uses the configured email and falls back to the default email", () => {
    expect(resolveDevelopmentAuthEmail({ nodeEnv: "development" })).toBe(
      "dev@sharply.local",
    );

    expect(
      resolveDevelopmentAuthEmail({
        nodeEnv: "development",
        devAuthEmail: "camera-bot@example.com",
      }),
    ).toBe("camera-bot@example.com");
  });

  it("reflects the runtime env guard", () => {
    envMocks.env.DEV_AUTH = "true";
    expect(isDevelopmentAuthEnabled()).toBe(true);

    envMocks.env.NODE_ENV = "production";
    expect(isDevelopmentAuthEnabled()).toBe(false);

    envMocks.env.DEV_AUTH_PREVIEW = "true";
    expect(isDevelopmentAuthEnabled()).toBe(true);
  });

  it("requires localhost hosts by default", () => {
    expect(isDevelopmentAuthHostAllowed("localhost:3000")).toBe(true);
    expect(isDevelopmentAuthHostAllowed("example.com")).toBe(false);
    expect(isDevelopmentAuthHostAllowed(null)).toBe(false);
  });

  it("allows non-localhost hosts only when explicitly configured", () => {
    expect(isDevelopmentAuthHostAllowed("ci.internal", "false")).toBe(true);
  });

  it("combines the runtime and host guards", () => {
    envMocks.env.DEV_AUTH = "true";

    expect(isDevelopmentAuthRequestAllowed("localhost:3000")).toBe(true);
    expect(isDevelopmentAuthRequestAllowed("preview.example.com")).toBe(false);

    envMocks.env.DEV_AUTH_LOCALHOST_ONLY = "false";
    expect(isDevelopmentAuthRequestAllowed("preview.example.com")).toBe(true);

    envMocks.env.NODE_ENV = "production";
    expect(isDevelopmentAuthRequestAllowed("localhost:3000")).toBe(false);

    envMocks.env.DEV_AUTH_PREVIEW = "true";
    expect(isDevelopmentAuthRequestAllowed("localhost:3000")).toBe(true);
  });

  it("returns an existing dev user when one matches the configured email", async () => {
    envMocks.env.DEV_AUTH = "true";
    envMocks.env.DEV_AUTH_EMAIL = baseUser.email;
    dataMocks.findUserByEmailData.mockResolvedValue(baseUser);

    const result = await getOrCreateDevelopmentAuthUser();

    expect(result).toEqual(baseUser);
    expect(dataMocks.findUserByEmailData).toHaveBeenCalledWith(baseUser.email);
    expect(dataMocks.createDevelopmentUserData).not.toHaveBeenCalled();
    expect(discordLogMocks.notifyUserSignup).not.toHaveBeenCalled();
  });

  it("creates the dev user when the configured email is missing", async () => {
    envMocks.env.DEV_AUTH = "true";
    dataMocks.findUserByEmailData.mockResolvedValue(null);
    dataMocks.createDevelopmentUserData.mockResolvedValue(baseUser);

    const result = await getOrCreateDevelopmentAuthUser();

    expect(result).toEqual(baseUser);
    expect(dataMocks.findUserByEmailData).toHaveBeenCalledWith(
      "dev@sharply.local",
    );
    expect(dataMocks.createDevelopmentUserData).toHaveBeenCalledWith(
      "dev@sharply.local",
    );
    expect(discordLogMocks.notifyUserSignup).toHaveBeenCalledWith({
      name: "Development User",
      provider: "Development bypass",
    });
  });

  it("refuses to fetch or create users when the bypass is disabled", async () => {
    await expect(getOrCreateDevelopmentAuthUser()).rejects.toThrow(
      /Development auth bypass is disabled/,
    );

    expect(dataMocks.findUserByEmailData).not.toHaveBeenCalled();
    expect(dataMocks.createDevelopmentUserData).not.toHaveBeenCalled();
  });

  it("reads the configured runtime email", () => {
    envMocks.env.DEV_AUTH_EMAIL = "dev-agent@example.com";

    expect(getDevelopmentAuthEmail()).toBe("dev-agent@example.com");
  });
});
