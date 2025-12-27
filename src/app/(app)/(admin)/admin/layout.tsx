import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, requireRole } from "~/server/auth";
import type { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import { SiteHeader } from "./admin-header";
import type { UserRole } from "~/server/auth";
import { fetchNotificationsForUser } from "~/server/notifications/service";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | Sharply",
  },
  openGraph: {
    title: {
      default: "Admin",
      template: "%s | Admin | Sharply",
    },
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Role check: only EDITOR and ADMIN may access
  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent("/admin")}`);
  }

  console.log(session.user.role);

  if (
    !requireRole(session, [
      "SUPERADMIN",
      "ADMIN",
      "EDITOR",
      "MODERATOR",
    ] as UserRole[])
  ) {
    return (
      <div className="bg-background min-h-screen">
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-3xl font-bold">Access denied</h1>
            <p className="text-muted-foreground mt-2">
              You don’t have permission to view this page.
            </p>
            <div className="mt-6">
              <Link className="text-primary underline" href="/">
                Go back home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const notifications = session?.user?.id
    ? await fetchNotificationsForUser({
        userId: session.user.id,
        limit: 10,
        archivedLimit: 5,
      })
    : null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="bg-background min-h-screen">
        <SiteHeader notifications={notifications} />

        <main className="container mx-auto mt-12 px-4 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
