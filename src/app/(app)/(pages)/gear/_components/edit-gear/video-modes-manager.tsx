"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  COMMON_VIDEO_RESOLUTIONS,
  VIDEO_FRAME_RATES,
  VIDEO_COLOR_DEPTHS,
} from "~/lib/constants/video-constants";
import { Loader, Trash2, Plus, Crop } from "lucide-react";
import { toast } from "sonner";
import { MultiSelect } from "~/components/ui/multi-select";
import { VideoBitDepthMatrix } from "./video-bit-depth-matrix";
import {
  videoModeInputSchema,
  normalizeVideoModes,
  slugifyResolutionKey,
  type VideoModeNormalized,
  type VideoModeInput,
  videoModesEqual,
  normalizedToCameraVideoModes,
} from "~/lib/video/mode-schema";
import { buildVideoDisplayBundle } from "~/lib/video/transform";
import { VideoSpecsSummary } from "../video/video-summary";
import type { CameraVideoMode } from "~/types/gear";

type EditableVideoMode = {
  id: string;
  resolutionKey: string;
  resolutionLabel: string;
  resolutionHorizontal: number | null;
  resolutionVertical: number | null;
  fps: number;
  codecLabel: string;
  bitDepth: number;
  cropFactor: boolean;
  notes: string;
};

type GuidedResolution = {
  key: string;
  label: string;
  horizontal: number | null;
  vertical: number | null;
};

type CodecPair = {
  id: string;
  label: string;
  bitDepth: number;
};

type GuidedAssignments = Record<string, Record<string, number>>;
type GuidedCropFactors = Record<string, Record<string, boolean>>;
type GuidedFpsSelections = Record<string, number[]>;

const FRAME_RATE_VALUES = VIDEO_FRAME_RATES.map((rate) => Number(rate.value));

const COLOR_DEPTH_VALUES = VIDEO_COLOR_DEPTHS.map((depth) =>
  Number(depth.value),
);

const PRESET_RESOLUTIONS: GuidedResolution[] = COMMON_VIDEO_RESOLUTIONS.map(
  (resolution) => ({
    key: slugifyResolutionKey(resolution.label),
    label: resolution.label,
    horizontal: resolution.horizontalPixels ?? null,
    vertical: resolution.verticalPixels ?? null,
  }),
);

const PRESET_RESOLUTION_MAP = new Map<string, GuidedResolution>(
  PRESET_RESOLUTIONS.map((resolution) => [resolution.key, resolution]),
);

const DEFAULT_CODEC_PAIR: CodecPair = {
  id: createId(),
  label: "H.265",
  bitDepth: 10,
};

function sortCodecPairsDesc(list: CodecPair[]): CodecPair[] {
  return [...list].sort((a, b) => {
    if (b.bitDepth !== a.bitDepth) return b.bitDepth - a.bitDepth;
    return a.label.localeCompare(b.label);
  });
}

function createId() {
  return Math.random().toString(36).slice(2, 9);
}

type VideoModeLike = {
  id?: string;
  gearId?: string;
  resolutionKey?: string | null;
  resolutionLabel?: string | null;
  resolutionHorizontal?: number | null;
  resolutionVertical?: number | null;
  fps?: number | string | null;
  codecLabel?: string | null;
  bitDepth?: number | string | null;
  cropFactor?: boolean | string | number | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

function toSchemaInput(mode: VideoModeLike) {
  return {
    resolutionKey: mode.resolutionKey ?? undefined,
    resolutionLabel: mode.resolutionLabel?.trim().length
      ? mode.resolutionLabel
      : (mode.resolutionKey ?? "Custom"),
    resolutionHorizontal:
      mode.resolutionHorizontal === undefined
        ? null
        : mode.resolutionHorizontal,
    resolutionVertical:
      mode.resolutionVertical === undefined ? null : mode.resolutionVertical,
    fps: mode.fps ?? 0,
    codecLabel: mode.codecLabel ?? "",
    bitDepth: mode.bitDepth ?? 0,
    cropFactor: mode.cropFactor ?? false,
    notes: mode.notes ?? null,
  };
}

function normalizeVideoModesFromLike(
  list: VideoModeLike[],
): VideoModeNormalized[] {
  const parsed: VideoModeInput[] = [];
  list.forEach((mode) => {
    const result = videoModeInputSchema.safeParse(toSchemaInput(mode));
    if (result.success) {
      parsed.push(result.data);
    }
  });
  return normalizeVideoModes(parsed);
}

function coerceCameraVideoModes(list: VideoModeLike[]): CameraVideoMode[] {
  return list.map((mode, index) => {
    if (
      typeof mode.gearId === "string" &&
      typeof mode.codecLabel === "string" &&
      typeof mode.bitDepth === "number" &&
      typeof mode.fps === "number"
    ) {
      return mode as CameraVideoMode;
    }
    return {
      id: mode.id ?? `preview-${index}`,
      gearId: mode.gearId ?? "preview",
      resolutionKey:
        mode.resolutionKey ??
        slugifyResolutionKey(mode.resolutionLabel ?? "custom"),
      resolutionLabel:
        mode.resolutionLabel ??
        mode.resolutionKey ??
        slugifyResolutionKey("custom"),
      resolutionHorizontal:
        mode.resolutionHorizontal != null
          ? Number(mode.resolutionHorizontal)
          : null,
      resolutionVertical:
        mode.resolutionVertical != null
          ? Number(mode.resolutionVertical)
          : null,
      fps: Number(mode.fps ?? 0),
      codecLabel: mode.codecLabel ?? "Unknown",
      bitDepth: Number(mode.bitDepth ?? 0),
      cropFactor: Boolean(mode.cropFactor),
      notes: mode.notes ?? null,
      createdAt: mode.createdAt instanceof Date ? mode.createdAt : new Date(0),
      updatedAt: mode.updatedAt instanceof Date ? mode.updatedAt : new Date(0),
    } as CameraVideoMode;
  });
}

function serializeGuidedModes(
  modes: EditableVideoMode[],
): VideoModeNormalized[] {
  const parsed: VideoModeInput[] = [];
  modes.forEach((mode) => {
    const result = videoModeInputSchema.safeParse({
      resolutionKey: mode.resolutionKey,
      resolutionLabel: mode.resolutionLabel,
      resolutionHorizontal: mode.resolutionHorizontal,
      resolutionVertical: mode.resolutionVertical,
      fps: mode.fps,
      codecLabel: mode.codecLabel,
      bitDepth: mode.bitDepth,
      cropFactor: mode.cropFactor,
      notes: mode.notes,
    });
    if (result.success) {
      parsed.push(result.data);
    }
  });
  return normalizeVideoModes(parsed);
}

function normalizeInitialRows(
  initialModes?: VideoModeLike[] | null,
): EditableVideoMode[] {
  if (!initialModes?.length) return [];
  return initialModes.map((mode) => ({
    id: createId(),
    resolutionKey:
      mode.resolutionKey ??
      slugifyResolutionKey(mode.resolutionLabel ?? "mode"),
    resolutionLabel:
      mode.resolutionLabel ??
      mode.resolutionKey ??
      slugifyResolutionKey("custom"),
    resolutionHorizontal:
      mode.resolutionHorizontal != null
        ? Number(mode.resolutionHorizontal)
        : null,
    resolutionVertical:
      mode.resolutionVertical != null ? Number(mode.resolutionVertical) : null,
    fps: Number(mode.fps ?? 0),
    codecLabel: mode.codecLabel ?? "",
    bitDepth: Number(mode.bitDepth ?? 0),
    cropFactor:
      typeof mode.cropFactor === "boolean"
        ? mode.cropFactor
        : Boolean(mode.cropFactor),
    notes: mode.notes ?? "",
  }));
}

function deriveInitialGuidedResolutions(
  rows: EditableVideoMode[],
): GuidedResolution[] {
  if (!rows.length) return [];
  const map = new Map<string, GuidedResolution>();
  for (const row of rows) {
    if (!map.has(row.resolutionKey)) {
      map.set(row.resolutionKey, {
        key: row.resolutionKey,
        label: row.resolutionLabel,
        horizontal: row.resolutionHorizontal,
        vertical: row.resolutionVertical,
      });
    }
  }
  return Array.from(map.values());
}

function deriveInitialFpsSelections(
  rows: EditableVideoMode[],
): GuidedFpsSelections {
  const selections: GuidedFpsSelections = {};
  for (const row of rows) {
    selections[row.resolutionKey] = selections[row.resolutionKey] ?? [];
    const list = selections[row.resolutionKey]!;
    if (!list.includes(row.fps)) {
      list.push(row.fps);
    }
  }
  return selections;
}

function deriveInitialCodecPairs(rows: EditableVideoMode[]): CodecPair[] {
  const pairs: CodecPair[] = [];
  const seen = new Map<string, string>();
  for (const row of rows) {
    const key = `${row.codecLabel}-${row.bitDepth}`;
    if (seen.has(key)) continue;
    const id = createId();
    seen.set(key, id);
    pairs.push({
      id,
      label: row.codecLabel,
      bitDepth: row.bitDepth,
    });
  }
  if (pairs.length === 0) return [DEFAULT_CODEC_PAIR];
  return sortCodecPairsDesc(pairs);
}

function deriveInitialAssignments(
  rows: EditableVideoMode[],
  codecPairs: CodecPair[],
): GuidedAssignments {
  const assignments: GuidedAssignments = {};
  for (const row of rows) {
    const resolutionKey = row.resolutionKey;
    assignments[resolutionKey] = assignments[resolutionKey] ?? {};
    const bucket = assignments[resolutionKey]!;
    const fpsKey = String(row.fps);
    const bitDepth = Number(row.bitDepth) || 0;
    const current = bucket[fpsKey];
    bucket[fpsKey] = current == null ? bitDepth : Math.max(current, bitDepth);
  }
  return assignments;
}

function deriveInitialCropFactors(
  rows: EditableVideoMode[],
): GuidedCropFactors {
  const crop: GuidedCropFactors = {};
  for (const row of rows) {
    if (!row.cropFactor) continue;
    const key = row.resolutionKey;
    crop[key] = crop[key] ?? {};
    const bucket = crop[key]!;
    bucket[String(row.fps)] = true;
  }
  return crop;
}

function resolveAssignedCodecIds(
  assignments: GuidedAssignments,
  resolutionKey: string,
  fps: number,
  codecPairs: CodecPair[],
  maxBitDepth: number,
): string[] {
  const threshold = assignments[resolutionKey]?.[String(fps)] ?? maxBitDepth;
  return codecPairs
    .filter((pair) => pair.bitDepth <= threshold)
    .map((pair) => pair.id);
}

function generateGuidedPreview(
  resolutions: GuidedResolution[],
  fpsSelections: GuidedFpsSelections,
  codecPairs: CodecPair[],
  assignments: GuidedAssignments,
  cropFactors: GuidedCropFactors,
): EditableVideoMode[] {
  if (!resolutions.length || !codecPairs.length) return [];
  const codecMap = new Map(codecPairs.map((pair) => [pair.id, pair]));

  const preview: EditableVideoMode[] = [];
  const maxBitDepth =
    codecPairs.reduce(
      (acc, pair) => (pair.bitDepth > acc ? pair.bitDepth : acc),
      codecPairs[0]?.bitDepth ?? 0,
    ) || 0;
  for (const resolution of resolutions) {
    const fpsList = fpsSelections[resolution.key] ?? [];
    for (const fps of fpsList) {
      const assignedList = resolveAssignedCodecIds(
        assignments,
        resolution.key,
        fps,
        codecPairs,
        maxBitDepth,
      );
      let bestCodec: CodecPair | null = null;
      for (const codecId of assignedList) {
        const pair = codecMap.get(codecId);
        if (!pair) continue;
        if (!bestCodec || pair.bitDepth > bestCodec.bitDepth) {
          bestCodec = pair;
        }
      }
      const codec = bestCodec ?? codecMap.get(codecPairs[0]!.id ?? "");
      if (!codec) continue;
      const isCropped = cropFactors[resolution.key]?.[String(fps)] === true;
      preview.push({
        id: createId(),
        resolutionKey: resolution.key,
        resolutionLabel: resolution.label,
        resolutionHorizontal: resolution.horizontal,
        resolutionVertical: resolution.vertical,
        fps,
        codecLabel: codec.label,
        bitDepth: codec.bitDepth,
        cropFactor: isCropped,
        notes: "",
      });
    }
  }
  return preview;
}

function generateGuidedModesDetailed(
  resolutions: GuidedResolution[],
  fpsSelections: GuidedFpsSelections,
  codecPairs: CodecPair[],
  assignments: GuidedAssignments,
  cropFactors: GuidedCropFactors,
): EditableVideoMode[] {
  if (!resolutions.length || !codecPairs.length) return [];
  const codecMap = new Map<string, CodecPair>();
  for (const pair of codecPairs) codecMap.set(pair.id, pair);
  const maxBitDepth =
    codecPairs.reduce(
      (acc, pair) => (pair.bitDepth > acc ? pair.bitDepth : acc),
      codecPairs[0]?.bitDepth ?? 0,
    ) || 0;
  const modes: EditableVideoMode[] = [];
  for (const resolution of resolutions) {
    const fpsList = fpsSelections[resolution.key] ?? [];
    for (const fps of fpsList) {
      const assignedList = resolveAssignedCodecIds(
        assignments,
        resolution.key,
        fps,
        codecPairs,
        maxBitDepth,
      );
      for (const codecId of assignedList) {
        const codec = codecMap.get(codecId);
        if (!codec) continue;
        const isCropped = cropFactors[resolution.key]?.[String(fps)] === true;
        modes.push({
          id: createId(),
          resolutionKey: resolution.key,
          resolutionLabel: resolution.label,
          resolutionHorizontal: resolution.horizontal,
          resolutionVertical: resolution.vertical,
          fps,
          codecLabel: codec.label,
          bitDepth: codec.bitDepth,
          cropFactor: isCropped,
          notes: "",
        });
      }
    }
  }
  return modes;
}

interface VideoModesManagerProps {
  value?: VideoModeLike[] | null;
  initialModes?: VideoModeLike[] | null;
  onChange: (modes: VideoModeNormalized[]) => void;
}

export function VideoModesManager({
  value,
  initialModes,
  onChange,
}: VideoModesManagerProps) {
  const [open, setOpen] = useState(false);

  const seedRows = useMemo(
    () => normalizeInitialRows(value?.length ? value : (initialModes ?? [])),
    [initialModes, value],
  );
  const seedCodecPairs = useMemo(() => {
    const derived = deriveInitialCodecPairs(seedRows);
    return derived.length ? derived : [DEFAULT_CODEC_PAIR];
  }, [seedRows]);

  const [guidedResolutions, setGuidedResolutions] = useState<
    GuidedResolution[]
  >(() => deriveInitialGuidedResolutions(seedRows));
  const [fpsSelections, setFpsSelections] = useState<GuidedFpsSelections>(() =>
    deriveInitialFpsSelections(seedRows),
  );
  const [codecPairs, setCodecPairs] = useState<CodecPair[]>(() =>
    sortCodecPairsDesc(seedCodecPairs),
  );
  const [codecAssignments, setCodecAssignments] = useState<GuidedAssignments>(
    () => deriveInitialAssignments(seedRows, seedCodecPairs),
  );
  const [cropAssignments, setCropAssignments] = useState<GuidedCropFactors>(
    () => deriveInitialCropFactors(seedRows),
  );
  const [customResolution, setCustomResolution] = useState<{
    label: string;
    horizontal: string;
    vertical: string;
  }>({ label: "", horizontal: "", vertical: "" });
  const [isApplying, setIsApplying] = useState(false);
  const baselineRawRef = useRef<VideoModeLike[]>([]);
  const baselineNormalizedRef = useRef<VideoModeNormalized[]>([]);

  const stagedNormalized = useMemo(() => {
    const source = value?.length
      ? value
      : initialModes?.length
        ? initialModes
        : [];
    return normalizeVideoModesFromLike(source);
  }, [initialModes, value]);

  const stagedBundle = useMemo(() => {
    if (!stagedNormalized.length) return null;
    return buildVideoDisplayBundle(
      normalizedToCameraVideoModes(stagedNormalized),
    );
  }, [stagedNormalized]);

  const hydrateFromValue = useCallback((source?: VideoModeLike[] | null) => {
    const safeSource = [...(source ?? [])];
    baselineRawRef.current = safeSource;
    baselineNormalizedRef.current = normalizeVideoModesFromLike(safeSource);
    const normalizedRows = normalizeInitialRows(safeSource);
    const derivedPairs = deriveInitialCodecPairs(normalizedRows);
    const safePairs = derivedPairs.length ? derivedPairs : [DEFAULT_CODEC_PAIR];
    setGuidedResolutions(deriveInitialGuidedResolutions(normalizedRows));
    setFpsSelections(deriveInitialFpsSelections(normalizedRows));
    setCodecPairs(sortCodecPairsDesc(safePairs));
    setCodecAssignments(deriveInitialAssignments(normalizedRows, safePairs));
    setCropAssignments(deriveInitialCropFactors(normalizedRows));
  }, []);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const source = value?.length
        ? value
        : initialModes?.length
          ? initialModes
          : [];
      hydrateFromValue(source);
    }
    prevOpenRef.current = open;
  }, [open, value, initialModes, hydrateFromValue]);

  const stagedModesCount = useMemo(() => {
    if (Array.isArray(value) && value.length) return value.length;
    if (Array.isArray(initialModes) && initialModes.length)
      return initialModes.length;
    return 0;
  }, [initialModes, value]);

  const applyResolutionState = (
    nextResolutions: GuidedResolution[],
    newlyAddedKeys: string[] = [],
  ) => {
    setGuidedResolutions(nextResolutions);
    const nextKeysSet = new Set(
      nextResolutions.map((resolution) => resolution.key),
    );
    setFpsSelections((prev) => {
      const next = { ...prev };
      for (const key of newlyAddedKeys) {
        if (!next[key]) {
          next[key] = FRAME_RATE_VALUES.slice(0, 2);
        }
      }
      for (const key of Object.keys(next)) {
        if (!nextKeysSet.has(key)) {
          delete next[key];
        }
      }
      return next;
    });
    setCodecAssignments((prev) => {
      const next: GuidedAssignments = {};
      const source: GuidedAssignments = prev ?? {};
      for (const key of Object.keys(source)) {
        if (nextKeysSet.has(key)) {
          const bucket = source[key] ?? {};
          const cloned: Record<string, number> = {};
          for (const fpsKey of Object.keys(bucket)) {
            const value = bucket[fpsKey];
            if (typeof value === "number") {
              cloned[fpsKey] = value;
            }
          }
          next[key] = cloned;
        }
      }
      return next;
    });
    setCropAssignments((prev) => {
      const next: GuidedCropFactors = {};
      for (const key of Object.keys(prev ?? {})) {
        if (nextKeysSet.has(key)) {
          next[key] = { ...(prev?.[key] ?? {}) };
        }
      }
      return next;
    });
  };

  const guidedPreview = useMemo(
    () =>
      generateGuidedPreview(
        guidedResolutions,
        fpsSelections,
        codecPairs,
        codecAssignments,
        cropAssignments,
      ),
    [
      guidedResolutions,
      fpsSelections,
      codecPairs,
      codecAssignments,
      cropAssignments,
    ],
  );

  const guidedDetailedModes = useMemo(
    () =>
      generateGuidedModesDetailed(
        guidedResolutions,
        fpsSelections,
        codecPairs,
        codecAssignments,
        cropAssignments,
      ),
    [
      guidedResolutions,
      fpsSelections,
      codecPairs,
      codecAssignments,
      cropAssignments,
    ],
  );

  const currentNormalized = useMemo(
    () => serializeGuidedModes(guidedDetailedModes),
    [guidedDetailedModes],
  );

  const hasLocalChanges = useMemo(
    () => !videoModesEqual(currentNormalized, baselineNormalizedRef.current),
    [currentNormalized],
  );

  const presetOptions = useMemo(
    () =>
      PRESET_RESOLUTIONS.map((resolution) => ({
        id: resolution.key,
        name: resolution.label,
      })),
    [],
  );

  const fpsOptions = useMemo(
    () =>
      FRAME_RATE_VALUES.map((fps) => ({
        id: String(fps),
        name: `${fps} fps`,
      })),
    [],
  );

  const bitDepthOptions = useMemo(() => {
    const unique = Array.from(new Set(codecPairs.map((pair) => pair.bitDepth)));
    if (unique.length === 0) return [DEFAULT_CODEC_PAIR.bitDepth];
    unique.sort((a, b) => b - a);
    return unique;
  }, [codecPairs]);
  const maxAvailableBitDepth =
    bitDepthOptions[0] ?? DEFAULT_CODEC_PAIR.bitDepth;

  const hasMatrixData = useMemo(
    () =>
      guidedResolutions.some(
        (resolution) => (fpsSelections[resolution.key] ?? []).length > 0,
      ),
    [guidedResolutions, fpsSelections],
  );

  const presetSelectedKeys = useMemo(
    () =>
      guidedResolutions
        .filter((resolution) => PRESET_RESOLUTION_MAP.has(resolution.key))
        .map((resolution) => resolution.key),
    [guidedResolutions],
  );

  const handlePresetSelectionChange = (keys: string[]) => {
    const uniqueKeys = Array.from(new Set(keys));
    const previousKeys = new Set(
      guidedResolutions.map((resolution) => resolution.key),
    );
    const addedKeys = uniqueKeys.filter((key) => !previousKeys.has(key));
    const customResolutions = guidedResolutions.filter(
      (resolution) => !PRESET_RESOLUTION_MAP.has(resolution.key),
    );
    const nextPresetResolutions = uniqueKeys
      .map((key) => PRESET_RESOLUTION_MAP.get(key))
      .filter((resolution): resolution is GuidedResolution =>
        Boolean(resolution),
      );
    const nextResolutions = [...nextPresetResolutions, ...customResolutions];
    applyResolutionState(nextResolutions, addedKeys);
  };

  const addCustomResolution = () => {
    if (!customResolution.label.trim()) return;
    const key = slugifyResolutionKey(customResolution.label);
    const numericWidth = Number(customResolution.horizontal);
    const numericHeight = Number(customResolution.vertical);
    const resolution: GuidedResolution = {
      key,
      label: customResolution.label.trim(),
      horizontal: Number.isFinite(numericWidth) ? numericWidth : null,
      vertical: Number.isFinite(numericHeight) ? numericHeight : null,
    };
    applyResolutionState([...guidedResolutions, resolution], [resolution.key]);
    setCustomResolution({ label: "", horizontal: "", vertical: "" });
  };

  const customResolutions = useMemo(
    () =>
      guidedResolutions.filter(
        (resolution) => !PRESET_RESOLUTION_MAP.has(resolution.key),
      ),
    [guidedResolutions],
  );

  const handleMaxBitDepthChange = (
    resolutionKey: string,
    fps: number,
    value: string,
  ) => {
    const fpsKey = String(fps);
    const parsed = Number(value);
    const selectedDepth = Number.isFinite(parsed)
      ? parsed
      : maxAvailableBitDepth;
    setCodecAssignments((prev) => {
      const next: GuidedAssignments = { ...(prev ?? {}) };
      const bucket = { ...(next[resolutionKey] ?? {}) };
      if (!Number.isFinite(selectedDepth) || selectedDepth <= 0) {
        delete bucket[fpsKey];
      } else {
        bucket[fpsKey] = selectedDepth;
      }
      if (Object.keys(bucket).length === 0) {
        delete next[resolutionKey];
      } else {
        next[resolutionKey] = bucket;
      }
      return next;
    });
  };

  const updateCustomResolutionField = (
    key: string,
    field: "label" | "horizontal" | "vertical",
    value: string,
  ) => {
    setGuidedResolutions((prev) =>
      prev.map((resolution) => {
        if (resolution.key !== key) return resolution;
        if (field === "label") {
          return { ...resolution, label: value };
        }
        if (!value.trim()) {
          return { ...resolution, [field]: null };
        }
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return { ...resolution, [field]: parsed };
        }
        return resolution;
      }),
    );
  };

  const removeCustomResolution = (key: string) => {
    const nextResolutions = guidedResolutions.filter(
      (resolution) => resolution.key !== key,
    );
    applyResolutionState(nextResolutions);
  };

  const handleFpsSelectionChange = (resolutionKey: string, ids: string[]) => {
    const values = ids
      .map((id) => Number(id))
      .filter((value) => Number.isFinite(value));
    const selectedSet = new Set(values.map((value) => String(value)));
    setFpsSelections((prev) => ({
      ...prev,
      [resolutionKey]: values,
    }));
    setCodecAssignments((prev) => {
      const next: GuidedAssignments = { ...(prev ?? {}) };
      const bucket = { ...(next[resolutionKey] ?? {}) };
      let changed = false;
      for (const key of Object.keys(bucket)) {
        if (!selectedSet.has(key)) {
          delete bucket[key];
          changed = true;
        }
      }
      if (changed) {
        if (Object.keys(bucket).length === 0) {
          delete next[resolutionKey];
        } else {
          next[resolutionKey] = bucket;
        }
      }
      return next;
    });
    setCropAssignments((prev) => {
      const next: GuidedCropFactors = { ...(prev ?? {}) };
      const bucket = { ...(next[resolutionKey] ?? {}) };
      let changed = false;
      for (const key of Object.keys(bucket)) {
        if (!selectedSet.has(key)) {
          delete bucket[key];
          changed = true;
        }
      }
      if (changed) {
        if (Object.keys(bucket).length === 0) {
          delete next[resolutionKey];
        } else {
          next[resolutionKey] = bucket;
        }
      }
      return next;
    });
  };

  const handleCodecPairChange = (
    id: string,
    field: keyof CodecPair,
    value: string,
  ) => {
    setCodecPairs((prev) =>
      sortCodecPairsDesc(
        prev.map((pair) =>
          pair.id === id
            ? {
                ...pair,
                [field]: field === "bitDepth" ? Number(value) || 0 : value,
              }
            : pair,
        ),
      ),
    );
  };

  const applyModesToForm = async () => {
    try {
      setIsApplying(true);
      if (!currentNormalized.length) {
        toast.info("Add at least one resolution/FPS pairing to continue");
        return;
      }
      onChange(currentNormalized);
      toast.success("Video modes staged. Submit the gear form to apply.");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to stage video modes",
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    hydrateFromValue(baselineRawRef.current);
  };

  return (
    <>
      <div
        id="video-modes-manager"
        data-sidebar-focus-target="true"
        tabIndex={-1}
        className="flex flex-col gap-4 rounded-md border p-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Video Modes</div>
            <div className="text-muted-foreground text-xs">
              {stagedModesCount
                ? `${stagedModesCount} mode${stagedModesCount === 1 ? "" : "s"} configured`
                : "No modes configured"}
            </div>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>
            Open Video Modes Manager
          </Button>
        </div>
        {stagedBundle ? (
          <div className="bg-muted/40 rounded-md border p-3">
            <VideoSpecsSummary
              summaryLines={stagedBundle.summaryLines}
              matrix={stagedBundle.matrix}
              codecLabels={stagedBundle.codecLabels}
              enableDetailHover={false}
              showDetailModal={false}
            />
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">
            Add resolutions and frame rates to generate a summary preview.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-5xl">
          <div className="max-h-[80vh] overflow-y-auto pr-1">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0">
              <DialogTitle>Video Modes Manager</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={!hasLocalChanges}
              >
                Reset
              </Button>
            </DialogHeader>
            <div className="space-y-6">
              <section className="space-y-3 rounded-md border p-3">
                <h4 className="text-sm font-semibold">
                  Step 1: Select resolutions
                </h4>
                <MultiSelect
                  options={presetOptions}
                  value={presetSelectedKeys}
                  onChange={handlePresetSelectionChange}
                  placeholder="Select standard resolutions"
                  inDialog
                  className="sm:max-w-md"
                />
                <div className="text-muted-foreground text-xs">
                  Use the picker for common formats, then add any custom modes
                  below.
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Custom resolution
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="Label (e.g., 6K Open Gate)"
                      value={customResolution.label}
                      onChange={(event) =>
                        setCustomResolution((prev) => ({
                          ...prev,
                          label: event.target.value,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Width px"
                      value={customResolution.horizontal}
                      onChange={(event) =>
                        setCustomResolution((prev) => ({
                          ...prev,
                          horizontal: event.target.value,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Height px"
                      value={customResolution.vertical}
                      onChange={(event) =>
                        setCustomResolution((prev) => ({
                          ...prev,
                          vertical: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addCustomResolution}
                  >
                    Add custom resolution
                  </Button>
                  {customResolutions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {customResolutions.map((resolution) => (
                        <div
                          key={resolution.key}
                          className="grid gap-2 sm:grid-cols-[2fr_repeat(2,1fr)_auto]"
                        >
                          <Input
                            value={resolution.label}
                            onChange={(event) =>
                              updateCustomResolutionField(
                                resolution.key,
                                "label",
                                event.target.value,
                              )
                            }
                            placeholder="Label"
                          />
                          <Input
                            type="number"
                            value={resolution.horizontal ?? ""}
                            onChange={(event) =>
                              updateCustomResolutionField(
                                resolution.key,
                                "horizontal",
                                event.target.value,
                              )
                            }
                            placeholder="Width px"
                          />
                          <Input
                            type="number"
                            value={resolution.vertical ?? ""}
                            onChange={(event) =>
                              updateCustomResolutionField(
                                resolution.key,
                                "vertical",
                                event.target.value,
                              )
                            }
                            placeholder="Height px"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeCustomResolution(resolution.key)
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-md border p-3">
                <h4 className="text-sm font-semibold">
                  Step 2: Select FPS per resolution
                </h4>
                {guidedResolutions.length === 0 ? (
                  <div className="text-muted-foreground text-xs">
                    Select resolutions to configure frame rates.
                  </div>
                ) : (
                  guidedResolutions.map((resolution) => (
                    <div key={resolution.key} className="space-y-2">
                      <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {resolution.label}
                      </div>
                      <MultiSelect
                        options={fpsOptions}
                        value={(fpsSelections[resolution.key] ?? []).map(
                          String,
                        )}
                        onChange={(ids) =>
                          handleFpsSelectionChange(resolution.key, ids)
                        }
                        placeholder="Select frame rates"
                        inDialog
                      />
                    </div>
                  ))
                )}
              </section>

              <section className="space-y-3 rounded-md border p-3">
                <h4 className="text-sm font-semibold">
                  Step 3: Define codec + bit depth pairs
                </h4>
                <div className="space-y-2">
                  {codecPairs.map((pair) => (
                    <div
                      key={pair.id}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Input
                        placeholder="Codec label"
                        value={pair.label}
                        onChange={(event) =>
                          handleCodecPairChange(
                            pair.id,
                            "label",
                            event.target.value,
                          )
                        }
                        className="flex-1"
                      />
                      <Select
                        value={String(pair.bitDepth)}
                        onValueChange={(value) =>
                          handleCodecPairChange(pair.id, "bitDepth", value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Bit depth" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_DEPTH_VALUES.map((depth) => (
                            <SelectItem key={depth} value={String(depth)}>
                              {depth}-bit
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setCodecPairs((prev) => {
                            if (prev.length === 1) return prev;
                            return sortCodecPairsDesc(
                              prev.filter((item) => item.id !== pair.id),
                            );
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCodecPairs((prev) =>
                      sortCodecPairsDesc([
                        ...prev,
                        { id: createId(), label: "H.264", bitDepth: 8 },
                      ]),
                    )
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add codec pair
                </Button>
              </section>

              <section className="space-y-3 rounded-md border p-3">
                <h4 className="text-sm font-semibold">
                  Step 4: Paint bit depth & forced crop
                </h4>
                <p className="text-muted-foreground text-xs">
                  Choose a bit-depth brush, then click or drag across the matrix
                  to fill cells. Use the crop buttons to toggle forced crops for
                  specific resolution/FPS pairs.
                </p>
                {guidedResolutions.length === 0 ? (
                  <div className="text-muted-foreground text-xs">
                    Add resolutions to unlock the matrix.
                  </div>
                ) : !hasMatrixData ? (
                  <div className="text-muted-foreground text-xs">
                    Select at least one frame rate per resolution to start
                    painting.
                  </div>
                ) : (
                  <VideoBitDepthMatrix
                    resolutions={guidedResolutions}
                    fpsSelections={fpsSelections}
                    bitDepthOptions={bitDepthOptions}
                    maxBitDepth={maxAvailableBitDepth}
                    assignments={codecAssignments}
                    cropAssignments={cropAssignments}
                    onBitDepthChange={handleMaxBitDepthChange}
                    onCropChange={(resolutionKey, fps, value) =>
                      setCropAssignments((prev) => {
                        const next: GuidedCropFactors = { ...prev };
                        const fpsKey = String(fps);
                        const current = { ...(next[resolutionKey] ?? {}) };
                        if (value) {
                          current[fpsKey] = true;
                          next[resolutionKey] = current;
                        } else {
                          delete current[fpsKey];
                          if (Object.keys(current).length === 0) {
                            delete next[resolutionKey];
                          } else {
                            next[resolutionKey] = current;
                          }
                        }
                        return next;
                      })
                    }
                  />
                )}
              </section>

              <section className="space-y-3 rounded-md border p-3">
                <h4 className="text-sm font-semibold">
                  Step 5: Preview generated modes
                </h4>
                {guidedPreview.length === 0 ? (
                  <div className="text-muted-foreground text-xs">
                    Complete the steps above to see a preview.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-md border">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/30 text-muted-foreground text-xs tracking-wide uppercase">
                          <th className="px-3 py-2 text-left">Resolution</th>
                          <th className="px-3 py-2 text-left">FPS</th>
                          <th className="px-3 py-2 text-left">
                            Codec (max available)
                          </th>
                          <th className="px-3 py-2 text-left">Bit depth</th>
                          <th className="px-3 py-2 text-left">Crop</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guidedPreview.map((mode) => (
                          <tr key={mode.id} className="border-t">
                            <td className="px-3 py-2">
                              {mode.resolutionLabel}
                            </td>
                            <td className="px-3 py-2">{mode.fps}</td>
                            <td className="px-3 py-2">{mode.codecLabel}</td>
                            <td className="px-3 py-2">{mode.bitDepth}-bit</td>
                            <td className="px-3 py-2">
                              {mode.cropFactor ? (
                                <Crop className="text-muted-foreground h-4 w-4" />
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
            <DialogFooter className="flex items-center justify-between space-y-2 sm:space-y-0">
              <div className="text-muted-foreground text-xs">
                Applied modes stay in your pending change until you submit the
                gear form.
              </div>
              <Button
                type="button"
                onClick={applyModesToForm}
                disabled={isApplying}
              >
                {isApplying && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Apply to form
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
