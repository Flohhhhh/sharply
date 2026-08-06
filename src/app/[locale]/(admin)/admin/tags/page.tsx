import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { fetchAdminTags, fetchTagsForEditor } from "~/server/tags/service";
import { TagsManager } from "./tags-manager";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !requireRole(session.user, ["EDITOR"]))
    redirect("/admin");
  const canManage = requireRole(session.user, ["ADMIN"]);
  const tags = canManage ? await fetchAdminTags() : await fetchTagsForEditor();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Tags</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Create editorial tags and manage the gear assigned to them.
        </p>
      </div>
      <TagsManager initialTags={tags} canManage={canManage} />
    </div>
  );
}
