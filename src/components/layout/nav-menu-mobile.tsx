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

interface NavMenuMobileProps {
  children: React.ReactNode;
}

export function NavMenuMobile({ children }: NavMenuMobileProps) {
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
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left">Sharply</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 p-4">
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
                    <AccordionTrigger className="py-3 text-left hover:no-underline">
                      <span className="text-foreground font-semibold">
                        {item.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 px-4 pt-2 pb-2">
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
                    className="hover:bg-accent hover:text-accent-foreground mx-4 flex w-full items-center rounded-md p-3 text-left text-sm font-medium transition-colors"
                  >
                    {item.title}
                  </button>
                );
              }
            })}
          </Accordion>
        </div>

        {/* Bottom section with auth buttons */}
        <SheetFooter>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full justify-start">
              Login
            </Button>
            <Button className="w-full justify-start">Sign up</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
