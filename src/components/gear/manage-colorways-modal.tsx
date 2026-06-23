"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ColorwaySwatchEditor } from "~/components/gear/colorway-swatch-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { useSession } from "~/lib/auth/auth-client";
import { requireRole } from "~/lib/auth/auth-helpers";
import { cn } from "~/lib/utils";
import {
  actionCreateGearColorway,
  actionDeleteGearColorway,
  actionEnableGearColorways,
  actionReorderGearColorways,
  actionResetGearColorways,
  actionUpdateGearColorway,
} from "~/server/admin/colorways/actions";
import type { GearColorway } from "~/types/gear";

type ManageColorwaysModalProps = {
  gearId: string;
  initialColorways: GearColorway[];
  trigger: React.ReactNode;
};

const DEFAULT_COLOR = "#737373";
type ResetActionMode = "keepGearImages" | "applyColorway";
type ResetDialogMode =
  | "applyDefaultColor"
  | "applyOtherColor"
  | "keepGearImages";

export function ManageColorwaysModal({
  gearId,
  initialColorways,
  trigger,
}: ManageColorwaysModalProps) {
  const t = useTranslations("gearDetail.colorways.manager");
  const { data } = useSession();
  const canDelete = Boolean(requireRole(data?.user, ["ADMIN"]));
  const [colorways, setColorways] = useState(initialColorways);
  const [name, setName] = useState("");
  const [colorA, setColorA] = useState(DEFAULT_COLOR);
  const [colorB, setColorB] = useState(DEFAULT_COLOR);
  const [busy, setBusy] = useState(false);
  const [resetColorwayId, setResetColorwayId] = useState(
    initialColorways[1]?.id ?? initialColorways[0]?.id ?? "",
  );
  const [resetMode, setResetMode] =
    useState<ResetDialogMode>("applyDefaultColor");
  const defaultColorway = colorways[0] ?? null;
  const nonDefaultColorways = colorways.slice(1);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setColorways(initialColorways);
    setResetColorwayId(
      initialColorways[1]?.id ?? initialColorways[0]?.id ?? "",
    );
    setResetMode("applyDefaultColor");
  }, [initialColorways]);

  useEffect(() => {
    if (!nonDefaultColorways.length) {
      return;
    }
    if (
      nonDefaultColorways.some((colorway) => colorway.id === resetColorwayId)
    ) {
      return;
    }
    setResetColorwayId(nonDefaultColorways[0]!.id);
  }, [nonDefaultColorways, resetColorwayId]);

  const ids = useMemo(
    () => colorways.map((colorway) => colorway.id),
    [colorways],
  );
  const swatchLabels = {
    edit: t("editSwatch"),
    title: t("swatchTitle"),
    colorA: t("colorA"),
    colorB: t("colorB"),
    hex: t("hex"),
    hue: t("hue"),
    saturationLightness: t("saturationLightness"),
    presets: t("presets"),
    black: t("black"),
    gray: t("gray"),
    white: t("white"),
    lightPreview: t("lightPreview"),
    darkPreview: t("darkPreview"),
    apply: t("apply"),
    cancel: t("cancel"),
  };

  async function createOrEnable() {
    if (!name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    setBusy(true);
    try {
      const params = {
        gearId,
        name,
        swatchColorA: colorA,
        swatchColorB: colorB,
      };
      const result = colorways.length
        ? await actionCreateGearColorway(params)
        : await actionEnableGearColorways(params);
      setColorways((current) => [...current, result.colorway]);
      setResetColorwayId((current) => current || result.colorway.id);
      setName("");
      setColorA(DEFAULT_COLOR);
      setColorB(DEFAULT_COLOR);
      toast.success(colorways.length ? t("created") : t("enabled"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function updateColorway(
    colorway: GearColorway,
    values: { name?: string; colorA?: string; colorB?: string },
  ) {
    const previous = colorway;
    const optimistic = {
      ...colorway,
      name: values.name ?? colorway.name,
      swatchColorA: values.colorA ?? colorway.swatchColorA,
      swatchColorB: values.colorB ?? colorway.swatchColorB,
    };
    setColorways((current) =>
      current.map((item) => (item.id === colorway.id ? optimistic : item)),
    );
    try {
      const result = await actionUpdateGearColorway({
        gearId,
        colorwayId: colorway.id,
        name: optimistic.name,
        swatchColorA: optimistic.swatchColorA,
        swatchColorB: optimistic.swatchColorB,
      });
      setColorways((current) =>
        current.map((item) =>
          item.id === colorway.id ? result.colorway : item,
        ),
      );
      toast.success(t("updated"));
    } catch (error) {
      setColorways((current) =>
        current.map((item) => (item.id === colorway.id ? previous : item)),
      );
      toast.error(t("saveFailed"));
      throw error;
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = colorways.findIndex((item) => item.id === active.id);
    const newIndex = colorways.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const previous = colorways;
    const next = arrayMove(colorways, oldIndex, newIndex).map(
      (item, sortOrder) => ({ ...item, sortOrder }),
    );
    setColorways(next);
    try {
      const result = await actionReorderGearColorways({
        gearId,
        orderedIds: next.map((item) => item.id),
      });
      setColorways(result.colorways);
      toast.success(t("reordered"));
    } catch {
      setColorways(previous);
      toast.error(t("saveFailed"));
    }
  }

  async function deleteColorway(colorwayId: string) {
    setBusy(true);
    try {
      const result = await actionDeleteGearColorway({ gearId, colorwayId });
      setColorways(result.colorways);
      setResetColorwayId(
        result.colorways[1]?.id ?? result.colorways[0]?.id ?? "",
      );
      toast.success(t("deleted"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function reset(mode: ResetActionMode, colorwayId?: string) {
    setBusy(true);
    try {
      await actionResetGearColorways({
        gearId,
        mode,
        colorwayId: mode === "applyColorway" ? colorwayId : undefined,
      });
      setColorways([]);
      setResetColorwayId("");
      toast.success(t("resetComplete"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset() {
    if (resetMode === "keepGearImages") {
      await reset("keepGearImages");
      return;
    }

    const colorwayId =
      resetMode === "applyOtherColor"
        ? resetColorwayId
        : (defaultColorway?.id ?? "");
    if (!colorwayId) {
      toast.error(t("saveFailed"));
      return;
    }

    await reset("applyColorway", colorwayId);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {colorways.length
              ? t("descriptionExplicit")
              : t("descriptionImplicit")}
          </DialogDescription>
        </DialogHeader>

        {colorways.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {colorways.map((colorway) => (
                  <SortableColorwayRow
                    key={colorway.id}
                    colorway={colorway}
                    disabled={busy}
                    canDelete={canDelete && colorways.length > 1}
                    labels={{
                      drag: t("drag"),
                      name: t("name"),
                      delete: t("delete"),
                      deleteTitle: t("deleteTitle", { name: colorway.name }),
                      deleteDescription: t("deleteDescription"),
                      cancel: t("cancel"),
                      confirmDelete: t("confirmDelete"),
                    }}
                    swatchLabels={swatchLabels}
                    onUpdate={(values) => updateColorway(colorway, values)}
                    onDelete={() => deleteColorway(colorway.id)}
                  />
                ))}
                <AddColorwayRow
                  disabled={busy}
                  name={name}
                  inputLabel={t("addTitle")}
                  inputPlaceholder={t("namePlaceholder")}
                  actionLabel={t("add")}
                  onNameChange={setName}
                  onSubmit={() => void createOrEnable()}
                />
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="bg-muted/40 rounded-lg border border-dashed p-5">
              <p className="font-medium">{t("implicitTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("implicitDescription")}
              </p>
            </div>
            <AddColorwayRow
              disabled={busy}
              name={name}
              inputLabel={t("enableTitle")}
              inputPlaceholder={t("namePlaceholder")}
              actionLabel={t("enable")}
              onNameChange={setName}
              onSubmit={() => void createOrEnable()}
            />
          </div>
        )}

        <Separator />

        <DialogFooter>
          {colorways.length && canDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                >
                  <RotateCcw data-icon="inline-start" />
                  {t("confirmReset")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("resetConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("resetDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>{t("resetImageChoice")}</Label>
                    <RadioGroup
                      value={resetMode}
                      onValueChange={(value) =>
                        setResetMode(value as ResetDialogMode)
                      }
                    >
                      <label
                        htmlFor="reset-mode-default"
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-4",
                          resetMode === "applyDefaultColor" && "bg-muted/40",
                        )}
                      >
                        <RadioGroupItem
                          id="reset-mode-default"
                          value="applyDefaultColor"
                        />
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">{t("applyAndReset")}</p>
                          <p className="text-muted-foreground text-sm">
                            {t("applyColorwayDescription")}
                          </p>
                        </div>
                      </label>

                      {nonDefaultColorways.length ? (
                        <label
                          htmlFor="reset-mode-other"
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-4",
                            resetMode === "applyOtherColor" && "bg-muted/40",
                          )}
                        >
                          <RadioGroupItem
                            id="reset-mode-other"
                            value="applyOtherColor"
                          />
                          <div className="flex flex-col gap-1">
                            <p className="font-medium">
                              {t("applyOtherColor")}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {t("applyOtherColorDescription")}
                            </p>
                          </div>
                        </label>
                      ) : null}

                      <label
                        htmlFor="reset-mode-restore"
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-4",
                          resetMode === "keepGearImages" && "bg-muted/40",
                        )}
                      >
                        <RadioGroupItem
                          id="reset-mode-restore"
                          value="keepGearImages"
                        />
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">{t("keepGearImages")}</p>
                          <p className="text-muted-foreground text-sm">
                            {t("keepGearImagesDescription")}
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  {resetMode === "applyOtherColor" ? (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reset-colorway-select">
                        {t("chooseColorway")}
                      </Label>
                      <Select
                        value={resetColorwayId}
                        onValueChange={setResetColorwayId}
                      >
                        <SelectTrigger
                          id="reset-colorway-select"
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {nonDefaultColorways.map((colorway) => (
                              <SelectItem key={colorway.id} value={colorway.id}>
                                {colorway.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={() => void confirmReset()}
                  >
                    {t("confirmResetAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddColorwayRow({
  name,
  disabled,
  inputLabel,
  inputPlaceholder,
  actionLabel,
  onNameChange,
  onSubmit,
}: {
  name: string;
  disabled: boolean;
  inputLabel: string;
  inputPlaceholder: string;
  actionLabel: string;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bg-background flex items-center gap-3 rounded-lg border border-dashed p-3 shadow-sm">
      <div
        className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md"
        aria-hidden="true"
      >
        <Plus />
      </div>
      <Input
        id="new-colorway-name"
        aria-label={inputLabel}
        value={name}
        placeholder={inputPlaceholder}
        disabled={disabled}
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <Button
        type="button"
        size="icon"
        disabled={disabled}
        aria-label={actionLabel}
        onClick={onSubmit}
      >
        <Plus />
        <span className="sr-only">{actionLabel}</span>
      </Button>
    </div>
  );
}

function SortableColorwayRow({
  colorway,
  disabled,
  canDelete,
  labels,
  swatchLabels,
  onUpdate,
  onDelete,
}: {
  colorway: GearColorway;
  disabled: boolean;
  canDelete: boolean;
  labels: Record<
    | "drag"
    | "name"
    | "delete"
    | "deleteTitle"
    | "deleteDescription"
    | "cancel"
    | "confirmDelete",
    string
  >;
  swatchLabels: React.ComponentProps<typeof ColorwaySwatchEditor>["labels"];
  onUpdate: (values: {
    name?: string;
    colorA?: string;
    colorB?: string;
  }) => Promise<void>;
  onDelete: () => void;
}) {
  const [draftName, setDraftName] = useState(colorway.name);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: colorway.id, disabled });

  useEffect(() => setDraftName(colorway.name), [colorway.name]);

  async function commitName() {
    const normalized = draftName.trim();
    if (!normalized || normalized === colorway.name) {
      setDraftName(colorway.name);
      return;
    }
    try {
      await onUpdate({ name: normalized });
    } catch {
      setDraftName(colorway.name);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="bg-background flex items-center gap-3 rounded-lg border p-3 shadow-sm"
    >
      <button
        type="button"
        className="text-muted-foreground cursor-grab"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
        <span className="sr-only">{labels.drag}</span>
      </button>
      <ColorwaySwatchEditor
        colorA={colorway.swatchColorA}
        colorB={colorway.swatchColorB}
        labels={swatchLabels}
        disabled={disabled}
        onApply={({ colorA, colorB }) => onUpdate({ colorA, colorB })}
      />
      <Input
        aria-label={labels.name}
        value={draftName}
        disabled={disabled}
        onChange={(event) => setDraftName(event.target.value)}
        onBlur={() => void commitName()}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraftName(colorway.name);
            event.currentTarget.blur();
          }
        }}
      />
      {canDelete ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
            >
              <Trash2 />
              <span className="sr-only">{labels.delete}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{labels.deleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {labels.deleteDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>
                {labels.confirmDelete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
