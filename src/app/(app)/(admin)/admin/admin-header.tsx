import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { ThemeSwitcher } from "~/components/theme-switcher";
import { NotificationsDropdown } from "~/components/layout/notifications/notifications-dropdown";
import type { NotificationView } from "~/server/notifications/service";

type SiteHeaderProps = {
  notifications: {
    notifications: NotificationView[];
    archived: NotificationView[];
    unreadCount: number;
  } | null;
};

export function SiteHeader({ notifications }: SiteHeaderProps) {
  const notificationsData =
    notifications ?? { notifications: [], archived: [], unreadCount: 0 };

  return (
    <header className="bg-background fixed right-0 left-0 z-50 flex h-(--header-height) items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:left-[calc(var(--sidebar-width)+2px)]">
      <div className="flex w-full items-center justify-between gap-8 px-4 lg:gap-2 lg:px-6">
        <div className="flex w-fit items-center gap-2">
          <SidebarTrigger className="-ml-1 block md:hidden" />
          <h1 className="hidden shrink-0 text-sm font-medium md:block">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex w-full items-center gap-2">
          <GlobalSearchBar size="sm" className="z-60 ml-auto w-full max-w-lg" />
          <NotificationsDropdown data={notificationsData} />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
