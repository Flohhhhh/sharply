import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "~/auth";
import { fetchFullUserById } from "~/server/users/service";
import UserCard from "./user-card";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";
import { claimInvite } from "~/server/invites/service";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Welcome!",
  openGraph: {
    title: "Welcome!",
  },
};

type WelcomeSearchParams = {
  callbackUrl?: string;
  inviteId?: string;
  next?: string;
};

export default async function WelcomePage(props: {
  searchParams: Promise<WelcomeSearchParams>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;
  const {
    callbackUrl,
    inviteId: inviteIdFromQuery,
    next,
  } = await props.searchParams;
  // Prefer explicit next (from accept route), else safe callbackUrl, else home
  const redirectUrl =
    typeof next === "string"
      ? next
      : callbackUrl && !callbackUrl.includes("/auth/welcome")
        ? callbackUrl
        : "/";

  if (!session) {
    return (
      <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center">
        <p>Please sign in to continue.</p>
      </div>
    );
  }

  // Fetch the full user data from the database
  const cookieStore = await cookies();
  const inviteId = inviteIdFromQuery ?? cookieStore.get("invite_id")?.value;
  if (inviteId) {
    console.info("[invites] welcome:claim_attempt", { inviteId });
    const res = await claimInvite(inviteId).catch((err) => {
      console.error("[invites] welcome:claim_error", { inviteId, err });
      return null;
    });
    if (res?.ok) {
      console.info("[invites] welcome:claim_success", { inviteId });
    } else if (res && !res.ok) {
      console.info("[invites] welcome:claim_failure", {
        inviteId,
        reason: res.reason,
      });
    }
    // Note: cannot modify cookies in a server component; leave cleanup to accept route expiry
  }

  if (!user) {
    return (
      <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center">
        <p>User not found.</p>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 sm:px-8">
      <div className="max-w-xl space-y-3 text-center">
        <h1 className="text-4xl font-bold">Welcome {firstName}!</h1>
        <p className="text-muted-foreground">
          You just joined the community leading photography data into the
          future.
        </p>
      </div>

      <UserCard user={user} />

      <Button
        asChild
        variant="ghost"
        icon={<ArrowRight />}
        iconPosition="right"
      >
        <Link href={redirectUrl}>Continue to Sharply</Link>
      </Button>
    </div>
  );
}
