"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { BingoBoardView } from "~/types/bingo";

export default function ClaimTileDialog(props: {
  board: BingoBoardView | undefined;
  selectedTileId: string | null;
  discordMessageUrl: string;
  isSubmitting: boolean;
  onClose: () => void;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const tile =
    props.selectedTileId && props.board
      ? props.board.tiles.find((item) => item.id === props.selectedTileId) ?? null
      : null;

  return (
    <Dialog
      open={Boolean(tile)}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Tile</DialogTitle>
          <DialogDescription>
            Paste a Discord message link that proves this tile happened.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm font-semibold">{tile?.label}</p>
          <Input
            value={props.discordMessageUrl}
            onChange={(event) => props.onUrlChange(event.target.value)}
            placeholder="https://discord.com/channels/<guild>/<channel>/<message>"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            onClick={props.onSubmit}
            disabled={props.isSubmitting || !props.discordMessageUrl.trim()}
          >
            {props.isSubmitting ? "Submitting..." : "Claim tile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
