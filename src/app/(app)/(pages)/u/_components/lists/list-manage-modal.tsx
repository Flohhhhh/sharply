"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  DoorOpen,
  EyeOff,
  Link2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  actionPublishUserList,
  actionRemoveUserListItem,
  actionReorderUserListItems,
  actionRenameUserList,
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
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isPublishNameOpen, setIsPublishNameOpen] = useState(false);
  const [publishName, setPublishName] = useState("");
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const sortableItems = useMemo<SortableUserListItem[]>(
    () => list?.items ?? [],
    [list],
  );
  const isBusy = isSavingOrder || isPublishing || !!removingItemId || isRenaming;
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

  const openPublishNameDialog = () => {
    if (!list || isBusy) return;
    if (!canPublish) {
      toast.error("Add at least one item before publishing");
      return;
    }
    setPublishName(list.name);
    setIsPublishNameOpen(true);
  };

  const closePublishNameDialog = () => {
    if (isPublishing) return;
    setIsPublishNameOpen(false);
    setPublishName("");
  };

  const handlePublishWithName = async () => {
    if (!list || isBusy) return;
    const nextName = publishName.trim();
    if (!nextName) {
      toast.error("List name is required");
      return;
    }

    setIsPublishing(true);
    try {
      if (list.name !== nextName) {
        const renamed = await actionRenameUserList(list.id, nextName);
        onListsUpdated(renamed.lists);
      }
      const result = await actionPublishUserList(list.id);
      onListsUpdated(result.lists);
      setIsPublishNameOpen(false);
      setPublishName("");
      toast.success("List published");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update publish state";
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!list || isBusy) return;
    if (!list.shared?.isPublished) {
      openPublishNameDialog();
      return;
    }

    setIsPublishing(true);
    try {
      const result = await actionUnpublishUserList(list.id);
      onListsUpdated(result.lists);
      toast.success("List unpublished");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update publish state";
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
        typeof window === "undefined"
          ? path
          : `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success("Share link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const openRename = () => {
    if (!list || isBusy || list.isDefault) return;
    setRenameName(list.name);
    setIsRenameOpen(true);
  };

  const closeRenameDialog = () => {
    if (isRenaming) return;
    setIsRenameOpen(false);
    setRenameName("");
  };

  const handleRename = async () => {
    if (!list || !renameName.trim() || isBusy) return;
    setIsRenaming(true);
    try {
      const result = await actionRenameUserList(list.id, renameName);
      onListsUpdated(result.lists);
      closeRenameDialog();
      toast.success("List renamed");
    } catch {
      toast.error("Failed to rename list");
    } finally {
      setIsRenaming(false);
    }
  };

  useEffect(() => {
    const currentListId = list?.id ?? null;
    const listChanged = activeListId !== currentListId;

    if (!open || listChanged) {
      setIsRenameOpen(false);
      setRenameName("");
      setIsPublishNameOpen(false);
      setPublishName("");
    }

    if (listChanged) {
      setActiveListId(currentListId);
    }
  }, [activeListId, list?.id, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <span className="truncate">{list?.name ?? "Manage list"}</span>
            {list?.shared?.isPublished ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <BookOpenCheck
                      className="text-muted-foreground size-4 shrink-0"
                      aria-label="Published"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Published</TooltipContent>
              </Tooltip>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Reorder items, remove items, and manage sharing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {!list?.isDefault ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={<Pencil className="size-4" />}
              disabled={isBusy}
              onClick={openRename}
            >
              Rename
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            icon={
              list?.shared?.isPublished ? (
                <EyeOff className="size-4" />
              ) : (
                <DoorOpen className="size-4" />
              )
            }
            variant={list?.shared?.isPublished ? "outline" : "default"}
            loading={isPublishing}
            disabled={(!canPublish && !list?.shared?.isPublished) || isBusy}
            onClick={() => void handlePublishToggle()}
          >
            {list?.shared?.isPublished ? "Unpublish" : "Publish"}
          </Button>
          {list?.shared?.isPublished ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={<Link2 className="size-4" />}
              onClick={() => void handleCopyLink()}
            >
              Copy share link
            </Button>
          ) : null}
          {list?.shared?.path ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              icon={<DoorOpen className="size-4" />}
            >
              <Link href={list.shared.path}>View list</Link>
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

      <AlertDialog
        open={isRenameOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeRenameDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename list</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="modal-rename-list-name">List name</Label>
            <Input
              id="modal-rename-list-name"
              value={renameName}
              onChange={(event) => setRenameName(event.target.value)}
              placeholder="New list name"
              disabled={isRenaming}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isRenaming}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button onClick={() => void handleRename()} loading={isRenaming}>
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isPublishNameOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closePublishNameDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choose a public list name</AlertDialogTitle>
            <AlertDialogDescription>
              This name is shown on the shared page and can be changed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="modal-publish-list-name">Public name</Label>
            <Input
              id="modal-publish-list-name"
              value={publishName}
              onChange={(event) => setPublishName(event.target.value)}
              placeholder="My travel kit"
              disabled={isPublishing}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isPublishing}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button onClick={() => void handlePublishWithName()} loading={isPublishing}>
              Publish list
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
