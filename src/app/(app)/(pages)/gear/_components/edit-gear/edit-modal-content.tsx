"use client";

import { useMemo, useRef, useState } from "react";
import { DialogClose, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { EditGearForm } from "./edit-gear-form";
import {
  Check,
  CheckCircle,
  Circle,
  ChevronRight,
  ArrowRight,
  X,
  ArrowLeft,
} from "lucide-react";
import type { GearItem, CameraSpecs } from "~/types/gear";
import type { GearType } from "~/types/gear";
import { buildEditSidebarSections } from "~/lib/specs/registry";
import { sensorTypeLabel } from "~/lib/mapping/sensor-map";
import { Button } from "~/components/ui/button";

interface EditModalContentProps {
  gearType?: GearType;
  gearSlug: string;
  gearName?: string;
  gearData: GearItem;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestClose: (opts?: { force?: boolean }) => void;
  initialShowMissingOnly?: boolean;
  formId?: string;
}

export function EditModalContent({
  gearType,
  gearSlug,
  gearName,
  gearData,
  onDirtyChange,
  onRequestClose,
  initialShowMissingOnly,
  formId = "edit-gear-form",
}: EditModalContentProps) {
  const [showMissingOnly, setShowMissingOnly] = useState(
    Boolean(initialShowMissingOnly),
  );
  const [isDirty, setIsDirty] = useState(false);

  const preparedData: GearItem = useMemo(() => {
    const hasMountIds = Array.isArray(gearData.mountIds);
    const legacyMountId = gearData.mountId;
    return {
      ...gearData,
      ...(!hasMountIds && { mountIds: legacyMountId ? [legacyMountId] : [] }),
    };
  }, [gearData]);

  // Live form snapshot to drive sidebar state
  const [liveItem, setLiveItem] = useState<GearItem>(preparedData);
  // Keep in sync if the underlying item changes (route change or server refresh)
  if (liveItem !== preparedData) {
    // noop runtime check to avoid unused var; actual sync handled below in memo usage
  }

  // Helpers to check if a field is filled (supports aggregated registry values)
  const isValueFilled = (v: unknown): boolean => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "number") return Number.isFinite(v);
    if (typeof v === "boolean") return true;
    if (v instanceof Date) return !Number.isNaN(v.getTime());
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") {
      for (const val of Object.values(v as Record<string, unknown>)) {
        if (isValueFilled(val)) return true;
      }
      return false;
    }
    return false;
  };

  const isFieldFilled = (key: string, rawValue: unknown): boolean => {
    if (key === "dimensions") {
      const obj = (rawValue || {}) as Record<string, unknown>;
      const isNumLike = (x: unknown) =>
        x != null && !Number.isNaN(Number(x as any));
      return (
        isNumLike(obj.widthMm) &&
        isNumLike(obj.heightMm) &&
        isNumLike(obj.depthMm)
      );
    }
    if (key === "sensorType") {
      const rec =
        rawValue && typeof rawValue === "object"
          ? (rawValue as Partial<
              Pick<
                CameraSpecs,
                | "sensorStackingType"
                | "sensorTechType"
                | "isBackSideIlluminated"
              >
            >)
          : {};
      const stacking =
        typeof rec.sensorStackingType === "string"
          ? rec.sensorStackingType
          : undefined;
      const tech =
        typeof rec.sensorTechType === "string" ? rec.sensorTechType : undefined;
      const bsi =
        typeof rec.isBackSideIlluminated === "boolean"
          ? rec.isBackSideIlluminated
          : undefined;
      const label = sensorTypeLabel({
        sensorStackingType: stacking,
        sensorTechType: tech,
        isBackSideIlluminated: bsi,
      } as unknown as CameraSpecs);
      return label.trim().length > 0;
    }
    return isValueFilled(rawValue);
  };

  type Completion = "empty" | "partial" | "complete";
  const getFieldCompletion = (key: string, rawValue: unknown): Completion => {
    if (key === "dimensions") {
      const obj = (rawValue || {}) as Record<string, unknown>;
      const isNumLike = (x: unknown) =>
        x != null && !Number.isNaN(Number(x as any));
      const count = [obj.widthMm, obj.heightMm, obj.depthMm].filter((v) =>
        isNumLike(v),
      ).length;
      if (count === 0) return "empty";
      if (count === 3) return "complete";
      return "partial";
    }
    if (key === "isoRange") {
      const obj = (rawValue || {}) as Record<string, unknown>;
      const isNumLike = (x: unknown) =>
        x != null && !Number.isNaN(Number(x as any));
      const hasMin = isNumLike(obj.min);
      const hasMax = isNumLike(obj.max);
      if (!hasMin && !hasMax) return "empty";
      if (hasMin && hasMax) return "complete";
      return "partial";
    }
    if (key === "sensorType") {
      const rec =
        rawValue && typeof rawValue === "object"
          ? (rawValue as Partial<
              Pick<
                CameraSpecs,
                | "sensorStackingType"
                | "sensorTechType"
                | "isBackSideIlluminated"
              >
            >)
          : {};
      const hasStacking = rec.sensorStackingType != null;
      const techVal = rec.sensorTechType;
      const hasTech = typeof techVal === "string" && techVal.trim().length > 0;
      const hasBsi = typeof rec.isBackSideIlluminated === "boolean";
      const count = [hasStacking, hasTech, hasBsi].filter(Boolean).length;
      if (count === 0) return "empty";
      if (count === 3) return "complete";
      return "partial";
    }
    return isValueFilled(rawValue) ? "complete" : "empty";
  };

  // Build sidebar sections from centralized spec dictionary
  const sidebarSections = useMemo(
    () => buildEditSidebarSections(liveItem),
    [liveItem],
  );
  // Hide Notes from the sidebar entirely
  const sidebarSectionsFiltered = useMemo(
    () => sidebarSections.filter((s) => s.id !== "notes"),
    [sidebarSections],
  );

  // Track expanded state; collapse sections where all items are filled
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sidebarSectionsFiltered.forEach((section) => {
      const hasFields =
        Array.isArray(section.fields) && section.fields.length > 0;
      const allFilled =
        hasFields &&
        section.fields.every((f) => isFieldFilled(f.key, f.rawValue));
      initial[section.id] = hasFields ? !allFilled : true; // collapse if all filled
    });
    return initial;
  });
  const toggle = (k: string) => setExpanded((s) => ({ ...s, [k]: !s[k] }));

  // Scroll handling inside the form container (so anchors work in modal)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToFieldOrSection = (
    sectionAnchor: string,
    targetId: string,
    fieldKey?: string,
  ) => {
    const container = scrollContainerRef.current;
    const sectionId = sectionAnchor; // already a bare id like "core-section"
    const candidates: string[] = (() => {
      if (fieldKey === "isoRange") return [targetId, "isoMin", "isoMax"];
      if (fieldKey === "dimensions")
        return [targetId, "widthMm", "heightMm", "depthMm"];
      if (fieldKey === "sensorType")
        return [
          targetId,
          "sensorStackingType",
          "sensorTechType",
          "isBackSideIlluminated",
        ];
      if (fieldKey === "viewfinderResolutionMillionDots")
        return [targetId, "viewfinderType"];
      if (fieldKey === "viewfinderMagnification")
        return [targetId, "viewfinderType"];
      return [targetId];
    })();
    const el = (candidates
      .map((id) => document.getElementById(id))
      .find((n) => n) ||
      document.getElementById(sectionId)) as HTMLElement | null;
    if (!el) return;
    // Prefer inputs/selects/comboboxes; fallback to any focusable
    const primarySelector =
      "input,select,textarea,[role='combobox'],[data-sidebar-focus-target='true']";
    const fallbackSelector =
      "button,[role='switch'],[role='slider'],[contenteditable='true'],[tabindex]:not([tabindex='-1'])";
    const focusEl: HTMLElement | null =
      (el.matches(primarySelector)
        ? el
        : (el.querySelector(primarySelector) as HTMLElement | null)) ||
      (el.matches(fallbackSelector)
        ? el
        : (el.querySelector(fallbackSelector) as HTMLElement | null)) ||
      el;
    const doFocus = () => {
      try {
        if (focusEl && typeof focusEl.focus === "function") {
          focusEl.focus({ preventScroll: true } as any);
          if (focusEl.getAttribute("data-sidebar-focus-target") === "true") {
            focusEl.classList.add("force-focus");
            const ringContainer =
              (focusEl.closest(
                "[data-force-ring-container]",
              ) as HTMLElement | null) || null;
            if (ringContainer) ringContainer.classList.add("force-focus");
            setTimeout(() => {
              focusEl.classList.remove("force-focus");
              if (ringContainer) ringContainer.classList.remove("force-focus");
            }, 1200);
          }
        }
      } catch {}
    };
    const headerOffset = 64; // compensate for modal header height and padding
    if (container) {
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = el.getBoundingClientRect().top;
      const offset =
        targetTop - containerTop + container.scrollTop - headerOffset;
      container.scrollTo({ top: offset, behavior: "smooth" });
      requestAnimationFrame(() => doFocus());
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        window.scrollBy({
          top: -headerOffset,
          left: 0,
          behavior: "instant" as any,
        });
      } catch {
        window.scrollBy({ top: -headerOffset, left: 0 });
      }
      requestAnimationFrame(() => doFocus());
    }
  };

  return (
    <div className="flex max-h-[90vh] flex-col">
      <DialogHeader className="border-b p-3">
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="">Edit Gear Item</DialogTitle>
          <div className="flex items-center gap-2">
            {/* dirty indicator */}
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${isDirty ? "opacity-100" : "opacity-0"}`}
              aria-live="polite"
            >
              <span
                className={`h-2 w-2 rounded-full ${/* visual dot */ "bg-amber-500"}`}
              />
              <span className="text-muted-foreground">Unsaved</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRequestClose()}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-border/60 hidden min-h-0 border-r md:block">
          <div className="h-full overflow-y-auto p-3 pb-16">
            <div className="mb-2 font-semibold">{gearName || gearSlug}</div>
            <nav className="space-y-1">
              {sidebarSectionsFiltered.map((section) => {
                const allFilled =
                  Array.isArray(section.fields) &&
                  section.fields.length > 0 &&
                  section.fields.every(
                    (f) => getFieldCompletion(f.key, f.rawValue) === "complete",
                  );
                const fieldsSorted = Array.isArray(section.fields)
                  ? [...section.fields].sort((a, b) =>
                      String(a.label).localeCompare(String(b.label)),
                    )
                  : [];
                const fieldsToRender = showMissingOnly
                  ? fieldsSorted.filter(
                      (f) =>
                        getFieldCompletion(f.key, f.rawValue) !== "complete",
                    )
                  : fieldsSorted;
                if (showMissingOnly && fieldsToRender.length === 0) {
                  return null;
                }
                return (
                  <div key={section.id} className="space-y-1">
                    <button
                      type="button"
                      className="hover:bg-accent/40 flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm"
                      tabIndex={-1}
                      onClick={() => toggle(section.id)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded[section.id] ? "rotate-90" : "rotate-0"}`}
                        />
                        <span className="truncate">{section.title}</span>
                      </span>
                      {allFilled ? (
                        <Check className="text-muted-foreground h-3.5 w-3.5" />
                      ) : null}
                    </button>
                    {expanded[section.id] && (
                      <div className="ml-5 space-y-0.5">
                        {fieldsToRender.map((field) => (
                          <button
                            key={field.key}
                            type="button"
                            onClick={() =>
                              scrollToFieldOrSection(
                                section.anchor,
                                (field as any).targetId || field.key,
                                field.key,
                              )
                            }
                            className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs"
                            tabIndex={-1}
                          >
                            {(() => {
                              const status = getFieldCompletion(
                                field.key,
                                field.rawValue,
                              );
                              if (status === "complete") {
                                return (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                );
                              }
                              if (status === "partial") {
                                return (
                                  <span
                                    aria-hidden
                                    className="h-3.5 w-3.5 rounded-full border border-[#f59e0b] bg-[conic-gradient(#f59e0b_0_50%,transparent_50%_100%)]"
                                  />
                                );
                              }
                              return (
                                <Circle className="text-muted-foreground h-3.5 w-3.5" />
                              );
                            })()}
                            <span className="truncate">{field.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>
        <div
          ref={scrollContainerRef}
          className="min-h-0 overflow-y-auto p-6 pb-36"
        >
          <EditGearForm
            gearType={gearType}
            gearData={preparedData}
            gearSlug={gearSlug}
            onDirtyChange={(dirty) => {
              setIsDirty(dirty);
              onDirtyChange?.(dirty);
            }}
            onRequestClose={onRequestClose}
            showActions={false}
            formId={formId}
            showMissingOnly={showMissingOnly}
            onFormDataChange={(d) => setLiveItem(d as any)}
          />
        </div>
      </div>
      <div className="bg-background border-t px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="edit-modal-show-missing-only">
              Show missing only
            </Label>
            <Switch
              id="edit-modal-show-missing-only"
              checked={showMissingOnly}
              onCheckedChange={setShowMissingOnly}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onRequestClose()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="default"
              icon={<ArrowRight className="size-4" />}
              iconPosition="right"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditModalContent;
