import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { auth } from "~/auth";
import { Badge } from "~/components/ui/badge";
import { LinkButton } from "~/components/ui/link-button";
import { requireRole } from "~/lib/auth/auth-helpers";
import { fetchForumAdminOverview } from "~/server/forum/service";
import { ForumCategoryManager } from "./forum-category-manager";

export const dynamic = "force-dynamic";

export default async function AdminForumsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !requireRole(session.user, ["ADMIN"])) {
    redirect("/admin");
  }

  const { categories, reports } = await fetchForumAdminOverview();
  const canManageCategories = requireRole(session.user, ["ADMIN"]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-muted-foreground size-5" />
            <h1 className="text-2xl font-semibold">Forums</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Manage forum categories and keep an eye on community reports.
          </p>
        </div>
        <LinkButton href="/forum" variant="outline" icon={<MessageSquare />}>
          View forum
        </LinkButton>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-muted-foreground text-sm">Categories</p>
          <p className="mt-2 text-3xl font-semibold">{categories.length}</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-muted-foreground text-sm">Open reports</p>
          <p className="mt-2 text-3xl font-semibold">{reports.length}</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-muted-foreground text-sm">Forum moderation</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <ShieldCheck className="text-primary size-4" />
            Administrator access enabled
          </div>
        </div>
      </div>

      <ForumCategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
        }))}
        canManageCategories={canManageCategories}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Open reports</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Report review actions will land here as the moderation workflow
              grows.
            </p>
          </div>
          <Badge variant={reports.length ? "destructive" : "secondary"}>
            {reports.length ? `${reports.length} open` : "Clear"}
          </Badge>
        </div>
        <div className="rounded-xl border border-dashed p-6">
          <p className="text-muted-foreground text-sm">
            {reports.length
              ? "Reports are ready for moderation review."
              : "No open reports right now."}
          </p>
        </div>
      </section>
    </div>
  );
}
