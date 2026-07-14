import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getDeveloperAdminData } from "~/server/developer-api/service";
import { DeveloperApiAdminManager } from "./developer-api-admin-manager";

export const dynamic = "force-dynamic";

export default async function DeveloperApiAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/developer-api");
  if (!requireRole(session.user, ["ADMIN"])) redirect("/admin");

  return <DeveloperApiAdminManager data={await getDeveloperAdminData()} />;
}
