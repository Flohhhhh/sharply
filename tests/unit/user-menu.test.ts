import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  AvatarFallback: ({ children }: { children: ReactNode }) =>
    createElement("span", null, children),
  AvatarImage: () => null,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DropdownMenuContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DropdownMenuItem: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DropdownMenuLabel: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DropdownMenuSeparator: () => createElement("hr"),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

vi.mock("~/lib/auth", () => ({ logOut: vi.fn() }));

import { UserMenu } from "~/components/layout/user-menu";

const labels = {
  account: "Account",
  anonymous: "Anonymous",
  developerPortal: "Developer Portal",
  logOut: "Log out",
  profile: "Profile",
};

function renderMenu(developerAccessEnabled: boolean) {
  return renderToStaticMarkup(
    createElement(UserMenu, {
      user: {
        id: "user-1",
        role: "USER",
        name: "Ava",
        developerAccessEnabled,
      },
      labels,
      profileHref: "/u/ava",
      accountHref: "/profile/settings",
      developerHref: "/developer",
    }),
  );
}

describe("UserMenu", () => {
  it("shows the developer portal only for users with developer access", () => {
    const markup = renderMenu(true);

    expect(markup).toContain("Developer Portal");
    expect(markup).toContain('href="/developer"');
  });

  it("hides the developer portal for users without developer access", () => {
    expect(renderMenu(false)).not.toContain("Developer Portal");
  });
});
