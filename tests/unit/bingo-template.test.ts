import { describe, expect, it } from "vitest";
import { isBoardTileShapeValid, selectBoardLabels } from "~/server/bingo/template";

describe("bingo template selection", () => {
  it("selects exactly tileCount labels with free tile at the target index", () => {
    const labels = selectBoardLabels({
      templateLabels: Array.from({ length: 60 }, (_, i) => `Label ${i + 1}`),
      tileCount: 25,
      freeTileIndex: 12,
      freeTileLabel: "Free Tile",
      random: () => 0.42,
    });

    expect(labels).toHaveLength(25);
    expect(labels[12]).toBe("Free Tile");
  });

  it("uses 24 unique random labels around the free tile", () => {
    const labels = selectBoardLabels({
      templateLabels: Array.from({ length: 30 }, (_, i) => `L${i + 1}`),
      tileCount: 25,
      freeTileIndex: 12,
      freeTileLabel: "Free Tile",
      random: () => 0.13,
    });

    const nonFree = labels.filter((label) => label !== "Free Tile");
    expect(nonFree).toHaveLength(24);
    expect(new Set(nonFree).size).toBe(24);
  });

  it("throws when the template pool cannot fill the board", () => {
    expect(() =>
      selectBoardLabels({
        templateLabels: Array.from({ length: 8 }, (_, i) => `L${i + 1}`),
        tileCount: 25,
        freeTileIndex: 12,
        freeTileLabel: "Free Tile",
      }),
    ).toThrow("Not enough template labels");
  });

  it("validates board shape for 25 tiles with one center free tile", () => {
    const validTiles = Array.from({ length: 25 }, (_, i) => ({
      position: i,
      isFreeTile: i === 12,
    }));
    expect(
      isBoardTileShapeValid({
        tileCount: 25,
        freeTileIndex: 12,
        tiles: validTiles,
      }),
    ).toBe(true);

    expect(
      isBoardTileShapeValid({
        tileCount: 25,
        freeTileIndex: 12,
        tiles: validTiles.filter((tile) => tile.position !== 24),
      }),
    ).toBe(false);

    expect(
      isBoardTileShapeValid({
        tileCount: 25,
        freeTileIndex: 12,
        tiles: validTiles.map((tile) =>
          tile.position === 12 ? { ...tile, isFreeTile: false } : tile,
        ),
      }),
    ).toBe(false);
  });
});
