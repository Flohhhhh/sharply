import {
  BINGO_FREE_TILE_INDEX,
  BINGO_TILE_COUNT,
} from "~/server/bingo/constants";
import type {
  BingoBoardCreatedPayload,
  BingoBoardCreatedSource,
  BingoCompletionPodiumEntry,
  BingoLeaderboardRow,
} from "~/types/bingo";

function toTop3PodiumRows(
  rows: readonly Pick<BingoLeaderboardRow, "userId" | "name" | "image" | "points">[],
): BingoCompletionPodiumEntry[] {
  return rows.slice(0, 3).map((row, index) => ({
    userId: row.userId,
    name: row.name,
    image: row.image,
    points: row.points,
    rank: (index + 1) as BingoCompletionPodiumEntry["rank"],
  }));
}

export function createBoardCreatedPayload(params: {
  source: BingoBoardCreatedSource;
  previousBoardId?: string;
  leaderboardRows?: readonly Pick<
    BingoLeaderboardRow,
    "userId" | "name" | "image" | "points"
  >[];
}): BingoBoardCreatedPayload {
  const basePayload = {
    tileCount: BINGO_TILE_COUNT,
    freeTileIndex: BINGO_FREE_TILE_INDEX,
    source: params.source,
  } as const;

  if (params.source === "completion") {
    if (!params.previousBoardId) {
      throw new Error(
        "previousBoardId is required when source is completion",
      );
    }
    return {
      ...basePayload,
      source: "completion",
      previousBoardId: params.previousBoardId,
      previousLeaderboardTop3: toTop3PodiumRows(params.leaderboardRows ?? []),
    };
  }

  return {
    ...basePayload,
    source: params.source,
    ...(params.previousBoardId ? { previousBoardId: params.previousBoardId } : {}),
  };
}
