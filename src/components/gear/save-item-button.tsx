"use client";

import { useMemo, useState } from "react";
import { Bookmark, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  actionAddGearToUserList,
  actionCreateUserList,
  actionRemoveGearFromUserList,
} from "~/server/user-lists/actions";

type SaveItemListOption = {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
};

type SaveItemInitialState = {
  lists: SaveItemListOption[];
  savedListIds: string[];
  defaultListId: string | null;
} | null;

type ActionListShape = {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
  items: Array<{
    gear: { slug: string };
  }>;
};

function toPickerState(lists: ActionListShape[], slug: string) {
  const normalizedLists: SaveItemListOption[] = lists.map((list) => ({
    id: list.id,
    name: list.name,
    isDefault: list.isDefault,
    itemCount: list.itemCount,
  }));
  const savedListIds = lists
    .filter((list) => list.items.some((item) => item.gear.slug === slug))
    .map((list) => list.id);
  const defaultListId =
    normalizedLists.find((list) => list.isDefault)?.id ??
    normalizedLists[0]?.id ??
    null;

  return {
    lists: normalizedLists,
    savedListIds,
    defaultListId,
  };
}

export function SaveItemButton({
  slug,
  initialState,
}: {
  slug: string;
  initialState: SaveItemInitialState;
}) {
  const [pickerState, setPickerState] = useState(initialState);
  const [isMutating, setIsMutating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const savedSet = useMemo(
    () => new Set(pickerState?.savedListIds ?? []),
    [pickerState?.savedListIds],
  );

  if (!pickerState) return null;

  const defaultListId = pickerState.defaultListId;
  const isSavedToDefault = defaultListId ? savedSet.has(defaultListId) : false;
  const isSavedAnywhere = savedSet.size > 0;

  const applyActionLists = (lists: ActionListShape[]) => {
    setPickerState(toPickerState(lists, slug));
  };

  const toggleList = async (listId: string) => {
    if (isMutating) return;
    setIsMutating(true);

    const alreadySaved = savedSet.has(listId);

    try {
      if (alreadySaved) {
        const result = await actionRemoveGearFromUserList({ listId, slug });
        applyActionLists(result.lists as ActionListShape[]);
        toast.success("Removed from list");
      } else {
        const result = await actionAddGearToUserList({ listId, slug });
        applyActionLists(result.lists as ActionListShape[]);
        toast.success("Saved to list");
      }
    } catch {
      toast.error("Failed to update saved item");
    } finally {
      setIsMutating(false);
    }
  };

  const handlePrimaryClick = async () => {
    if (!defaultListId) return;
    await toggleList(defaultListId);
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || isCreating) return;
    setIsCreating(true);

    try {
      const existingListIds = new Set(pickerState.lists.map((list) => list.id));
      const result = await actionCreateUserList(newListName);
      const createdLists = result.lists as ActionListShape[];
      const createdList = createdLists.find((list) => !existingListIds.has(list.id));

      if (!createdList) {
        applyActionLists(createdLists);
        toast.error("List created, but it could not be selected for saving");
        return;
      }

      const addResult = await actionAddGearToUserList({
        listId: createdList.id,
        slug,
      });
      applyActionLists(addResult.lists as ActionListShape[]);
      setNewListName("");
      setIsCreateOpen(false);
      toast.success("List created and item saved");
    } catch {
      toast.error("Failed to create list and save item");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <ButtonGroup className="w-full">
        <Button
          type="button"
          variant={isSavedAnywhere ? "default" : "outline"}
          className="flex-1 justify-start"
          icon={<Bookmark className={isSavedAnywhere ? "fill-current" : ""} />}
          loading={isMutating}
          onClick={() => void handlePrimaryClick()}
        >
          {isSavedAnywhere ? "Saved" : "Save Item"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={isSavedAnywhere ? "default" : "outline"}
              size="icon"
              disabled={isMutating}
            >
              <ChevronDown className="size-4" />
              <span className="sr-only">Choose list</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {pickerState.lists.map((list) => (
              <DropdownMenuCheckboxItem
                key={list.id}
                checked={savedSet.has(list.id)}
                onCheckedChange={() => {
                  void toggleList(list.id);
                }}
              >
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">{list.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {list.itemCount}
                  </span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              Create list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new list</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-list-name">List name</Label>
            <Input
              id="new-list-name"
              placeholder="My favorites"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateList} loading={isCreating}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
