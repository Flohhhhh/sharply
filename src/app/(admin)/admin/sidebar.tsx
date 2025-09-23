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
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  BarChart3,
  Camera,
  LayoutDashboard,
  ListCheck,
  LogOut,
  Plus,
  Wrench,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { useSession } from "next-auth/react";

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="size-5" />,
    allowed: ["ADMIN", "EDITOR"],
  },
  {
    label: "Gear",
    href: "/admin/gear",
    icon: <Camera className="size-5" />,
    allowed: ["ADMIN"],
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
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSession();

  if (user.status === "loading") {
    return <div>Loading...</div>;
  }

  if (user.status === "unauthenticated") {
    return <div>Unauthenticated</div>;
  }

  const isLinkAllowed = (href: string) => {
    const item = sidebarItems.find((item) => item.href === href);
    return item?.allowed.includes(user.data?.user?.role ?? "USER");
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
        <Button size="sm" icon={<Plus className="size-5" />}>
          Create Gear Item
        </Button>
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
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
