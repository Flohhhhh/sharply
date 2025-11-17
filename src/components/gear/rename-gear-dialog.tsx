"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { actionRenameGear } from "~/server/admin/gear/actions";
import { toast } from "sonner";
import { Checkbox } from "~/components/ui/checkbox";

interface RenameGearDialogProps {
  gearId: string;
  currentName: string;
  currentSlug: string;
  trigger?: React.ReactNode;
  onSuccess?: (result: { id: string; name: string; slug: string }) => void;
  /**
   * When true, show a checkbox that lets the user choose whether to navigate
   * to the gear page after a successful rename (useful in admin table).
   */
  showNavigateOption?: boolean;
  /**
   * Initial checked state for navigate-after-rename when the option is shown.
   * Defaults to false (stay on the current page).
   */
  defaultNavigateAfterRename?: boolean;
}

export function RenameGearDialog({
  gearId,
  currentName,
  currentSlug,
  trigger,
  onSuccess,
  showNavigateOption = false,
  defaultNavigateAfterRename = false,
}: RenameGearDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [navigateAfterRename, setNavigateAfterRename] = useState(
    defaultNavigateAfterRename,
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync input with current name when dialog opens or name changes
  useEffect(() => {
    if (open) {
      setNewName(currentName);
      setNavigateAfterRename(defaultNavigateAfterRename);
    }
  }, [open, currentName, defaultNavigateAfterRename]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newName.trim();

    if (!trimmedName) {
      toast.error("Please enter a new name");
      return;
    }

    // Prevent submission if name hasn't changed
    if (trimmedName === currentName) {
      toast.info("Name hasn't changed");
      return;
    }

    startTransition(async () => {
      try {
        const result = await actionRenameGear({
          gearId,
          newName: trimmedName,
        });

        toast.success(`Successfully renamed to "${result.name}"`);
        setOpen(false);
        setNewName(result.name);

        // Decide whether to navigate after rename.
        // If the navigate option is shown, respect the checkbox.
        // If not shown (e.g., on gear page), preserve original behavior:
        // navigate when slug changes.
        const shouldNavigate = showNavigateOption
          ? navigateAfterRename
          : result.slug !== currentSlug;
        if (shouldNavigate && result.slug !== currentSlug) {
          router.push(`/gear/${result.slug}`);
        } else {
          router.refresh();
        }

        onSuccess?.(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to rename gear";
        toast.error(message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Rename</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Gear Item</DialogTitle>
            <DialogDescription>
              Update the name of this gear item. The slug and search index will
              be automatically updated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-name" className="text-muted-foreground">
                Current Name
              </Label>
              <Input
                id="current-name"
                value={currentName}
                disabled
                className="font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-name">New Name</Label>
              <Input
                id="new-name"
                placeholder="Enter new name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isPending}
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                Brand prefix will be added automatically if not present.
              </p>
            </div>
            {showNavigateOption ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="navigate-after-rename"
                  checked={navigateAfterRename}
                  onCheckedChange={(next) =>
                    setNavigateAfterRename(Boolean(next))
                  }
                  disabled={isPending}
                />
                <Label htmlFor="navigate-after-rename">
                  Go to item page after renaming
                </Label>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending || !newName.trim() || newName.trim() === currentName
              }
              loading={isPending}
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
