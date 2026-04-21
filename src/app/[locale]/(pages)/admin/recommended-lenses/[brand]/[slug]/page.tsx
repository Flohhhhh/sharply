import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import {
  serviceGetChart,
  serviceGetChartAdminRaw,
} from "~/server/recommendations/service";
import {
  actionUpdateChartMeta,
  actionUpsertItem,
} from "~/server/recommendations/actions";
import Link from "next/link";
import EditChartContent from "./_components/EditChartContent";
import { headers } from "next/headers";

export const revalidate = 0;

export default async function Page(props: {
  params: Promise<{ brand: string; slug: string }>;
}) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  if (!session || !user || !requireRole(user, ["EDITOR"])) {
    redirect("/auth/signin?callbackUrl=/admin/recommended-lenses");
  }

  const chart = await serviceGetChart(params.brand, params.slug);
  const raw = await serviceGetChartAdminRaw(params.brand, params.slug);

  async function updateMeta(formData: FormData): Promise<void> {
    "use server";
    await actionUpdateChartMeta(formData);
  }

  async function upsertItem(formData: FormData): Promise<void> {
    "use server";
    await actionUpsertItem(formData);
  }

  return (
    <div className="mx-auto mt-24 max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Edit: {params.brand}/{params.slug}
          </h1>
          <p className="text-muted-foreground text-sm">
            Live preview below. Full editor coming soon.
          </p>
        </div>
        <Link
          href="/admin/recommended-lenses"
          className="text-primary hover:underline"
        >
          Back to list
        </Link>
      </div>

      <EditChartContent
        brand={params.brand}
        slug={params.slug}
        title={chart?.title ?? ""}
        items={(raw?.items ?? []).map((i: any) => ({
          id: i.id,
          gearId: i.gearId,
          gearName: i.gearName,
          rating: i.rating,
          note: i.note,
        }))}
      />
    </div>
  );
}
