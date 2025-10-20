import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Link from "next/link";
import NewChartContent from "./_components/NewChartContent";

export default async function Page() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (!role || !["ADMIN", "EDITOR"].includes(role)) {
    redirect("/");
  }
  return <NewChartContent />;
}
