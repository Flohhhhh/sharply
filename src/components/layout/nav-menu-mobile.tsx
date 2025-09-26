"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Menu, X } from "lucide-react";
import { getNavItems, iconMap } from "~/lib/nav-items";
import type { UserMenuUser } from "./user-menu";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";

interface NavMenuMobileProps {
  children: React.ReactNode;
  user?: UserMenuUser;
}

export function NavMenuMobile({ children, user = null }: NavMenuMobileProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const navItems = getNavItems();

  const handleNavigation = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle className="text-left">Sharply</SheetTitle>
        </SheetHeader>

        {/* Top user section */}
        {user && (
          <div className="bg-muted/30 border-b px-4 py-3 text-sm">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleNavigation(`/u/${user.id}`)}
                className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors"
              >
                <UserIcon className="text-muted-foreground h-4 w-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => handleNavigation("/profile/settings")}
                className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors"
              >
                <Settings className="text-muted-foreground h-4 w-4" />
                <span>Account</span>
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md p-3 text-left text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1 px-4 py-2">
          <Accordion type="single" collapsible className="w-full">
            {navItems.map((item) => {
              if (item.items && item.items.length > 0) {
                // Category with accordion items
                return (
                  <AccordionItem
                    key={item.title}
                    value={item.title}
                    className="border-b"
                  >
                    <AccordionTrigger className="px-0 py-3 text-left hover:no-underline">
                      <span className="text-foreground font-semibold">
                        {item.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 px-4 pt-1 pb-2">
                        {item.items.map((subItem) => {
                          const Icon = subItem.iconKey
                            ? iconMap[subItem.iconKey]
                            : null;

                          return (
                            <button
                              key={subItem.title}
                              onClick={() => handleNavigation(subItem.url)}
                              className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md p-3 text-left text-sm transition-colors"
                            >
                              {Icon && (
                                <Icon className="text-muted-foreground h-4 w-4" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">
                                  {subItem.title}
                                </div>
                                {subItem.description && (
                                  <div className="text-muted-foreground line-clamp-2 text-xs">
                                    {subItem.description}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              } else {
                // Simple link item
                return (
                  <button
                    key={item.title}
                    onClick={() => handleNavigation(item.url)}
                    className="hover:bg-accent hover:text-accent-foreground flex w-full items-center rounded-md px-0 py-3 text-left text-sm font-medium transition-colors"
                  >
                    {item.title}
                  </button>
                );
              }
            })}
          </Accordion>
        </div>

        {/* Bottom spacer */}
        <SheetFooter />
      </SheetContent>
    </Sheet>
  );
}
