import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function ProfileRedirectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  redirect(`/u/${session.user.id}`);
}
