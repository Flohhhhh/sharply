"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, Home } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "~/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { LocaleLink } from "~/components/locale-link";
import { useLocalePathnames } from "~/i18n/client";

export type LearnNavItem = {
  title: string;
  href: string;
};

export type LearnSection = {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: LearnNavItem[];
  defaultOpen?: boolean;
};

export function LearnSidebar({
  data,
}: {
  data?: { sections: LearnSection[]; rootItems?: LearnNavItem[] };
}) {
  const t = useTranslations("common");
  const { pathname } = useLocalePathnames();
  const sections = data?.sections ?? [];
  const rootItems = data?.rootItems ?? [];

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="none"
        style={{ "--sidebar": "transparent" } as React.CSSProperties}
      >
        <SidebarHeader className="mx-0 px-0 pb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/learn"}>
                <LocaleLink href="/learn" className="items-center">
                  <Home />
                  <span>{t("learnHome")}</span>
                </LocaleLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {sections.map((section) => {
            const isSectionActive = section.items.some((i) =>
              pathname?.startsWith(i.href),
            );

            return (
              <SidebarMenu key={section.title}>
                <Collapsible
                  defaultOpen={isSectionActive || section.defaultOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isSectionActive}>
                        {section.icon ? (
                          <section.icon className="h-4 w-4" />
                        ) : null}
                        <span>{section.title}</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {section.items.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.href}
                              className="hover:bg-accent/50 hover:text-primary data-[active=true]:bg-accent data-[active=true]:text-primary transition-colors"
                            >
                              <LocaleLink href={item.href}>
                                <span>{item.title}</span>
                              </LocaleLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            );
          })}
          {rootItems.length > 0 ? (
            <SidebarMenu>
              {rootItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="hover:bg-accent/50 hover:text-primary data-[active=true]:bg-accent data-[active=true]:text-primary transition-colors"
                  >
                    <LocaleLink href={item.href} className="items-center">
                      <span>{item.title}</span>
                    </LocaleLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          ) : null}
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

export default LearnSidebar;
