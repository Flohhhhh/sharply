import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "~/auth";
import { env } from "~/env";
import { requireRole } from "~/lib/auth/auth-helpers";
import DiscordBanner from "~/components/discord-banner";
import DiscordBingoClient from "./_components/discord-bingo-client";

export const metadata: Metadata = {
  title: "Photography Lounge Bingo",
  description:
    "A collaborative Photography Lounge bingo board. Work together with the community to claim tiles and earn points for every tile you mark off.",
  openGraph: {
    title: "Photography Lounge Bingo",
    description:
      "A collaborative Photography Lounge bingo board. Work together with the community to claim tiles and earn points for every tile you mark off.",
  },
};

export default async function DiscordBingoPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAuthenticated = Boolean(session?.user);
  const canSkipCard = Boolean(requireRole(session?.user, ["ADMIN"]));
  const canCompleteCard = env.NODE_ENV === "development";

  return (
    <div className="mx-auto mt-24 w-full max-w-[1200px] px-4 pt-4 pb-4 sm:px-6 lg:px-8">
      <div className="hidden grid-rows-[auto_1fr] gap-4 overflow-hidden lg:grid">
        <header className="space-y-2">
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-4xl leading-none font-extrabold tracking-tight">
              Photography Lounge Bingo
            </h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">
            Click a card to complete it. Submit Discord message links as proof
            to claim tiles.
          </p>
        </header>
        <DiscordBingoClient
          isAuthenticated={isAuthenticated}
          canSkipCard={canSkipCard}
          canCompleteCard={canCompleteCard}
        />
        <DiscordBanner label="Join The Photography Lounge" />
      </div>

      <div className="grid h-[calc(100vh-9rem)] place-items-center lg:hidden">
        <p className="text-center text-2xl font-extrabold tracking-tight uppercase">
          Bingo is only available on desktop
        </p>
      </div>
    </div>
  );
}
