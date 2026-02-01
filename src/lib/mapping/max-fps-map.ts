import React from "react";
import { cn } from "~/lib/utils";
import { formatShutterType } from "~/lib/mapping";
import type { GearItem } from "~/types/gear";

function safeToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "[Failed to stringify FPS values]";
  }
}

export function normalizeShutterTypeKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const lowered = value.toLowerCase();
  if (lowered === "efcs") return "efc";
  if (["mechanical", "efc", "electronic"].includes(lowered)) return lowered;
  return null;
}

export const shutterTypeShortLabels: Record<string, string> = {
  mechanical: "Mechanical",
  efc: "EFC",
  electronic: "Electronic",
};

export function toNumberOrNull(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function formatFpsText(
  value: number | string | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return undefined;
  return `${n} FPS`;
}

export function renderFpsValue(
  value: number | string | null | undefined,
): React.ReactNode | undefined {
  if (value == null) return undefined;
  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) return undefined;

  return React.createElement(
    "span",
    { className: "inline-flex items-baseline gap-1" },
    React.createElement("span", null, String(numericValue)),
    React.createElement("span", { className: "text-muted-foreground" }, "FPS"),
  );
}

export function renderInlineRawJpg(
  rawValue?: number | string | null,
  jpgValue?: number | string | null,
): React.ReactNode | undefined {
  const rawNode = renderFpsValue(rawValue);
  const jpgNode = renderFpsValue(jpgValue);

  if (rawNode && jpgNode) {
    const rawNumeric =
      typeof rawValue === "number" ? rawValue : Number(rawValue);
    const jpgNumeric =
      typeof jpgValue === "number" ? jpgValue : Number(jpgValue);
    if (Number.isFinite(rawNumeric) && Number.isFinite(jpgNumeric)) {
      if (rawNumeric === jpgNumeric) return rawNode;
    }
    return React.createElement(
      "span",
      { className: "inline-flex items-center gap-1" },
      React.createElement("span", null, rawNode),
      React.createElement(
        "span",
        { className: "text-muted-foreground" },
        "(Raw)",
      ),
      React.createElement("span", { className: "text-muted-foreground" }, "/"),
      React.createElement("span", null, jpgNode),
      React.createElement(
        "span",
        { className: "text-muted-foreground" },
        "(JPG)",
      ),
    );
  }
  if (rawNode) {
    return React.createElement(
      "span",
      { className: "inline-flex items-center gap-1" },
      React.createElement("span", null, rawNode),
      React.createElement(
        "span",
        { className: "text-muted-foreground" },
        "(Raw)",
      ),
    );
  }
  if (jpgNode) {
    return React.createElement(
      "span",
      { className: "inline-flex items-center gap-1" },
      React.createElement("span", null, jpgNode),
      React.createElement(
        "span",
        { className: "text-muted-foreground" },
        "(JPG)",
      ),
    );
  }
  return undefined;
}

export function formatPerShutterValue(
  rawValue: number | null | undefined,
  jpgValue: number | null | undefined,
): React.ReactNode | undefined {
  const rawNode = renderFpsValue(rawValue);
  const jpgNode = renderFpsValue(jpgValue);
  if (rawNode && jpgNode) {
    if (rawValue != null && jpgValue != null && rawValue === jpgValue) {
      return React.createElement("span", { className: "font-medium" }, rawNode);
    }
    return React.createElement(
      "div",
      { className: "flex flex-col items-end gap-0.5 text-right" },
      React.createElement(
        "span",
        { className: "inline-flex items-center gap-1 font-medium" },
        rawNode,
        React.createElement(
          "span",
          { className: "text-muted-foreground" },
          "(Raw)",
        ),
      ),
      React.createElement(
        "span",
        { className: "inline-flex items-center gap-1 font-medium" },
        jpgNode,
        React.createElement(
          "span",
          { className: "text-muted-foreground" },
          "(JPG)",
        ),
      ),
    );
  }
  if (rawNode) {
    return React.createElement(
      "span",
      { className: "inline-flex items-center gap-1 font-medium" },
      rawNode,
      React.createElement(
        "span",
        { className: "text-muted-foreground" },
        "(Raw)",
      ),
    );
  }
  if (jpgNode) {
    return React.createElement(
      "span",
      { className: "inline-flex items-center gap-1 font-medium" },
      jpgNode,
      React.createElement(
        "span",
        { className: "text-muted-foreground" },
        "(JPG)",
      ),
    );
  }
  return undefined;
}

export function buildPerShutterFpsEntries(
  perShutterValue: unknown,
  availableShutters: string[],
): {
  shutterType: string;
  raw: number | null | undefined;
  jpg: number | null | undefined;
}[] {
  if (!perShutterValue || typeof perShutterValue !== "object") return [];
  const availableNormalized = (availableShutters ?? [])
    .map((shutterType) => normalizeShutterTypeKey(shutterType))
    .filter((shutterType): shutterType is string => Boolean(shutterType));
  const ordering =
    availableNormalized.length > 0
      ? availableNormalized
      : Object.keys(perShutterValue as Record<string, unknown>);
  const seen = new Set<string>();
  const entries: {
    shutterType: string;
    raw: number | null | undefined;
    jpg: number | null | undefined;
  }[] = [];

  for (const shutterKey of ordering) {
    const normalizedKey = normalizeShutterTypeKey(shutterKey);
    if (!normalizedKey || seen.has(normalizedKey)) continue;
    const rawEntry =
      (perShutterValue as Record<string, unknown>)[shutterKey] ??
      (perShutterValue as Record<string, unknown>)[normalizedKey] ??
      (normalizedKey === "efc"
        ? (perShutterValue as Record<string, unknown>).efcs
        : undefined);
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const rawValue = toNumberOrNull((rawEntry as Record<string, unknown>).raw);
    const jpgValue = toNumberOrNull((rawEntry as Record<string, unknown>).jpg);
    if (rawValue === null && jpgValue === null) continue;
    entries.push({
      shutterType: normalizedKey,
      raw: rawValue,
      jpg: jpgValue,
    });
    seen.add(normalizedKey);
  }

  return entries;
}

export function formatShutterLabel(shutterType: string): string {
  return (
    shutterTypeShortLabels[shutterType] ??
    formatShutterType(shutterType) ??
    shutterType
  );
}

export function formatMaxFpsPlain(value: unknown): string {
  if (!value || typeof value !== "object") return safeToString(value);
  const entries: string[] = [];
  for (const [rawKey, rawEntry] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const normalizedKey = normalizeShutterTypeKey(rawKey) ?? rawKey;
    const label = formatShutterLabel(normalizedKey);
    const entryObj = rawEntry as { raw?: unknown; jpg?: unknown };
    const rawText =
      entryObj.raw === undefined ? null : formatFpsText(entryObj.raw as any);
    const jpgText =
      entryObj.jpg === undefined ? null : formatFpsText(entryObj.jpg as any);
    let combined = "";
    if (rawText && jpgText) {
      combined =
        rawText === jpgText ? rawText : `${rawText} (Raw), ${jpgText} (JPG)`;
    } else if (rawText) {
      combined = `${rawText} (Raw)`;
    } else if (jpgText) {
      combined = `${jpgText} (JPG)`;
    }
    if (combined.length === 0) continue;
    entries.push(`${label}: ${combined}`);
  }
  return entries.length ? entries.join("; ") : safeToString(value);
}

export function formatSingleShutterInline(
  rawValue: number | null | undefined,
  jpgValue: number | null | undefined,
): React.ReactNode | undefined {
  const content = renderInlineRawJpg(
    rawValue ?? undefined,
    jpgValue ?? undefined,
  );
  if (!content) return undefined;
  return React.createElement("span", { className: "font-medium" }, content);
}

export function formatMaxFpsDisplay(
  item: GearItem,
): React.ReactNode | undefined {
  const availableShutters = Array.isArray(
    item.cameraSpecs?.availableShutterTypes,
  )
    ? (item.cameraSpecs?.availableShutterTypes as string[])
    : [];
  const perShutterEntries = buildPerShutterFpsEntries(
    item.cameraSpecs?.maxFpsByShutter,
    availableShutters,
  );
  const fallbackRaw = toNumberOrNull(item.cameraSpecs?.maxFpsRaw);
  const fallbackJpg = toNumberOrNull(item.cameraSpecs?.maxFpsJpg);

  const shutterTypesForCount =
    availableShutters.length > 0
      ? availableShutters
      : perShutterEntries.map((entry) => entry.shutterType);

  if (shutterTypesForCount.length === 1) {
    const normalizedSingle = normalizeShutterTypeKey(shutterTypesForCount[0]);
    const entry =
      perShutterEntries.find(
        (candidate) =>
          normalizeShutterTypeKey(candidate.shutterType) === normalizedSingle,
      ) ?? perShutterEntries[0];
    const rawValue = entry?.raw ?? fallbackRaw;
    const jpgValue = entry?.jpg ?? fallbackJpg;
    return formatSingleShutterInline(rawValue, jpgValue);
  }

  if (perShutterEntries.length > 0) {
    return React.createElement(
      "div",
      { className: "flex flex-col gap-1" },
      perShutterEntries.map((entry, index) => {
        const valueText = formatPerShutterValue(entry.raw, entry.jpg);
        if (!valueText) return null;
        const label = formatShutterLabel(entry.shutterType);
        return React.createElement(
          "div",
          {
            key: entry.shutterType,
            className: cn(
              "flex w-full items-start gap-12",
              index > 0 ? "border-border mt-1 border-t pt-1" : "",
            ),
          },
          React.createElement(
            "span",
            { className: "text-muted-foreground" },
            label,
          ),
          React.createElement(
            "span",
            { className: "flex-1 text-right" },
            valueText,
          ),
        );
      }),
    );
  }

  const fallbackText = formatPerShutterValue(fallbackRaw, fallbackJpg);
  if (fallbackText) {
    // This value renders the unit internally, so we do not add a redundant label.
    return React.createElement(
      "div",
      { className: "flex items-center justify-end" },
      fallbackText,
    );
  }

  return renderInlineRawJpg(fallbackRaw ?? undefined, fallbackJpg ?? undefined);
}
