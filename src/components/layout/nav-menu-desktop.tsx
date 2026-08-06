"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import type { HeaderNavItem } from "~/components/layout/header-model";
import { iconMap } from "~/lib/nav-items";
import { cn } from "~/lib/utils";

type HeaderNavSubItem = NonNullable<HeaderNavItem["items"]>[number];

function NavMenuCard({
  item,
  featured = false,
  list = false,
  featuredContent,
}: {
  item: HeaderNavSubItem;
  featured?: boolean;
  list?: boolean;
  featuredContent?: ReactNode;
}) {
  const Icon = item.iconKey ? iconMap[item.iconKey] : null;

  return (
    <Link
      href={item.href}
      className={cn(
        "group hover:bg-accent/30 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block no-underline outline-none select-none",
        featured
          ? "to-background dark:from-primary/10 dark:to-background relative flex min-h-55 flex-col justify-between overflow-hidden rounded-xl border bg-linear-to-br from-white p-4"
          : list
            ? "min-h-0 space-y-1 px-3 py-2 leading-none"
            : "min-h-[96px] space-y-1 rounded-xl border p-3 leading-none",
      )}
    >
      {featured && featuredContent && (
        <div
          aria-hidden="true"
          data-nav-featured-slot="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-75 [&>*]:h-full [&>*]:w-full [&>*]:max-w-none"
        >
          {featuredContent}
        </div>
      )}
      <div
        className={cn(
          "relative z-10 flex",
          featured ? "flex-col items-start gap-3" : "items-center gap-2",
        )}
      >
        {Icon && !featured && (
          <Icon
            className={cn(
              "text-muted-foreground group-hover:text-accent-foreground",
              featured ? "h-7 w-7" : "h-4 w-4",
            )}
          />
        )}
        <div
          className={cn(
            "font-medium",
            featured ? "text-base" : "text-sm leading-none",
          )}
        >
          {item.title}
        </div>
      </div>
      {item.description && (
        <p
          className={cn(
            "text-muted-foreground group-hover:text-accent-foreground relative z-10 line-clamp-3 text-xs leading-snug",
            featured && "max-w-[18rem] text-sm leading-relaxed",
          )}
        >
          {item.description}
        </p>
      )}
    </Link>
  );
}

function NavMenuCategory({
  items,
  featuredContent,
}: {
  items: HeaderNavSubItem[];
  featuredContent?: ReactNode;
}) {
  if (items.length < 4) {
    return (
      <div
        data-nav-category-layout="vertical"
        className="divide-border flex w-[400px] flex-col divide-y px-1.5 py-1 md:w-[500px] lg:w-[600px]"
      >
        {items.map((subItem) => (
          <NavMenuCard key={subItem.title} item={subItem} list />
        ))}
      </div>
    );
  }

  const featuredItem = items.find((item) => item.featured);

  if (!featuredItem) {
    return (
      <div
        data-nav-category-layout="standard"
        className="divide-border flex w-[400px] flex-col divide-y px-1.5 py-1 md:w-[500px] lg:w-[600px]"
      >
        {items.map((subItem) => (
          <NavMenuCard key={subItem.title} item={subItem} list />
        ))}
      </div>
    );
  }

  const regularItems = items.filter((item) => item !== featuredItem);

  return (
    <div
      data-nav-category-layout="featured"
      className={cn(
        "grid w-[400px] gap-1.5 p-1.5 md:w-[520px] md:grid-cols-[minmax(145px,0.8fr)_minmax(0,1.65fr)] lg:w-[680px]",
      )}
    >
      <NavMenuCard
        item={featuredItem}
        featured
        featuredContent={featuredContent}
      />
      <div className="grid grid-cols-2 gap-1.5">
        {regularItems.map((subItem) => (
          <NavMenuCard key={subItem.title} item={subItem} />
        ))}
      </div>
    </div>
  );
}

export function NavMenuDesktop({
  items,
  featuredContent,
}: {
  items: HeaderNavItem[];
  featuredContent?: ReactNode;
}) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {items.map((item) => {
          if (item.items && item.items.length > 0) {
            // Category with dropdown items still available
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavMenuCategory
                    items={item.items}
                    featuredContent={featuredContent}
                  />
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          } else {
            // Simple link item
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink asChild className="rounded-md">
                  <Link
                    href={item.href}
                    className={cn(navigationMenuTriggerStyle())}
                  >
                    {item.title}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
