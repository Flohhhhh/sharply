"use client";

import { useMemo, useState } from "react";
import { Bookmark, Check, ChevronDown, Plus } from "lucide-react";
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
type SaveItemResolvedState = NonNullable<SaveItemInitialState>;

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
  onStateChange,
  mode = "split",
}: {
  slug: string;
  initialState: SaveItemInitialState;
  onStateChange?: (state: SaveItemResolvedState) => void;
  mode?: "split" | "list";
}) {
  const [pickerState, setPickerState] = useState(() => initialState);
  const [isMutating, setIsMutating] = useState(false);
  const [mutatingListId, setMutatingListId] = useState<string | null>(null);
  const [createDialog, setCreateDialog] = useState({
    open: false,
    name: "",
    creating: false,
  });

  const savedSet = useMemo(
    () => new Set(pickerState?.savedListIds ?? []),
    [pickerState?.savedListIds],
  );

  if (!pickerState) return null;
  const defaultListId = pickerState.defaultListId;
  const isSavedAnywhere = savedSet.size > 0;

  const applyActionLists = (lists: ActionListShape[]) => {
    const nextState = toPickerState(lists, slug);
    setPickerState(nextState);
    onStateChange?.(nextState);
  };

  const toggleList = async (listId: string) => {
    if (isMutating) return;

    setIsMutating(true);
    setMutatingListId(listId);
    try {
      if (savedSet.has(listId)) {
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
      setMutatingListId(null);
    }
  };

  const handlePrimaryClick = async () => {
    if (!defaultListId) return;
    await toggleList(defaultListId);
  };

  const handleCreateList = async () => {
    if (!createDialog.name.trim() || createDialog.creating) return;
    setCreateDialog((prev) => ({ ...prev, creating: true }));

    try {
      const existingListIds = new Set(pickerState.lists.map((list) => list.id));
      const result = await actionCreateUserList(createDialog.name);
      const createdLists = result.lists as ActionListShape[];
      const createdList = createdLists.find(
        (list) => !existingListIds.has(list.id),
      );

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
      setCreateDialog({ open: false, name: "", creating: false });
      toast.success("List created and item saved");
    } catch {
      toast.error("Failed to create list and save item");
    } finally {
      setCreateDialog((prev) => ({ ...prev, creating: false }));
    }
  };

  return (
    <>
      {mode === "split" ? (
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
              <DropdownMenuItem
                onClick={() =>
                  setCreateDialog((prev) => ({ ...prev, open: true }))
                }
              >
                <Plus className="size-4" />
                Create list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      ) : (
        <div className="space-y-2">
          {pickerState.lists.map((list) => {
            const isSaved = savedSet.has(list.id);
            return (
              <Button
                key={list.id}
                type="button"
                variant={isSaved ? "default" : "outline"}
                className="h-auto w-full justify-start px-3 py-2"
                disabled={isMutating}
                loading={mutatingListId === list.id}
                onClick={() => void toggleList(list.id)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {isSaved ? <Check className="size-3.5" /> : null}
                  <span className="truncate">{list.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {list.itemCount}
                  </span>
                </span>
              </Button>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setCreateDialog((prev) => ({ ...prev, open: true }))}
          >
            <Plus className="size-4" />
            Create list
          </Button>
        </div>
      )}

      <Dialog
        open={createDialog.open}
        onOpenChange={(open) => setCreateDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new list</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-list-name">List name</Label>
            <Input
              id="new-list-name"
              placeholder="My favorites"
              value={createDialog.name}
              onChange={(event) =>
                setCreateDialog((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setCreateDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button onClick={handleCreateList} loading={createDialog.creating}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
