"use client";

import * as React from "react";
import type { UserRole } from "~/auth";
// import {
//     IconCamera,
//     IconChartBar,
//     IconDashboard,
//     IconDatabase,
//     IconFileAi,
//     IconFileDescription,
//     IconFileWord,
//     IconFolder,
//     IconHelp,
//     IconInnerShadowTop,
//     IconListDetails,
//     IconReport,
//     IconSearch,
//     IconSettings,
//     IconUsers,
//   } from "lucide-react";

// import { NavDocuments } from "~/components/nav-documents";
// import { NavMain } from "~/components/nav-main";
// import { NavSecondary } from "~/components/nav-secondary";
// import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  BarChart3,
  CombineIcon,
  Camera,
  Lock,
  LayoutDashboard,
  Users,
  ListCheck,
  LogOut,
  Plus,
  HelpCircle,
  Wrench,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { useSession } from "~/lib/auth/auth-client";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { GearCreateCard } from "./gear-create";
import { requireRole } from "~/lib/auth/auth-helpers";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowed: UserRole[];
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Approvals",
    href: "/admin",
    icon: <CombineIcon className="size-5" />,
    allowed: ["ADMIN", "SUPERADMIN", "EDITOR"],
  },
  {
    label: "Gear",
    href: "/admin/gear",
    icon: <Camera className="size-5" />,
    allowed: ["EDITOR", "ADMIN", "SUPERADMIN"],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart3 className="size-5" />,
    allowed: ["ADMIN", "SUPERADMIN"],
  },
  {
    label: "Tools",
    href: "/admin/tools",
    icon: <Wrench className="size-5" />,
    allowed: ["ADMIN", "SUPERADMIN"],
  },
  {
    label: "Leaderboard",
    href: "/admin/leaderboard",
    icon: <Users className="size-5" />,
    allowed: ["ADMIN", "SUPERADMIN", "EDITOR"],
  },
  {
    label: "Logs",
    href: "/admin/logs",
    icon: <ListCheck className="size-5" />,
    allowed: ["ADMIN", "SUPERADMIN", "EDITOR"],
  },
  {
    label: "Help",
    href: "/admin/help",
    icon: <HelpCircle className="size-5" />,
    allowed: ["ADMIN", "SUPERADMIN", "EDITOR"],
  },
  {
    label: "Private",
    href: "/admin/private",
    icon: <Lock className="size-5" />,
    allowed: ["ADMIN", "SUPERADMIN"],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data, isPending, error } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>Unauthenticated</div>;
  }

  const user = data.user;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <span className="text-base font-semibold">Sharply</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="list-none px-4">
        {isPending ? (
          <>
            <Skeleton className="h-8 w-40 rounded-md" />
            {Array.from({ length: sidebarItems.length }).map((_, idx) => (
              <SidebarMenuItem key={`skeleton-${idx}`}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </>
        ) : (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" icon={<Plus className="size-5" />}>
                  Create Gear Item
                </Button>
              </DialogTrigger>
              <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-3xl">
                <GearCreateCard />
              </DialogContent>
            </Dialog>
            {/* Only show links the user is allowed to see */}
            {sidebarItems
              .filter((item) => requireRole(user, item.allowed))
              .map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className="data-[slot=sidebar-menu-item]:!p-1.5"
                  >
                    <Link href={item.href}>
                      {item.icon} {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </>
        )}
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
