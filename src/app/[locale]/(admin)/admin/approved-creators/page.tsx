import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { fetchApprovedCreatorsAdmin } from "~/server/admin/approved-creators/service";
import { ApprovedCreatorsManager } from "./approved-creators-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApprovedCreatorsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin/approved-creators");
  }

  if (!requireRole(session.user, ["ADMIN"])) {
    redirect("/admin");
  }

  const creators = await fetchApprovedCreatorsAdmin();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Approved Creators</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Maintain the allowlist of creator sources that editors can attach to
          gear pages. This list is editorially controlled and YouTube-first in
          phase 1.
        </p>
      </div>

      <ApprovedCreatorsManager initialCreators={creators} />
    </div>
  );
}
