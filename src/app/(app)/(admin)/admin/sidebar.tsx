"use client";

import * as React from "react";
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
  ListCheck,
  LogOut,
  Plus,
  HelpCircle,
  Wrench,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { GearCreateCard } from "./gear-create";

const sidebarItems = [
  {
    label: "Approvals",
    href: "/admin",
    icon: <CombineIcon className="size-5" />,
    allowed: ["ADMIN", "EDITOR"],
  },
  {
    label: "Gear",
    href: "/admin/gear",
    icon: <Camera className="size-5" />,
    allowed: ["EDITOR", "ADMIN"],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart3 className="size-5" />,
    allowed: ["ADMIN"],
  },
  {
    label: "Tools",
    href: "/admin/tools",
    icon: <Wrench className="size-5" />,
    allowed: ["ADMIN"],
  },
  {
    label: "Logs",
    href: "/admin/logs",
    icon: <ListCheck className="size-5" />,
    allowed: ["ADMIN", "EDITOR"],
  },
  {
    label: "Help",
    href: "/admin/help",
    icon: <HelpCircle className="size-5" />,
    allowed: ["ADMIN", "EDITOR"],
  },
  {
    label: "Private",
    href: "/admin/private",
    icon: <Lock className="size-5" />,
    allowed: [],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSession();
  const isLoading = user.status === "loading";

  if (user.status === "unauthenticated") {
    return <div>Unauthenticated</div>;
  }

  const superAdmins = ["bf34c0d0-bdff-477d-9c19-7211ed62c586"];

  const isLinkAllowed = (href: string) => {
    const item = sidebarItems.find((item) => item.href === href);
    return (
      item?.allowed.includes(user.data?.user?.role ?? "USER") ||
      superAdmins.includes(user.data?.user?.id ?? "")
    );
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <span className="text-base font-semibold">Sharply</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="list-none px-4">
        {isLoading ? (
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
              .filter((item) => isLinkAllowed(item.href))
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
