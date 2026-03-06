export type BingoBoardStatus = "ACTIVE" | "COMPLETED" | "EXPIRED" | "ARCHIVED";
export type BingoBoardCreatedSource = "initial" | "completion" | "inactivity";

export type BingoEventType =
  | "tile_completed"
  | "submission_created"
  | "score_updated"
  | "board_completed"
  | "board_expired"
  | "board_created"
  | "inactivity_timer_started"
  | "inactivity_timer_extended";

export interface BingoTileView {
  id: string;
  position: number;
  label: string;
  isFreeTile: boolean;
  completedAt: string | null;
  completedBy: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  submission: {
    id: string;
    discordMessageUrl: string;
    discordGuildId: string | null;
    discordChannelId: string | null;
    discordMessageId: string | null;
    createdAt: string;
  } | null;
}

export interface BingoBoardView {
  id: string;
  status: BingoBoardStatus;
  inactivityDurationSeconds: number;
  expiresAt: string | null;
  firstCompletedAt: string | null;
  completedAt: string | null;
  expiredAt: string | null;
  endReason: string | null;
  createdAt: string;
  updatedAt: string;
  completedCount: number;
  totalTiles: number;
  lastEventCursor: number;
  tiles: BingoTileView[];
}

export interface BingoLeaderboardRow {
  userId: string;
  name: string | null;
  image: string | null;
  points: number;
}

export type BingoCompletionPodiumRank = 1 | 2 | 3;

export interface BingoCompletionPodiumEntry {
  userId: string;
  name: string | null;
  image: string | null;
  points: number;
  rank: BingoCompletionPodiumRank;
}

type BingoBoardCreatedPayloadBase = {
  tileCount: number;
  freeTileIndex: number;
  source: BingoBoardCreatedSource;
  previousBoardId?: string;
};

export type BingoBoardCreatedPayload =
  | (BingoBoardCreatedPayloadBase & {
      source: "completion";
      previousBoardId: string;
      previousLeaderboardTop3: BingoCompletionPodiumEntry[];
    })
  | (BingoBoardCreatedPayloadBase & {
      source: "initial" | "inactivity";
      previousLeaderboardTop3?: never;
    });

interface BingoEventViewBase {
  id: number;
  boardId: string;
  boardTileId: string | null;
  submissionId: string | null;
  userId: string | null;
  createdAt: string;
}

export type BingoEventView =
  | (BingoEventViewBase & {
      type: "board_created";
      payload: BingoBoardCreatedPayload | null;
    })
  | (BingoEventViewBase & {
      type: Exclude<BingoEventType, "board_created">;
      payload: Record<string, unknown> | null;
    });

export interface BingoEventsResponse {
  boardId: string;
  events: BingoEventView[];
  nextCursor: number;
}

export interface BingoClaimInput {
  boardTileId: string;
  discordMessageUrl: string;
}
