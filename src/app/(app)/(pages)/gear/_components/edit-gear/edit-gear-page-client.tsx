"use client";

import { useMemo, useRef, useState } from "react";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { EditGearForm } from "./edit-gear-form";
import type { GearItem, CameraSpecs } from "~/types/gear";
import { buildEditSidebarSections } from "~/lib/specs/registry";
import { sensorTypeLabel } from "~/lib/mapping/sensor-map";
import { Check, CheckCircle, Circle, ChevronRight } from "lucide-react";

interface Props {
  gearType?: "CAMERA" | "ANALOG_CAMERA" | "LENS";
  gearSlug: string;
  gearData: GearItem;
  initialShowMissingOnly?: boolean;
}

export default function EditGearClient({
  gearType,
  gearSlug,
  gearData,
  initialShowMissingOnly,
}: Props) {
  const [showMissingOnly, setShowMissingOnly] = useState(
    Boolean(initialShowMissingOnly),
  );
  const [isDirty, setIsDirty] = useState(false);

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

  // Normalize item similar to modal (ensure mountIds array exists)
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

  const sidebarSections = useMemo(
    () => buildEditSidebarSections(liveItem),
    [liveItem],
  );
  const sidebarSectionsFiltered = useMemo(
    () => sidebarSections.filter((s) => s.id !== "notes"),
    [sidebarSections],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sidebarSectionsFiltered.forEach((section) => {
      const hasFields = Array.isArray(section.fields) && section.fields.length;
      const allFilled = hasFields
        ? section.fields.every(
            (f) => getFieldCompletion(f.key, f.rawValue) === "complete",
          )
        : false;
      initial[section.id] = hasFields ? !allFilled : true;
    });
    return initial;
  });
  const toggle = (k: string) => setExpanded((s) => ({ ...s, [k]: !s[k] }));

  // Scroll and focus to field/section
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToFieldOrSection = (
    sectionAnchor: string,
    targetId: string,
    fieldKey?: string,
  ) => {
    const container = scrollContainerRef.current;
    const sectionId = sectionAnchor;
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
      document.getElementById(sectionId));
    if (!el) return;
    // Prefer inputs/selects/comboboxes; fallback to any focusable
    const primarySelector =
      "input,select,textarea,[role='combobox'],[data-sidebar-focus-target='true']";
    const fallbackSelector =
      "button,[role='switch'],[role='slider'],[contenteditable='true'],[tabindex]:not([tabindex='-1'])";
    const focusEl: HTMLElement | null =
      (el.matches(primarySelector)
        ? el
        : (el.querySelector(primarySelector))) ||
      (el.matches(fallbackSelector)
        ? el
        : (el.querySelector(fallbackSelector))) ||
      el;
    const headerOffset = 64; // page header spacing
    if (container) {
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = el.getBoundingClientRect().top;
      const offset =
        targetTop - containerTop + container.scrollTop - headerOffset;
      container.scrollTo({ top: offset, behavior: "smooth" });
      requestAnimationFrame(() => {
        try {
          focusEl?.focus({ preventScroll: true } as any);
          if (focusEl?.getAttribute("data-sidebar-focus-target") === "true") {
            focusEl.classList.add("force-focus");
            const ringContainer =
              (focusEl?.closest(
                "[data-force-ring-container]",
              )) || null;
            if (ringContainer) ringContainer.classList.add("force-focus");
            setTimeout(() => {
              focusEl?.classList.remove("force-focus");
              if (ringContainer) ringContainer.classList.remove("force-focus");
            }, 1200);
          }
        } catch {}
      });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.scrollBy({ top: -headerOffset, left: 0, behavior: "auto" });
      requestAnimationFrame(() => {
        try {
          focusEl?.focus({ preventScroll: true } as any);
          if (focusEl?.getAttribute("data-sidebar-focus-target") === "true") {
            focusEl.classList.add("force-focus");
            const ringContainer =
              (focusEl?.closest(
                "[data-force-ring-container]",
              )) || null;
            if (ringContainer) ringContainer.classList.add("force-focus");
            setTimeout(() => {
              focusEl?.classList.remove("force-focus");
              if (ringContainer) ringContainer.classList.remove("force-focus");
            }, 1200);
          }
        } catch {}
      });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="border-b p-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold">Edit Gear Item</h1>
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${isDirty ? "opacity-100" : "opacity-0"}`}
              aria-live="polite"
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Unsaved</span>
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-missing-only">Show missing only</Label>
              <Switch
                id="show-missing-only"
                checked={showMissingOnly}
                onCheckedChange={setShowMissingOnly}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-border/60 hidden border-r md:block">
          <div className="sticky top-24">
            <div className="h-[calc(100vh-6rem)] overflow-y-auto p-3 pb-24">
              <div className="mb-2 font-semibold">
                {gearData.name || gearSlug}
              </div>
              <nav className="space-y-1">
                {sidebarSectionsFiltered.map((section) => {
                  const allFilled =
                    Array.isArray(section.fields) &&
                    section.fields.length > 0 &&
                    section.fields.every(
                      (f) =>
                        getFieldCompletion(f.key, f.rawValue) === "complete",
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
                  if (showMissingOnly && fieldsToRender.length === 0)
                    return null;
                  return (
                    <div key={section.id} className="space-y-1">
                      <button
                        type="button"
                        className="hover:bg-accent/40 flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm"
                        onClick={() => toggle(section.id)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ChevronRight
                            className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${expanded[section.id] ? "rotate-90" : "rotate-0"}`}
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
          </div>
        </aside>
        <div className="p-6 pb-36">
          <EditGearForm
            gearType={gearType}
            gearData={preparedData}
            gearSlug={gearSlug}
            showMissingOnly={showMissingOnly}
            onDirtyChange={setIsDirty}
            onFormDataChange={(d) => setLiveItem(d as unknown as GearItem)}
          />
        </div>
      </div>
    </div>
  );
}
