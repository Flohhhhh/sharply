import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: ComponentProps<"a"> & { children?: ReactNode }) =>
    createElement("a", props, children),
}));

vi.mock("~/components/ui/navigation-menu", () => {
  const render =
    (tag: "nav" | "ul" | "li" | "div" | "button") =>
    ({
      children,
      ...props
    }: ComponentProps<"div"> & { children?: ReactNode }) =>
      createElement(tag, props, children);

  return {
    NavigationMenu: render("nav"),
    NavigationMenuContent: render("div"),
    NavigationMenuItem: render("li"),
    NavigationMenuLink: render("div"),
    NavigationMenuList: render("ul"),
    NavigationMenuTrigger: render("button"),
    navigationMenuTriggerStyle: () => "",
  };
});

import { NavMenuDesktop } from "~/components/layout/nav-menu-desktop";
import type { HeaderNavItem } from "~/components/layout/header-model";

const featuredItems: HeaderNavItem[] = [
  {
    title: "Gear",
    href: "/gear",
    items: [
      {
        title: "Browse",
        href: "/gear",
        description: "Explore gear",
        iconKey: "camera",
        featured: true,
      },
      {
        title: "Collections",
        href: "/tags",
        description: "Browse lists",
        iconKey: "camera",
      },
      {
        title: "Trending",
        href: "/trending",
        description: "Popular gear",
      },
      {
        title: "Contribute",
        href: "/contribute",
        description: "Help improve gear data",
      },
    ],
  },
];

describe("desktop navigation featured content", () => {
  it("renders the supplied content in a full-card faded background slot", () => {
    const markup = renderToStaticMarkup(
      createElement(NavMenuDesktop, {
        items: featuredItems,
        featuredContent: createElement("div", {
          "data-featured-background": "true",
        }),
      }),
    );

    expect(markup).toContain('data-nav-featured-slot="true"');
    expect(markup).toContain('data-featured-background="true"');
    expect(markup).toContain("absolute");
    expect(markup).toContain("inset-0");
    expect(markup).toContain("opacity-75");
    expect(markup.match(/lucide-camera/g)).toHaveLength(1);
  });

  it("does not place featured content in categories without a featured item", () => {
    const markup = renderToStaticMarkup(
      createElement(NavMenuDesktop, {
        items: [
          {
            title: "About",
            href: "/about",
            items: [
              {
                title: "Mission",
                href: "/about",
                description: "Our mission",
              },
            ],
          },
        ],
        featuredContent: createElement("div", {
          "data-featured-background": "true",
        }),
      }),
    );

    expect(markup).not.toContain('data-nav-featured-slot="true"');
    expect(markup).not.toContain('data-featured-background="true"');
    expect(markup).toContain('data-nav-category-layout="vertical"');
    expect(markup).toContain("divide-y");
    expect(markup).not.toContain("rounded-xl border");
  });

  it("uses a vertical list for categories with fewer than four items", () => {
    const markup = renderToStaticMarkup(
      createElement(NavMenuDesktop, {
        items: [
          {
            title: "Learn",
            href: "/learn",
            items: [
              { title: "Guides", href: "/learn/guides" },
              { title: "News", href: "/news" },
              { title: "About", href: "/about" },
            ],
          },
        ],
      }),
    );

    expect(markup).toContain('data-nav-category-layout="vertical"');
    expect(markup).toContain("divide-y");
    expect(markup).not.toContain("grid-cols-2");
  });
});
