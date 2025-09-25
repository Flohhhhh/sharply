import { findInviteById } from "~/server/invites/data";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default async function InvitePage({
  params,
}: {
  params: { id: string };
}) {
  console.info("[invites] landing:hit", { inviteId: params.id });
  const invite = await findInviteById(params.id);
  if (!invite) {
    console.info("[invites] landing:not_found", { inviteId: params.id });
    return <div className="py-16">Invite not found.</div>;
  }

  if (invite.isUsed) {
    console.info("[invites] landing:already_used", { inviteId: params.id });
    return <div className="py-16">This invite has already been used.</div>;
  }

  // Prefer an accept route that sets a cookie server-side before OAuth redirect
  const acceptHref = `/invite/${invite.id}/accept`;
  console.info("[invites] landing:using_accept_route", { inviteId: invite.id });

  return (
    <div className="mx-auto max-w-xl py-16">
      <h1 className="text-3xl font-bold">Welcome, {invite.inviteeName}</h1>
      <p className="text-muted-foreground mt-2">
        You've been invited to join Sharply as a {invite.role}.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href={acceptHref}>Sign in to continue</Link>
        </Button>
      </div>
    </div>
  );
}
