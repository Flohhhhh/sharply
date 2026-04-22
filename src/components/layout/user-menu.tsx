"use client";

import { Avatar,AvatarFallback,AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut,Settings,User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useMemo,useState } from "react";
import type { HeaderLabels } from "~/components/layout/header-model";
import { Spinner } from "~/components/ui/spinner";
import { logOut } from "~/lib/auth";

export type UserMenuUser = {
  id: string;
  role: string;
  handle?: string | null;
  memberNumber?: number | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

export function UserMenu({
  user,
  labels,
  profileHref,
  accountHref,
}: {
  user: UserMenuUser;
  labels: Pick<HeaderLabels, "account" | "anonymous" | "logOut" | "profile">;
  profileHref: string | null;
  accountHref: string;
}) {
  const initials = useMemo(() => {
    const source = user?.name || user?.email || "?";
    return source.trim().charAt(0).toUpperCase();
  }, [user?.name, user?.email]);

  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-ring data-[state=open]:ring-ring ring-offset-background inline-flex h-8 w-8 items-center justify-center rounded-full outline-hidden transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
        <Avatar>
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name ?? "User"} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Avatar>
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name ?? "User"} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {user.name || labels.anonymous}
              </div>
              {user.email && (
                <div className="text-muted-foreground truncate text-xs">
                  {user.email}
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={profileHref ?? "#"}
            className="flex w-full items-center gap-2"
          >
            <UserIcon className="size-4" />
            <span>{labels.profile}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={accountHref}
            className="flex w-full items-center gap-2"
          >
            <Settings className="size-4" />
            <span>{labels.account}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={loggingOut}
          onSelect={(e) => {
            e.preventDefault();
            setLoggingOut(true);
            void logOut();
          }}
          variant="destructive"
          className="text-red-600"
        >
          {loggingOut ? (
            <Spinner />
          ) : (
            <>
              <LogOut className="size-4" />
              <span>{labels.logOut}</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
