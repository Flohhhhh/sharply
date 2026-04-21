import { describe,expect,it } from "vitest";
import { createBoardCreatedPayload } from "~/server/bingo/events";

describe("bingo board_created payloads", () => {
  it("includes ranked top 3 podium rows for completion", () => {
    const payload = createBoardCreatedPayload({
      source: "completion",
      previousBoardId: "board-old",
      leaderboardRows: [
        { userId: "u1", name: "A", image: null, points: 10 },
        { userId: "u2", name: "B", image: null, points: 9 },
        { userId: "u3", name: "C", image: null, points: 8 },
        { userId: "u4", name: "D", image: null, points: 7 },
      ],
    });

    expect(payload.source).toBe("completion");
    expect(payload.previousBoardId).toBe("board-old");
    if (payload.source !== "completion") {
      throw new Error("Expected completion payload");
    }
    expect(payload.previousLeaderboardTop3).toEqual([
      { userId: "u1", name: "A", image: null, points: 10, rank: 1 },
      { userId: "u2", name: "B", image: null, points: 9, rank: 2 },
      { userId: "u3", name: "C", image: null, points: 8, rank: 3 },
    ]);
  });

  it("omits podium rows for initial and inactivity sources", () => {
    const initialPayload = createBoardCreatedPayload({ source: "initial" });
    expect(initialPayload.source).toBe("initial");
    expect("previousLeaderboardTop3" in initialPayload).toBe(false);

    const inactivityPayload = createBoardCreatedPayload({
      source: "inactivity",
      previousBoardId: "board-old",
    });
    expect(inactivityPayload.source).toBe("inactivity");
    expect("previousLeaderboardTop3" in inactivityPayload).toBe(false);
  });
});
