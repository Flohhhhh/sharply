"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
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
        "border-border/80 relative flex aspect-square h-full w-full items-center justify-center overflow-visible rounded border p-3 text-center leading-tight",
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
          <div className="space-y-2">
            <p className="text-muted-foreground break-all">
              {tile.submission.discordMessageUrl}
            </p>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-[11px]"
            >
              <a
                href={tile.submission.discordMessageUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                View message
              </a>
            </Button>
            <div className="flex items-center gap-2 pt-1">
              <Avatar className="size-6">
                <AvatarImage
                  src={tile.completedBy?.image ?? undefined}
                  alt={tile.completedBy?.name ?? "Community member"}
                />
                <AvatarFallback>
                  {(tile.completedBy?.name ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium">
                {tile.completedBy?.name ?? "Community member"}
              </p>
            </div>
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
