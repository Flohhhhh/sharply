"use client";

import { Edit, Eye, EyeOff, Plus, Search, Tags, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { isTagIconName, TagIcon } from "~/components/gear/tag-icon";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  actionAssignTagToGear,
  actionCreateTag,
  actionDeleteTag,
  actionRemoveTagFromGear,
  actionUpdateTag,
} from "~/server/tags/actions";
import type { AdminTagRow, TagGearRow } from "~/server/tags/service";
import { fetchJson } from "~/lib/fetch-json";

type FormState = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  pageTitle: string;
  pageContent: string;
  internalNotes: string;
  unlisted: boolean;
};
const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  pageTitle: "",
  pageContent: "",
  internalNotes: "",
  unlisted: false,
};
type GearResponse = { gear: TagGearRow[] };

function tagForm(tag?: AdminTagRow | null): FormState {
  return tag
    ? {
        name: tag.name,
        slug: tag.slug,
        description: tag.description ?? "",
        icon: tag.icon ?? "",
        pageTitle: tag.pageTitle ?? "",
        pageContent: tag.pageContent ?? "",
        internalNotes: tag.internalNotes ?? "",
        unlisted: tag.unlisted,
      }
    : emptyForm;
}

export function TagsManager({
  initialTags,
  canManage,
}: {
  initialTags: AdminTagRow[];
  canManage: boolean;
}) {
  const t = useTranslations("tags");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminTagRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [assignmentTag, setAssignmentTag] = useState<AdminTagRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q
      ? initialTags
      : initialTags.filter(
          (tag) =>
            tag.name.toLowerCase().includes(q) ||
            tag.slug.includes(q) ||
            tag.description?.toLowerCase().includes(q),
        );
  }, [initialTags, query]);
  const { data: assigned, mutate: mutateAssigned } = useSWR<GearResponse>(
    canManage && assignmentTag
      ? `/api/admin/tags/${assignmentTag.id}/gear`
      : null,
    fetchJson,
    { revalidateOnFocus: false },
  );
  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }
  function openEdit(tag: AdminTagRow) {
    setEditing(tag);
    setForm(tagForm(tag));
    setFormOpen(true);
  }
  function save() {
    startTransition(async () => {
      try {
        if (editing) {
          await actionUpdateTag(editing.id, form);
          toast.success(t("updated"));
        } else {
          await actionCreateTag(form);
          toast.success(t("created"));
        }
        setFormOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("saveFailed"));
      }
    });
  }
  function removeTag(tag: AdminTagRow) {
    startTransition(async () => {
      try {
        await actionDeleteTag(tag.id);
        toast.success(t("deleted"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("deleteFailed"));
      }
    });
  }
  function assign(gearId: string) {
    if (!assignmentTag) return;
    startTransition(async () => {
      try {
        await actionAssignTagToGear(gearId, assignmentTag.id);
        await mutateAssigned();
        toast.success(t("assigned"));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("assignmentFailed"),
        );
      }
    });
  }
  function unassign(gearId: string) {
    if (!assignmentTag) return;
    startTransition(async () => {
      try {
        await actionRemoveTagFromGear(gearId, assignmentTag.id);
        await mutateAssigned();
        toast.success(t("removed"));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("removalFailed"),
        );
      }
    });
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchTags")}
            className="pl-9"
          />
        </div>
        {canManage ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("create")}
          </Button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t("name")}</th>
              <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                {t("slug")}
              </th>
              <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">
                {t("description")}
              </th>
              <th className="w-12 px-4 py-3 text-center">
                <span className="sr-only">{t("publicStatus")}</span>
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("gearCount")}
              </th>
              {canManage ? (
                <th className="w-28 px-4 py-3 text-right">
                  <span className="sr-only">{t("actions")}</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 6 : 5}
                  className="text-muted-foreground px-4 py-10 text-center"
                >
                  {t("noTags")}
                </td>
              </tr>
            ) : (
              filtered.map((tag) => (
                <tr key={tag.id} className="group border-t">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      <TagIcon name={tag.icon} size={16} />
                      {tag.unlisted ? (
                        tag.name
                      ) : (
                        <Link
                          href={`/tags/${tag.slug}`}
                          className="hover:text-primary hover:underline"
                        >
                          {tag.name}
                        </Link>
                      )}
                    </span>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3 sm:table-cell">
                    {tag.slug}
                  </td>
                  <td className="text-muted-foreground hidden max-w-md truncate px-4 py-3 lg:table-cell">
                    {tag.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tag.unlisted ? (
                      <EyeOff
                        className="text-muted-foreground mx-auto size-4"
                        aria-label={t("unlisted")}
                      />
                    ) : (
                      <Eye
                        className="mx-auto size-4"
                        aria-label={t("listed")}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {tag.assignedGearCount}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("manageAssignments")}
                          onClick={() => setAssignmentTag(tag)}
                        >
                          <Tags className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("edit")}
                          onClick={() => openEdit(tag)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("delete")}
                          disabled={tag.assignedGearCount > 0 || isPending}
                          onClick={() => removeTag(tag)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {canManage ? (
        <>
          <TagFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            editing={editing}
            form={form}
            setForm={setForm}
            isPending={isPending}
            onSave={save}
          />
          <AssignmentDialog
            tag={assignmentTag}
            onOpenChange={(open) => !open && setAssignmentTag(null)}
            assigned={assigned?.gear ?? []}
            isPending={isPending}
            onAssign={assign}
            onRemove={unassign}
          />
        </>
      ) : null}
    </div>
  );
}

function TagFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  isPending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AdminTagRow | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  isPending: boolean;
  onSave: () => void;
}) {
  const t = useTranslations("tags");
  const hasValidIcon = isTagIconName(form.icon);
  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [field]: value }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("editTag") : t("createTag")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">{t("name")}</Label>
            <Input
              id="tag-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-slug">{t("slug")}</Label>
            <Input
              id="tag-slug"
              disabled={Boolean(editing)}
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-description">{t("description")}</Label>
            <p className="text-muted-foreground text-sm">
              {t("descriptionHint")}
            </p>
            <Textarea
              id="tag-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-icon">{t("icon")}</Label>
            <div className="relative">
              <Input
                id="tag-icon"
                value={form.icon}
                onChange={(event) => update("icon", event.target.value)}
                placeholder="Camera"
                className="pr-10"
              />
              <span
                className="absolute top-1/2 right-3 -translate-y-1/2"
                title={hasValidIcon ? form.icon : t("invalidIcon")}
              >
                {hasValidIcon ? (
                  <TagIcon name={form.icon} size={17} />
                ) : (
                  <span className="border-muted-foreground/50 block size-4 rounded-sm border" />
                )}
              </span>
            </div>
            <a
              href="https://lucide.dev/icons/"
              target="_blank"
              rel="noreferrer"
              className="text-primary text-sm hover:underline"
            >
              {t("browseLucideIcons")}
            </a>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-page-title">{t("pageTitle")}</Label>
            <Input
              id="tag-page-title"
              value={form.pageTitle}
              onChange={(event) => update("pageTitle", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-page-content">{t("pageContent")}</Label>
            <p className="text-muted-foreground text-sm">
              {t("pageContentHint")}
            </p>
            <Textarea
              id="tag-page-content"
              value={form.pageContent}
              onChange={(event) => update("pageContent", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-internal-notes">{t("internalNotes")}</Label>
            <Textarea
              id="tag-internal-notes"
              value={form.internalNotes}
              onChange={(event) => update("internalNotes", event.target.value)}
            />
          </div>
          <div className="flex items-start gap-3 rounded-md border px-4 py-3">
            <Checkbox
              id="tag-unlisted"
              checked={form.unlisted}
              onCheckedChange={(checked) =>
                update("unlisted", checked === true)
              }
            />
            <div className="space-y-1">
              <Label htmlFor="tag-unlisted">{t("unlisted")}</Label>
              <p className="text-muted-foreground text-sm">
                {t("unlistedHint")}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave} disabled={isPending}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentDialog({
  tag,
  onOpenChange,
  assigned,
  isPending,
  onAssign,
  onRemove,
}: {
  tag: AdminTagRow | null;
  onOpenChange: (open: boolean) => void;
  assigned: TagGearRow[];
  isPending: boolean;
  onAssign: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("tags");
  const [selectedGear, setSelectedGear] = useState<GearOption | null>(null);
  return (
    <Dialog open={Boolean(tag)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("manageAssignments")}</DialogTitle>
          <DialogDescription>{tag?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <GearSearchCombobox
            value={selectedGear}
            setValue={setSelectedGear}
            onSelectionChange={(gear) => {
              if (gear) onAssign(gear.id);
              setSelectedGear(null);
            }}
            placeholder={t("searchGear")}
            searchPlaceholder={t("searchGear")}
            emptyText={t("noMatchingGear")}
            excludeIds={assigned.map((item) => item.id)}
            disabled={isPending}
            inDialog
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("assignedGear")}</p>
            {assigned.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("noAssignedGear")}
              </p>
            ) : (
              assigned.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{item.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => onRemove(item.id)}
                  >
                    {t("remove")}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
