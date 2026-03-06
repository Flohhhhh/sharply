"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { BingoTileView } from "~/types/bingo";

export default function BingoTile(props: {
  tile: BingoTileView;
  optimistic: boolean;
  highlighted: boolean;
  disabled?: boolean;
  onSelect: (tileId: string) => void;
}) {
  const { tile, optimistic, highlighted, disabled = false, onSelect } = props;
  const completed = Boolean(tile.completedAt) || optimistic;
  const isDisabled = disabled || completed || tile.isFreeTile;
  const button = (
    <button
      data-bingo-tile-id={tile.id}
      type="button"
      onClick={() => {
        if (isDisabled) return;
        onSelect(tile.id);
      }}
      disabled={isDisabled}
      className={[
        "border-border/80 relative flex aspect-square h-full w-full items-center justify-center overflow-visible rounded border p-4 text-center text-lg leading-tight",
        completed
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted/30 cursor-pointer bg-transparent",
        tile.isFreeTile
          ? "bg-primary/80 text-primary-foreground cursor-default"
          : "",
        disabled ? "cursor-default" : "",
        highlighted ? "ring-primary/50 ring-2" : "",
      ].join(" ")}
    >
      <span>{tile.label}</span>
    </button>
  );

  if (!completed) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[300px] text-xs">
        {tile.submission ? (
          <div className="space-y-1">
            <p className="font-semibold">Claimed with proof</p>
            <p className="line-clamp-1">{tile.submission.discordMessageUrl}</p>
            {tile.completedBy?.name ? (
              <p>By {tile.completedBy.name}</p>
            ) : (
              <p>By community member</p>
            )}
          </div>
        ) : tile.isFreeTile ? (
          <p>Free center tile</p>
        ) : (
          <p>Unclaimed tile</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
