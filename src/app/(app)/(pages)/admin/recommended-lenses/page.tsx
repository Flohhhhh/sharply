import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { serviceListCharts } from "~/server/recommendations/service";
import { headers } from "next/headers";
import { requireRole } from "~/lib/auth/auth-helpers";

export const revalidate = 0;

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  if (!session || !requireRole(user, ["EDITOR"])) {
    redirect("/auth/signin?callbackUrl=/admin/recommended-lenses");
  }

  const charts = await serviceListCharts();

  return (
    <div className="mx-auto mt-24 max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recommended Lenses — Admin</h1>
        <Link
          href="/admin/recommended-lenses/new"
          className="bg-card hover:bg-accent rounded-md border px-3 py-2 text-sm"
        >
          New chart
        </Link>
      </header>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Brand</th>
              <th className="px-3 py-2 text-left font-medium">Slug</th>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">Updated</th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {charts.map((c) => (
              <tr key={`${c.brand}/${c.slug}`} className="border-t">
                <td className="px-3 py-2 align-top">{c.brand}</td>
                <td className="px-3 py-2 align-top">{c.slug}</td>
                <td className="px-3 py-2 align-top">{c.title}</td>
                <td className="px-3 py-2 align-top">
                  {new Date(
                    c.updatedDate as unknown as string,
                  ).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 align-top">
                  <Link
                    className="text-primary hover:underline"
                    href={`/admin/recommended-lenses/${c.brand}/${c.slug}`}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
