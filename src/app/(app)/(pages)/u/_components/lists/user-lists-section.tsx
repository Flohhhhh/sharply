"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Link2,
  ListPlus,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
};

export function UserListsSection({
  initialLists,
  myProfile,
}: UserListsSectionProps) {
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

  const manageList =
    lists.find((list) => list.id === manageListId) ?? lists[0] ?? null;

  const publishedCount = useMemo(
    () => lists.filter((list) => list.shared?.isPublished).length,
    [lists],
  );

  const handleCreate = async () => {
    if (!createName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const result = await actionCreateUserList(createName);
      setLists(result.lists);
      setCreateName("");
      setIsCreateOpen(false);
      toast.success("List created");
    } catch {
      toast.error("Failed to create list");
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
      setLists(result.lists);
      setRenameListId(null);
      setRenameName("");
      toast.success("List renamed");
    } catch {
      toast.error("Failed to rename list");
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
      setLists(result.lists);
      setDeleteListId(null);
      toast.success("List deleted");
    } catch {
      toast.error("Failed to delete list");
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
      toast.error("List name is required");
      return;
    }

    setIsPublishing(true);
    setListActionId(publishListId);
    try {
      const currentList = lists.find((list) => list.id === publishListId);
      if (!currentList) {
        throw new Error("List not found");
      }

      if (currentList.name !== nextName) {
        const renamed = await actionRenameUserList(publishListId, nextName);
        setLists(renamed.lists);
      }

      const result = await actionPublishUserList(publishListId);
      setLists(result.lists);
      setPublishListId(null);
      setPublishName("");
      toast.success("List published");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish list";
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
      setLists(result.lists);
      toast.success("List unpublished");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update publish state";
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
      toast.success("Share link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const openManage = (list: ProfileUserListState) => {
    setManageListId(list.id);
    setIsManageOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold">Lists</h2>
          <p className="text-muted-foreground text-sm">
            {lists.length} total • {publishedCount} published
          </p>
        </div>
        {myProfile ? (
          <Button
            type="button"
            size="sm"
            icon={<ListPlus className="size-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create list
          </Button>
        ) : null}
      </div>

      {lists.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {lists.map((list) => (
            <div key={list.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">
                    {list.name}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {list.itemCount} items
                    {list.isDefault ? " • Default" : ""}
                  </p>
                </div>
                {myProfile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={listActionId === list.id}
                      >
                        <MoreVertical className="size-4" />
                        <span className="sr-only">List actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openManage(list)}>
                        <List className="size-4" />
                        Manage items
                      </DropdownMenuItem>
                      {!list.isDefault ? (
                        <DropdownMenuItem onClick={() => openRename(list)}>
                          <Pencil className="size-4" />
                          Rename
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onClick={() => {
                          if (list.shared?.isPublished) {
                            void handleUnpublish(list);
                          } else {
                            openPublishDialog(list);
                          }
                        }}
                      >
                        <Share2 className="size-4" />
                        {list.shared?.isPublished ? "Unpublish" : "Publish"}
                      </DropdownMenuItem>
                      {list.shared?.isPublished ? (
                        <DropdownMenuItem
                          onClick={() => void copyShareLink(list)}
                        >
                          <Link2 className="size-4" />
                          Copy link
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
                            Delete
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>

              <div className="mt-3 space-y-1">
                {list.items.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/gear/${item.gear.slug}`}
                    className="text-muted-foreground hover:text-foreground block truncate text-sm"
                  >
                    {item.gear.brandName ? `${item.gear.brandName} ` : ""}
                    {item.gear.name}
                  </Link>
                ))}
                {list.itemCount > 4 ? (
                  <p className="text-muted-foreground text-xs">
                    +{list.itemCount - 4} more
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {myProfile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Pencil className="size-4" />}
                    onClick={() => openManage(list)}
                  >
                    Manage
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
          No lists yet.
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new list</DialogTitle>
            <DialogDescription>
              Create a list to organize saved gear.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="create-list-name">List name</Label>
            <Input
              id="create-list-name"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="My travel kit"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={isCreating}>
              Create list
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
            <DialogTitle>Rename list</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-list-name">List name</Label>
            <Input
              id="rename-list-name"
              value={renameName}
              onChange={(event) => setRenameName(event.target.value)}
              placeholder="New list name"
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
              Cancel
            </Button>
            <Button onClick={handleRename} loading={isRenaming}>
              Save
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
            <AlertDialogTitle>Choose a public list name</AlertDialogTitle>
            <AlertDialogDescription>
              This name is shown on the shared page and can be changed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="publish-list-name">Public name</Label>
            <Input
              id="publish-list-name"
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
            <Button onClick={() => void handlePublish()} loading={isPublishing}>
              Publish list
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
            <AlertDialogTitle>Delete this list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">
                {lists.find((list) => list.id === deleteListId)?.name ??
                  "this list"}
              </span>{" "}
              and all saved items in it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                disabled={Boolean(deleteListId && listActionId === deleteListId)}
              >
                Cancel
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
              Delete list
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ListManageModal
        open={isManageOpen}
        onOpenChange={setIsManageOpen}
        list={manageList}
        onListsUpdated={setLists}
      />
    </div>
  );
}
