"use client";

import { Tags, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { fetchJson } from "~/lib/fetch-json";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  actionAssignTagToGear,
  actionRemoveTagFromGear,
} from "~/server/tags/actions";
import type { TagRow } from "~/server/tags/service";

type TagResponse = { tags: TagRow[]; assignedTags: TagRow[] };

export function ManageGearTagsModal({
  gearId,
  slug,
  trigger,
}: {
  gearId: string;
  slug: string;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("tags");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const { data, mutate } = useSWR<TagResponse>(
    open ? `/api/gear/${encodeURIComponent(slug)}/tags` : null,
    (url: string) =>
      fetchJson<TagResponse>(url, { credentials: "same-origin" }),
    { revalidateOnFocus: false },
  );
  const assignedIds = useMemo(
    () => new Set(data?.assignedTags.map((tag) => tag.id) ?? []),
    [data?.assignedTags],
  );
  const availableTags = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (data?.tags ?? []).filter(
      (tag) =>
        !assignedIds.has(tag.id) &&
        (!normalized ||
          tag.name.toLowerCase().includes(normalized) ||
          tag.slug.includes(normalized)),
    );
  }, [assignedIds, data?.tags, query]);
  function assign(tagId: string) {
    startTransition(async () => {
      try {
        await actionAssignTagToGear(gearId, tagId);
        await mutate();
        router.refresh();
        toast.success(t("assigned"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("assignmentFailed"),
        );
      }
    });
  }
  function remove(tagId: string) {
    startTransition(async () => {
      try {
        await actionRemoveTagFromGear(gearId, tagId);
        await mutate();
        router.refresh();
        toast.success(t("removed"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("removalFailed"),
        );
      }
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("manageGearTitle")}</DialogTitle>
          <DialogDescription>{t("manageGearDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("assignedTags")}</p>
            {(data?.assignedTags.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("noAssignedTags")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data?.assignedTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="secondary"
                    size="sm"
                    disabled={isPending}
                    onClick={() => remove(tag.id)}
                  >
                    {tag.name}
                    <X className="size-3" />
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchTags")}
            />
            <div className="max-h-56 overflow-y-auto rounded-md border">
              {availableTags.length === 0 ? (
                <p className="text-muted-foreground p-3 text-sm">
                  {t("noMatchingTags")}
                </p>
              ) : (
                availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => assign(tag.id)}
                    className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:opacity-50"
                  >
                    <span>{tag.name}</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {tag.slug}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManageGearTagsTrigger({
  gearId,
  slug,
}: {
  gearId?: string;
  slug: string;
}) {
  const t = useTranslations("tags");
  if (!gearId) return null;
  return (
    <ManageGearTagsModal
      gearId={gearId}
      slug={slug}
      trigger={
        <button
          type="button"
          className="hover:bg-accent/80 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:cursor-pointer hover:border"
          aria-label={t("manageGearTitle")}
        >
          <Tags className="text-foreground/70 size-4.5" />
        </button>
      }
    />
  );
}
