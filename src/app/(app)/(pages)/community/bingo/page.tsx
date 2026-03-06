import { fetchCommunityBingoBoard } from "~/server/community-bingo/service";
import { CommunityBingoClient } from "./_components/community-bingo-client";

export default async function CommunityBingoPage() {
  const initial = await fetchCommunityBingoBoard();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Shared Community Bingo</h1>
        <p className="text-sm text-muted-foreground">
          Claim squares with a Discord message link, earn points, and help the whole
          community finish the board.
        </p>
      </div>
      <CommunityBingoClient initialData={initial} />
    </div>
  );
}
