"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  actionPublishUserList,
  actionRemoveUserListItem,
  actionReorderUserListItems,
  actionUnpublishUserList,
} from "~/server/user-lists/actions";
import {
  ListSortableItems,
  type SortableUserListItem,
} from "./list-sortable-items";
import type { ProfileUserListState } from "./types";

type ListManageModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: ProfileUserListState | null;
  onListsUpdated: (lists: ProfileUserListState[]) => void;
};

export function ListManageModal({
  open,
  onOpenChange,
  list,
  onListsUpdated,
}: ListManageModalProps) {
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const sortableItems = useMemo<SortableUserListItem[]>(
    () => list?.items ?? [],
    [list],
  );
  const isBusy = isSavingOrder || isPublishing || !!removingItemId;
  const canPublish = Boolean(list && list.itemCount > 0);

  const handleReorder = async (orderedItemIds: string[]) => {
    if (!list || isBusy) return;
    setIsSavingOrder(true);

    try {
      const result = await actionReorderUserListItems({
        listId: list.id,
        orderedItemIds,
      });
      onListsUpdated(result.lists);
    } catch {
      toast.error("Failed to update order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!list || isBusy) return;
    setRemovingItemId(itemId);

    try {
      const result = await actionRemoveUserListItem(itemId);
      onListsUpdated(result.lists);
      toast.success("Item removed from list");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setRemovingItemId(null);
    }
  };

  const handlePublishToggle = async () => {
    if (!list || isBusy) return;
    setIsPublishing(true);
    try {
      if (list.shared?.isPublished) {
        const result = await actionUnpublishUserList(list.id);
        onListsUpdated(result.lists);
        toast.success("List unpublished");
      } else {
        if (!canPublish) {
          toast.error("Add at least one item before publishing");
          return;
        }
        const result = await actionPublishUserList(list.id);
        onListsUpdated(result.lists);
        toast.success("List published");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update publish state";
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = async () => {
    const path = list?.shared?.path;
    if (!path) return;
    try {
      const absoluteUrl =
        typeof window === "undefined" ? path : `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success("Share link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{list?.name ?? "Manage list"}</DialogTitle>
          <DialogDescription>
            Reorder items, remove items, and manage sharing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={list?.shared?.isPublished ? "outline" : "default"}
            loading={isPublishing}
            disabled={(!canPublish && !list?.shared?.isPublished) || isBusy}
            onClick={() => void handlePublishToggle()}
          >
            {list?.shared?.isPublished ? "Unpublish" : "Publish"}
          </Button>
          {list?.shared?.isPublished ? (
            <Button type="button" variant="outline" onClick={() => void handleCopyLink()}>
              Copy share link
            </Button>
          ) : null}
          {!canPublish && !list?.shared?.isPublished ? (
            <p className="text-muted-foreground text-xs">
              Add at least one item from a gear page before publishing.
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Items</p>
          {sortableItems.length ? (
            <ListSortableItems
              items={sortableItems}
              onReorder={handleReorder}
              onRemove={handleRemove}
              disabled={isBusy}
            />
          ) : (
            <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              This list is empty. Add items from gear pages using the Save Item
              button.
            </div>
          )}
          {isSavingOrder ? (
            <p className="text-muted-foreground text-xs">Saving order...</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
