"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export type LearnMobileArticleGroup = {
  title: string;
  items: Array<{
    title: string;
    href: string;
  }>;
};

export default function LearnMobileArticleSheet({
  groups,
}: {
  groups: LearnMobileArticleGroup[];
}) {
  if (!groups.length) {
    return null;
  }

  return (
    <div className="bg-background/95 sticky top-0 z-40 mt-16 border-b shadow-sm backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3">
        <div>
          <p className="text-foreground text-sm font-semibold">
            Learn articles
          </p>
          <p className="text-muted-foreground text-xs">Browse by category</p>
        </div>
        <Sheet>
          <SheetTrigger className="border-input hover:border-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition">
            <Menu className="size-4" />
            Open list
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[80vh] overflow-y-auto px-0"
          >
            <SheetHeader>
              <SheetTitle>Browse all articles</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 px-6 pb-24">
              {groups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-foreground hover:bg-muted block rounded-md px-2 py-1 text-sm font-medium transition"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
