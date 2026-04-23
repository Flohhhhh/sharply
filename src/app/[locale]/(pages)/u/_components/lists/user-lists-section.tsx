"use client";

import {
  BookOpenCheck,
  DoorOpen,
  Link2,
  List,
  ListPlus,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname,useRouter,useSearchParams } from "next/navigation";
import { useCallback,useEffect,useState } from "react";
import { toast } from "sonner";
import { LocaleLink } from "~/components/locale-link";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Empty,EmptyDescription,EmptyTitle } from "~/components/ui/empty";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  actionCreateUserList,
  actionDeleteUserList,
  actionPublishUserList,
  actionRenameUserList,
  actionUnpublishUserList,
} from "~/server/user-lists/actions";
import { ListManageModal } from "./list-manage-modal";
import type { ProfileUserListState } from "./types";

type UserListsSectionProps = {
  initialLists: ProfileUserListState[];
  myProfile: boolean;
  profileName?: string | null;
  onListsChanged?: () => void;
};

export function UserListsSection({
  initialLists,
  myProfile,
  profileName,
  onListsChanged,
}: UserListsSectionProps) {
  const t = useTranslations("userProfile");
  const router = useRouter();
  const rawPathname = usePathname();
  const searchParams = useSearchParams();
  const [lists, setLists] = useState(initialLists);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [renameListId, setRenameListId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [manageListId, setManageListId] = useState<string | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [listActionId, setListActionId] = useState<string | null>(null);
  const [publishListId, setPublishListId] = useState<string | null>(null);
  const [publishName, setPublishName] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);

  const applyListsUpdate = (nextLists: ProfileUserListState[]) => {
    setLists(nextLists);
    onListsChanged?.();
  };

  const clearListQueryParam = useCallback(() => {
    const requestedListId = searchParams.get("list");
    if (!requestedListId) return;

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("list");

    const nextUrl = nextSearchParams.toString()
      ? `${rawPathname}?${nextSearchParams.toString()}`
      : rawPathname;
    router.replace(nextUrl, { scroll: false });
  }, [rawPathname, router, searchParams]);

  const manageList = lists.find((list) => list.id === manageListId) ?? null;

  const publishedCount = lists.filter(
    (list) => list.shared?.isPublished,
  ).length;

  const handleCreate = async () => {
    if (!createName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const result = await actionCreateUserList(createName);
      applyListsUpdate(result.lists);
      setCreateName("");
      setIsCreateOpen(false);
      toast.success(t("listsCreateSuccess"));
    } catch {
      toast.error(t("listsCreateError"));
    } finally {
      setIsCreating(false);
    }
  };

  const openRename = (list: ProfileUserListState) => {
    setRenameListId(list.id);
    setRenameName(list.name);
  };

  const handleRename = async () => {
    if (!renameListId || !renameName.trim() || isRenaming) return;
    setIsRenaming(true);
    try {
      const result = await actionRenameUserList(renameListId, renameName);
      applyListsUpdate(result.lists);
      setRenameListId(null);
      setRenameName("");
      toast.success(t("listsRenameSuccess"));
    } catch {
      toast.error(t("listsRenameError"));
    } finally {
      setIsRenaming(false);
    }
  };

  const openDeleteDialog = (list: ProfileUserListState) => {
    setDeleteListId(list.id);
  };

  const closeDeleteDialog = () => {
    if (deleteListId && listActionId === deleteListId) return;
    setDeleteListId(null);
  };

  const handleDelete = async (listId: string) => {
    if (listActionId) return;
    setListActionId(listId);
    try {
      const result = await actionDeleteUserList(listId);
      applyListsUpdate(result.lists);
      setDeleteListId(null);
      toast.success(t("listsDeleteSuccess"));
    } catch {
      toast.error(t("listsDeleteError"));
    } finally {
      setListActionId(null);
    }
  };

  const openPublishDialog = (list: ProfileUserListState) => {
    setPublishListId(list.id);
    setPublishName(list.name);
  };

  const closePublishDialog = () => {
    if (isPublishing) return;
    setPublishListId(null);
    setPublishName("");
  };

  const handlePublish = async () => {
    if (!publishListId || listActionId || isPublishing) return;
    const nextName = publishName.trim();
    if (!nextName) {
      toast.error(t("listsNameRequired"));
      return;
    }

    setIsPublishing(true);
    setListActionId(publishListId);
    try {
      const currentList = lists.find((list) => list.id === publishListId);
      if (!currentList) {
        throw new Error(t("listsNotFound"));
      }

      if (currentList.name !== nextName) {
        const renamed = await actionRenameUserList(publishListId, nextName);
        applyListsUpdate(renamed.lists);
      }

      const result = await actionPublishUserList(publishListId);
      applyListsUpdate(result.lists);
      setPublishListId(null);
      setPublishName("");
      toast.success(t("listsPublishSuccess"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("listsPublishError");
      toast.error(message);
    } finally {
      setIsPublishing(false);
      setListActionId(null);
    }
  };

  const handleUnpublish = async (list: ProfileUserListState) => {
    if (listActionId) return;
    setListActionId(list.id);

    try {
      const result = await actionUnpublishUserList(list.id);
      applyListsUpdate(result.lists);
      toast.success(t("listsUnpublishSuccess"));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("listsPublishStateError");
      toast.error(message);
    } finally {
      setListActionId(null);
    }
  };

  const copyShareLink = async (list: ProfileUserListState) => {
    const path = list.shared?.path;
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

  const openManage = (list: ProfileUserListState) => {
    setManageListId(list.id);
    setIsManageOpen(true);
  };

  const handleManageOpenChange = (open: boolean) => {
    setIsManageOpen(open);
    if (open) return;

    setManageListId(null);
    clearListQueryParam();
  };

  useEffect(() => {
    if (!isManageOpen || !manageListId) return;
    const stillExists = lists.some((list) => list.id === manageListId);
    if (!stillExists) {
      setIsManageOpen(false);
      setManageListId(null);
    }
  }, [isManageOpen, manageListId, lists]);

  useEffect(() => {
    if (!myProfile) return;

    const requestedListId = searchParams.get("list");
    if (!requestedListId) return;

    const requestedList = lists.find((list) => list.id === requestedListId);
    if (!requestedList) {
      clearListQueryParam();
      return;
    }

    if (isManageOpen && manageListId === requestedListId) return;

    setManageListId(requestedListId);
    setIsManageOpen(true);
  }, [
    clearListQueryParam,
    isManageOpen,
    lists,
    manageListId,
    myProfile,
    searchParams,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-1">
        <div>
          <h2 className="text-2xl font-semibold">{t("listsTitle")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("listsSummary", { total: lists.length, published: publishedCount })}
          </p>
        </div>
        {myProfile ? (
          <Button
            type="button"
            size="sm"
            icon={<ListPlus className="size-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            {t("listsCreateButton")}
          </Button>
        ) : null}
      </div>

      {lists.length ? (
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
          {lists.map((list) => (
            <div
              key={list.id}
              role={myProfile ? "button" : undefined}
              tabIndex={myProfile ? 0 : undefined}
              className={
                myProfile
                  ? "hover:border-foreground/30 cursor-pointer rounded-xl border p-4 transition-colors"
                  : "rounded-xl border p-4"
              }
              onClick={() => {
                if (!myProfile) return;
                openManage(list);
              }}
              onKeyDown={(event) => {
                if (!myProfile) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openManage(list);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-1.5 truncate text-base font-semibold">
                    <span className="truncate">{list.name}</span>
                    {list.shared?.isPublished ? (
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
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {t("listsItemCount", { count: list.itemCount })}
                    {list.isDefault ? ` • ${t("listsDefault")}` : ""}
                  </p>
                </div>
                {myProfile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={listActionId === list.id}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        <MoreVertical className="size-4" />
                        <span className="sr-only">{t("listsActions")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <DropdownMenuItem onClick={() => openManage(list)}>
                        <List className="size-4" />
                        {t("listsManageItems")}
                      </DropdownMenuItem>
                      {!list.isDefault ? (
                        <DropdownMenuItem onClick={() => openRename(list)}>
                          <Pencil className="size-4" />
                          {t("listsRename")}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        disabled={
                          !list.shared?.isPublished && list.itemCount === 0
                        }
                        onClick={() => {
                          if (list.shared?.isPublished) {
                            void handleUnpublish(list);
                          } else {
                            if (list.itemCount === 0) return;
                            openPublishDialog(list);
                          }
                        }}
                      >
                        <Share2 className="size-4" />
                        {list.shared?.isPublished
                          ? t("listsUnpublish")
                          : t("listsPublish")}
                      </DropdownMenuItem>
                      {list.shared?.isPublished ? (
                        <DropdownMenuItem
                          onClick={() => void copyShareLink(list)}
                        >
                          <Link2 className="size-4" />
                          {t("listsCopyLink")}
                        </DropdownMenuItem>
                      ) : null}
                      {!list.isDefault ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => openDeleteDialog(list)}
                          >
                            <Trash2 className="size-4" />
                            {t("listsDelete")}
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>

              <div className="mt-3 h-20 space-y-1 overflow-hidden">
                {list.items.slice(0, 3).map((item) => (
                  <p
                    key={item.id}
                    className="text-muted-foreground block truncate text-sm"
                  >
                    {item.gear.name}
                  </p>
                ))}
                {list.itemCount > 3 ? (
                  <p className="text-muted-foreground text-xs">
                    {t("listsMoreItems", { count: list.itemCount - 3 })}
                  </p>
                ) : null}
              </div>
              {list.shared?.isPublished && list.shared?.path ? (
                <div className="mt-2 flex justify-end">
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    icon={<DoorOpen className="size-4" />}
                  >
                    <LocaleLink
                      href={list.shared.path}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      {t("listsOpen")}
                    </LocaleLink>
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : myProfile ? (
        <Empty className="border-border rounded-lg border-2 border-dashed p-8">
          <EmptyTitle>{t("listsEmptyOwnTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("listsEmptyOwnDescription")}
          </EmptyDescription>
        </Empty>
      ) : (
        <Empty className="border-border rounded-lg border-2 border-dashed p-8">
          <EmptyTitle>
            {profileName
              ? t("listsEmptyOtherNamed", { name: profileName })
              : t("listsEmptyOtherTitle")}
          </EmptyTitle>
          <EmptyDescription>
            {t("listsEmptyOtherDescription")}
          </EmptyDescription>
        </Empty>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("listsCreateDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("listsCreateDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="create-list-name">{t("listsNameLabel")}</Label>
            <Input
              id="create-list-name"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder={t("listsCreatePlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t("close")}
            </Button>
            <Button onClick={handleCreate} loading={isCreating}>
              {t("listsCreateButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameListId)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameListId(null);
            setRenameName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("listsRenameDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-list-name">{t("listsNameLabel")}</Label>
            <Input
              id="rename-list-name"
              value={renameName}
              onChange={(event) => setRenameName(event.target.value)}
              placeholder={t("listsRenamePlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameListId(null);
                setRenameName("");
              }}
            >
              {t("close")}
            </Button>
            <Button onClick={handleRename} loading={isRenaming}>
              {t("listsSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(publishListId)}
        onOpenChange={(open) => {
          if (!open) {
            closePublishDialog();
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
            <Label htmlFor="publish-list-name">{t("listsPublicNameLabel")}</Label>
            <Input
              id="publish-list-name"
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
            <Button onClick={() => void handlePublish()} loading={isPublishing}>
              {t("listsPublishButton")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteListId)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("listsDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("listsDeleteDescription", {
                name:
                  lists.find((list) => list.id === deleteListId)?.name ??
                  t("listsThisList"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                disabled={Boolean(
                  deleteListId && listActionId === deleteListId,
                )}
              >
                {t("close")}
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              loading={Boolean(deleteListId && listActionId === deleteListId)}
              onClick={() => {
                if (!deleteListId) return;
                void handleDelete(deleteListId);
              }}
            >
              {t("listsDeleteButton")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ListManageModal
        open={isManageOpen}
        onOpenChange={handleManageOpenChange}
        list={manageList}
        onListsUpdated={applyListsUpdate}
      />
    </div>
  );
}
