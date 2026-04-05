import { test as base, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { UserRole } from "~/auth";

type LoginOptions = {
  role?: UserRole;
  email?: string;
  name?: string;
  handle?: string;
};

type AuthFixtures = {
  loginAs: (options?: LoginOptions) => Promise<{
    id: string;
    email: string;
    name?: string | null;
    handle?: string | null;
    role: UserRole;
  }>;
};

export const test = base.extend<AuthFixtures>({
  loginAs: async ({ context, page }, use) => {
    const loginAs: AuthFixtures["loginAs"] = async (options = {}) => {
      const role = options.role ?? "USER";
      const email = options.email ?? `playwright-${randomUUID()}@example.com`;
      const name = options.name ?? `Playwright ${role}`;
      const handle =
        options.handle ?? `playwright-${randomUUID().replace(/-/g, "").slice(0, 12)}`;

      await context.clearCookies();
      const params = new URLSearchParams({
        email,
        name,
        role,
        handle,
        redirectTo: "/",
      });
      await page.goto(`/api/dev-login?${params.toString()}`);
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe("/");

      return {
        id: "",
        email,
        name,
        handle,
        role,
      };
    };

    await use(loginAs);
  },
});

export { expect };
