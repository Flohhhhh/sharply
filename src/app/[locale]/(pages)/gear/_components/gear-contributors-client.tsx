"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export interface ContributorItem {
  id: string;
  name: string | null;
  handle: string | null;
  memberNumber: number;
  image: string | null;
  count: number;
}

export function GearContributorsClient({
  contributors,
}: {
  contributors: ContributorItem[];
}) {
  if (!contributors || contributors.length === 0) return null;

  const topFive = contributors.slice(0, 5);
  const remaining = contributors.length - topFive.length;

  const getInitials = (name: string | null) => {
    const initials = (name || "U")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0]!)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return initials;
  };

  return (
    <div className="mt-12">
      <h2 className="mb-4 text-lg font-semibold">Contributors</h2>
      <Dialog>
        <DialogTrigger
          asChild
          title="View all contributors"
          className="hover:cursor-pointer"
        >
          <button className="hover:bg-muted/50 flex w-full items-center justify-center gap-3 rounded-md border px-3 py-2 text-left">
            <ul className="flex items-center -space-x-2">
              {topFive.map((u) => (
                <li key={u.id} className="min-w-0">
                  <Avatar className="ring-background size-8 ring-2">
                    <AvatarImage
                      src={u.image ?? undefined}
                      alt={u.name ?? "User"}
                    />
                    <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                  </Avatar>
                </li>
              ))}
              {remaining > 0 && (
                <li>
                  <span className="bg-muted text-muted-foreground ring-background inline-flex size-8 items-center justify-center rounded-full text-xs ring-2">
                    +{remaining}
                  </span>
                </li>
              )}
            </ul>
            {/* <span className="text-sm">View all contributors</span> */}
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contributors</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <ul className="divide-border divide-y">
              {contributors.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <Link
                    href={`/u/${u.handle || `user-${u.memberNumber}`}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="size-8">
                      <AvatarImage
                        src={u.image ?? undefined}
                        alt={u.name ?? "User"}
                      />
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{u.name || u.id}</span>
                  </Link>
                  <span className="text-muted-foreground text-sm">
                    {u.count} field{u.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
