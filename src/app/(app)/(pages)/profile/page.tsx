import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { headers } from "next/headers";

export default async function ProfileRedirectPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  const user = session?.user;

  if (!user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  redirect(`/u/${user.id}`);
}
