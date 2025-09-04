import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

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

  if (!["ADMIN", "EDITOR"].includes((session.user as any).role)) {
    return (
      <div className="bg-background min-h-screen">
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-3xl font-bold">Access denied</h1>
            <p className="text-muted-foreground mt-2">
              You don’t have permission to view this page.
            </p>
            <div className="mt-6">
              <a className="text-primary underline" href="/">
                Go back home
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="border-border bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
