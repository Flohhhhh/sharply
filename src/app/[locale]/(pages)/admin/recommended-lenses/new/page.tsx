import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import NewChartContent from "./_components/NewChartContent";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  if (!session || !requireRole(user, ["EDITOR"])) {
    redirect("/auth/signin?callbackUrl=/admin/recommended-lenses/new");
  }
  return <NewChartContent />;
}
