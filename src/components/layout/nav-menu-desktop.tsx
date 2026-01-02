"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import { getNavItems, iconMap } from "~/lib/nav-items";
import { cn } from "~/lib/utils";

export function NavMenuDesktop() {
  const navItems = getNavItems();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navItems.map((item) => {
          if (item.items && item.items.length > 0) {
            // Category with dropdown items still available
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-2 p-1 md:w-[500px] lg:w-[600px] lg:grid-cols-2">
                    {item.items.map((subItem) => {
                      const Icon = subItem.iconKey
                        ? iconMap[subItem.iconKey]
                        : null;

                      return (
                        <Link
                          key={subItem.title}
                          href={subItem.url}
                          className="group hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline outline-none select-none"
                        >
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon className="text-muted-foreground group-hover:text-accent-foreground h-4 w-4" />
                            )}
                            <div className="text-sm leading-none font-medium">
                              {subItem.title}
                            </div>
                          </div>
                          {subItem.description && (
                            <p className="text-muted-foreground group-hover:text-accent-foreground line-clamp-2 text-xs leading-snug">
                              {subItem.description}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          } else {
            // Simple link item
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink asChild className="rounded-md">
                  <Link
                    href={item.url}
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
