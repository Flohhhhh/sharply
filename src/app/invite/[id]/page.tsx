import { fetchInviteById } from "~/server/invites/service";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { SpinningText } from "~/components/ui/spinning-text";
import { TicketCheck } from "lucide-react";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.info("[invites] landing:hit", { inviteId: id });
  const invite = await fetchInviteById(id);
  if (!invite) {
    console.info("[invites] landing:not_found", { inviteId: id });
    return <div className="py-16">Invite not found.</div>;
  }

  if (invite.isUsed) {
    console.info("[invites] landing:already_used", { inviteId: id });
    return <div className="py-16">This invite has already been used.</div>;
  }

  // Prefer an accept route that sets a cookie server-side before OAuth redirect
  const acceptHref = `/invite/${invite.id}/accept`;
  console.info("[invites] landing:using_accept_route", { inviteId: invite.id });

  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-between overflow-hidden py-12">
      {/* Soft colorful glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div className="size-[30rem] rounded-full bg-gradient-to-tr from-fuchsia-400/20 via-sky-400/20 to-amber-300/20 blur-3xl sm:size-[48rem]" />
      </div>

      {/* Top centered wordmark */}
      <div className="font-bold">Sharply</div>

      {/* Middle content */}
      <div className="flex flex-col items-center px-4 text-center sm:px-8">
        <div className="relative mb-24">
          <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            VIP
          </span>
          <SpinningText
            className="absolute top-3/7 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-400"
            radius={8}
            reverse
          >
            {"sharply • exclusive access • invitation only • "}
          </SpinningText>
        </div>
        <h1 className="text-4xl font-bold text-balance sm:text-5xl">
          Welcome, {invite.inviteeName}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-prose text-base sm:text-lg">
          You’ve been invited to join Sharply as a {invite.role}. Enjoy early
          access and all‑access privileges.
        </p>

        <div className="mt-10 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="w-full rounded-lg sm:w-auto"
            icon={<TicketCheck />}
            iconPosition="right"
          >
            <Link href={acceptHref}>Accept Invite & Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Bottom-centered external link */}

      <Button asChild variant="outline">
        <Link
          href="https://western-butternut-9ba.notion.site/Sharply-Launch-Intro-Doc-2783c00bcee28087b889f64dcdb941ae?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read About the Project
        </Link>
      </Button>
    </div>
  );
}
