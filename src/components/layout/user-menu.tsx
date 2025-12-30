"use client";

import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { LogOut, Settings, ShieldCheck, User as UserIcon } from "lucide-react";
import type { UserRole } from "~/auth";
import { logOut } from "~/lib/auth";
import { Spinner } from "~/components/ui/spinner";

export type UserMenuUser = {
  id: string;
  role: UserRole;
  handle?: string | null;
  memberNumber?: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

export function UserMenu({ user }: { user: UserMenuUser }) {
  const initials = useMemo(() => {
    const source = user?.name || user?.email || "?";
    return source.trim().charAt(0).toUpperCase();
  }, [user?.name, user?.email]);

  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  if (!user) return null;

  const isAdminOrEditor =
    user.role === "ADMIN" ||
    user.role === "SUPERADMIN" ||
    user.role === "EDITOR";

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
                {user.name || "Anonymous"}
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
            href={`/u/${user.handle || `user-${user.memberNumber}`}`}
            className="flex w-full items-center gap-2"
          >
            <UserIcon className="size-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/profile/settings"
            className="flex w-full items-center gap-2"
          >
            <Settings className="size-4" />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        {false && isAdminOrEditor && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex w-full items-center gap-2">
              <ShieldCheck className="size-4" />
              <span>Admin</span>
            </Link>
          </DropdownMenuItem>
        )}
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
              <span>Log out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
