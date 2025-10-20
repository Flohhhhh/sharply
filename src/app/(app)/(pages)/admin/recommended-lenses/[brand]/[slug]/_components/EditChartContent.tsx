"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GearCombobox from "~/components/custom-inputs/gear-combobox";
import RatingSelectField from "../../../_components/RatingSelectField";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  actionUpsertItem,
  actionUpdateChartMeta,
  actionDeleteItem,
} from "~/server/recommendations/actions";
import { Input } from "~/components/ui/input";

function extractMessage(value: unknown): string | null {
  if (typeof value === "object" && value !== null && "message" in value) {
    const maybe = (value as { message?: unknown }).message;
    return typeof maybe === "string" ? maybe : null;
  }
  return null;
}

function showError(message: string) {
  toast.error(message);
}

export default function EditChartContent({
  brand,
  slug,
  items,
  title,
}: {
  brand: string;
  slug: string;
  title: string;
  items: Array<{
    id: string;
    gearId: string;
    gearName: string;
    rating: string;
    note?: string | null;
  }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function onUpsert(formData: FormData) {
    startTransition(async () => {
      const res = await actionUpsertItem(formData);
      if (res?.ok) {
        toast.success("Item saved");
        router.refresh();
      } else {
        const msg = extractMessage(res) ?? "Failed to save item";
        showError(msg);
      }
    });
  }

  async function onMeta(formData: FormData) {
    startTransition(async () => {
      const res = await actionUpdateChartMeta(formData);
      if (res?.ok) {
        toast.success("Saved");
        router.refresh();
      } else {
        toast.error("Failed to save");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Meta */}
      <form action={onMeta} className="space-y-3 rounded-md border p-4">
        <input type="hidden" name="brand" value={brand} />
        <input type="hidden" name="slug" value={slug} />
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={title} required />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            defaultChecked
            className="size-4"
          />
          <Label htmlFor="isPublished">Published</Label>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save meta"}
        </Button>
      </form>

      {/* Add/Update Item */}
      <form action={onUpsert} className="space-y-3 rounded-md border p-4">
        <input type="hidden" name="brand" value={brand} />
        <input type="hidden" name="slug" value={slug} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="gearId">Gear</Label>
            <GearCombobox
              name="gearId"
              placeholder="Search lenses..."
              onlyLenses
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rating">Rating</Label>
            <RatingSelectField name="rating" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              name="note"
              rows={2}
              placeholder="Short rationale"
            />
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Add/Update Item"}
        </Button>
      </form>

      {/* Items List */}
      <div className="rounded-md border">
        <div className="bg-muted/30 grid grid-cols-12 gap-2 px-3 py-2 text-sm font-medium">
          <div className="col-span-5">Gear</div>
          <div className="col-span-2">Rating</div>
          <div className="col-span-4">Note</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {items.map((it) => (
            <div
              key={it.id}
              className="grid grid-cols-12 items-start gap-2 px-3 py-2 text-sm"
            >
              <div className="col-span-5 truncate">{it.gearName}</div>
              <div className="col-span-6">
                <InlineEditRow
                  brand={brand}
                  slug={slug}
                  itemId={it.id}
                  gearId={it.gearId}
                  defaultRating={it.rating}
                  defaultNote={it.note ?? ""}
                  onSaved={() => router.refresh()}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <form
                  action={async (fd: FormData) => {
                    startTransition(async () => {
                      fd.set("itemId", it.id);
                      const res = await actionDeleteItem(fd);
                      if (res?.ok) {
                        toast.success("Removed");
                        router.refresh();
                      } else {
                        showError("Failed to remove");
                      }
                    });
                  }}
                >
                  <input type="hidden" name="itemId" defaultValue={it.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InlineEditRow({
  brand,
  slug,
  itemId,
  gearId,
  defaultRating,
  defaultNote,
  onSaved,
}: {
  brand: string;
  slug: string;
  itemId: string;
  gearId: string;
  defaultRating: string;
  defaultNote: string;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState<string>(defaultRating);
  const [note, setNote] = useState<string>(defaultNote);
  const [open, setOpen] = useState(false);

  function triggerSave(partial: { rating?: string; note?: string }) {
    const fd = new FormData();
    fd.set("brand", brand);
    fd.set("slug", slug);
    fd.set("gearId", gearId);
    if (partial.rating !== undefined) fd.set("rating", partial.rating);
    if (partial.note !== undefined) fd.set("note", partial.note);
    startTransition(async () => {
      const res = await actionUpsertItem(fd);
      if (!res?.ok) showError(extractMessage(res) ?? "Failed to update");
      else onSaved();
    });
  }

  return (
    <form className="grid grid-cols-12 items-center gap-2">
      <input type="hidden" name="brand" value={brand} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="gearId" value={gearId} />
      {/* Keep itemId in case you later switch to id-based updates */}
      <input type="hidden" name="itemId" value={itemId} />

      <div className="col-span-4">
        <RatingSelectField
          name="rating"
          value={rating}
          onValueChange={(val) => {
            setRating(val);
            if (val !== defaultRating) triggerSave({ rating: val });
          }}
          disabled={pending}
        />
      </div>
      <div className="col-span-6 flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Edit note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit note</DialogTitle>
            </DialogHeader>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              placeholder="Enter note..."
              disabled={pending}
            />
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (note !== defaultNote) triggerSave({ note });
                }}
                disabled={pending}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="text-muted-foreground truncate">
          {note ? note : "No note"}
        </div>
      </div>
      <div
        className={`col-span-2 flex justify-end transition-opacity ${pending ? "opacity-50" : "opacity-100"}`}
      >
        <span className="text-muted-foreground text-xs">
          {pending ? "Saving..." : ""}
        </span>
      </div>
    </form>
  );
}
