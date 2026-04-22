"use client";

import {
  BookOpenCheck,
  DoorOpen,
  EyeOff,
  Link2,
  Pencil,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  actionPublishUserList,
  actionRemoveUserListItem,
  actionRenameUserList,
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
  const t = useTranslations("userProfile");
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
      toast.error(t("listsOrderUpdateError"));
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
      toast.success(t("listsItemRemovedSuccess"));
    } catch {
      toast.error(t("listsItemRemoveError"));
    } finally {
      setRemovingItemId(null);
    }
  };

  const openPublishNameDialog = () => {
    if (!list || isBusy) return;
    if (!canPublish) {
      toast.error(t("listsPublishNeedsItem"));
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
      toast.error(t("listsNameRequired"));
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
      toast.success(t("listsPublishSuccess"));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("listsPublishStateError");
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
      toast.success(t("listsUnpublishSuccess"));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("listsPublishStateError");
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
      toast.success(t("listsShareLinkCopied"));
    } catch {
      toast.error(t("listsShareLinkCopyError"));
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
      toast.success(t("listsRenameSuccess"));
    } catch {
      toast.error(t("listsRenameError"));
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
            <span className="truncate">{list?.name ?? t("listsManageTitle")}</span>
            {list?.shared?.isPublished ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <BookOpenCheck
                      className="text-muted-foreground size-4 shrink-0"
                      aria-label={t("listsPublished")}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>
                  {t("listsPublished")}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {t("listsManageDescription")}
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
              {t("listsRename")}
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
            {list?.shared?.isPublished
              ? t("listsUnpublish")
              : t("listsPublish")}
          </Button>
          {list?.shared?.isPublished ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={<Link2 className="size-4" />}
              onClick={() => void handleCopyLink()}
            >
              {t("listsCopyShareLink")}
            </Button>
          ) : null}
          {list?.shared?.isPublished && list?.shared?.path ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              icon={<DoorOpen className="size-4" />}
            >
              <Link href={list.shared.path}>{t("listsViewList")}</Link>
            </Button>
          ) : null}
          {!canPublish && !list?.shared?.isPublished ? (
            <p className="text-muted-foreground text-xs">
              {t("listsPublishHint")}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">{t("listsItemsTitle")}</p>
          {sortableItems.length ? (
            <ListSortableItems
              items={sortableItems}
              onReorder={handleReorder}
              onRemove={handleRemove}
              disabled={isBusy}
            />
          ) : (
            <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              {t("listsManageEmpty")}
            </div>
          )}
          {isSavingOrder ? (
            <p className="text-muted-foreground text-xs">
              {t("listsSavingOrder")}
            </p>
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
            <AlertDialogTitle>{t("listsRenameDialogTitle")}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="modal-rename-list-name">{t("listsNameLabel")}</Label>
            <Input
              id="modal-rename-list-name"
              value={renameName}
              onChange={(event) => setRenameName(event.target.value)}
              placeholder={t("listsRenamePlaceholder")}
              disabled={isRenaming}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isRenaming}>
                {t("close")}
              </Button>
            </AlertDialogCancel>
            <Button onClick={() => void handleRename()} loading={isRenaming}>
              {t("listsSave")}
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
            <AlertDialogTitle>{t("listsPublicNameTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("listsPublicNameDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="modal-publish-list-name">{t("listsPublicNameLabel")}</Label>
            <Input
              id="modal-publish-list-name"
              value={publishName}
              onChange={(event) => setPublishName(event.target.value)}
              placeholder={t("listsCreatePlaceholder")}
              disabled={isPublishing}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isPublishing}>
                {t("close")}
              </Button>
            </AlertDialogCancel>
            <Button onClick={() => void handlePublishWithName()} loading={isPublishing}>
              {t("listsPublishButton")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
