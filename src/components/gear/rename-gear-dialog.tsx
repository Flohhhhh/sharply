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

interface RenameGearDialogProps {
  gearId: string;
  currentName: string;
  currentSlug: string;
  trigger?: React.ReactNode;
  onSuccess?: (result: { id: string; name: string; slug: string }) => void;
}

export function RenameGearDialog({
  gearId,
  currentName,
  currentSlug,
  trigger,
  onSuccess,
}: RenameGearDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync input with current name when dialog opens or name changes
  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);

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

        // If slug changed, navigate to new URL
        if (result.slug !== currentSlug) {
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
