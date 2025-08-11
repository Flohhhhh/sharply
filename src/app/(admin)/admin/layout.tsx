import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // TODO: Add proper admin role check
  if (!session?.user) {
    redirect("/api/auth/signin");
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
