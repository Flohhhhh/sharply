"use client";

import type { BingoBoardView } from "~/types/bingo";
import BingoTile from "./bingo-tile";

export default function BingoBoardGrid(props: {
  board: BingoBoardView | undefined;
  optimisticTiles: Set<string>;
  highlightTileIds: Set<string>;
  interactionLocked?: boolean;
  onSelectTile: (tileId: string) => void;
}) {
  const {
    board,
    optimisticTiles,
    highlightTileIds,
    interactionLocked = false,
    onSelectTile,
  } = props;

  return (
    <div className="grid h-full min-h-0 grid-cols-5 gap-2">
      {board?.tiles.map((tile) => {
        return (
          <BingoTile
            key={tile.id}
            tile={tile}
            optimistic={optimisticTiles.has(tile.id)}
            highlighted={highlightTileIds.has(tile.id)}
            disabled={interactionLocked}
            onSelect={onSelectTile}
          />
        );
      })}
    </div>
  );
}
