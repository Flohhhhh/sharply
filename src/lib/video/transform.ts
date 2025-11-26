import type { CameraVideoMode } from "~/types/gear";

type ResolutionGroup = {
  key: string;
  label: string;
  horizontal: number | null;
  vertical: number | null;
  modes: CameraVideoMode[];
};

export type VideoMatrixCell = {
  resolutionKey: string;
  fps: number;
  bitDepth: number;
  isCropped: boolean;
};

export type VideoMatrixResolution = {
  key: string;
  label: string;
  sortValue: number;
};

export type VideoMatrixData = {
  resolutions: VideoMatrixResolution[];
  fpsValues: number[];
  cells: Record<string, Record<string, VideoMatrixCell>>;
};

export type VideoDisplayBundle = {
  summaryLines: string[];
  matrix: VideoMatrixData;
  codecLabels: string[];
};

function groupByResolution(modes: CameraVideoMode[]): ResolutionGroup[] {
  const groups = new Map<string, ResolutionGroup>();
  for (const mode of modes) {
    const key = mode.resolutionKey ?? "unknown";
    const existing = groups.get(key);
    if (existing) {
      existing.modes.push(mode);
      continue;
    }
    groups.set(key, {
      key,
      label: mode.resolutionLabel ?? key.toUpperCase(),
      horizontal: mode.resolutionHorizontal
        ? Number(mode.resolutionHorizontal)
        : null,
      vertical: mode.resolutionVertical
        ? Number(mode.resolutionVertical)
        : null,
      modes: [mode],
    });
  }

  const sorted = Array.from(groups.values()).sort((a, b) => {
    const aPixels = (a.horizontal ?? 0) * (a.vertical ?? 0);
    const bPixels = (b.horizontal ?? 0) * (b.vertical ?? 0);
    if (aPixels && bPixels && aPixels !== bPixels) {
      return bPixels - aPixels; // descending resolution
    }
    return a.label.localeCompare(b.label);
  });
  return sorted;
}

export function buildVideoSummaryLines(modes: CameraVideoMode[]): string[] {
  if (!modes || modes.length === 0) return [];
  const groups = groupByResolution(modes);
  return groups.map((group) => {
    const maxFps = group.modes.reduce(
      (acc, mode) => Math.max(acc, mode.fps ?? 0),
      0,
    );
    const maxBitDepth = group.modes.reduce(
      (acc, mode) => Math.max(acc, mode.bitDepth ?? 0),
      0,
    );
    return `${group.label} – up to ${maxFps} fps – ${maxBitDepth}-bit`;
  });
}

function pickBestMode(
  existing: CameraVideoMode | undefined,
  incoming: CameraVideoMode,
): CameraVideoMode {
  if (!existing) return incoming;
  if ((incoming.bitDepth ?? 0) !== (existing.bitDepth ?? 0)) {
    return (incoming.bitDepth ?? 0) > (existing.bitDepth ?? 0)
      ? incoming
      : existing;
  }
  if (incoming.codecLabel && existing.codecLabel) {
    return incoming.codecLabel.localeCompare(existing.codecLabel) < 0
      ? incoming
      : existing;
  }
  return incoming;
}

export function buildVideoMatrix(modes: CameraVideoMode[]): VideoMatrixData {
  if (!modes || modes.length === 0) {
    return {
      resolutions: [],
      fpsValues: [],
      cells: {},
    };
  }

  const groups = groupByResolution(modes);
  const fpsSet = new Set<number>();
  for (const mode of modes) {
    if (mode.fps) {
      fpsSet.add(Number(mode.fps));
    }
  }
  const fpsValues = Array.from(fpsSet).sort((a, b) => b - a);

  const cells: Record<string, Record<string, VideoMatrixCell>> = {};
  const bestModes = new Map<string, CameraVideoMode>();

  for (const group of groups) {
    const resolutionKey = group.key;
    for (const mode of group.modes) {
      const fpsValue = Number(mode.fps ?? 0);
      const comboKey = `${resolutionKey}:${fpsValue}`;
      const existingMode = bestModes.get(comboKey);
      const bestMode = pickBestMode(existingMode, mode);
      bestModes.set(comboKey, bestMode);
    }
  }

  for (const [comboKey, mode] of bestModes.entries()) {
    const parts = comboKey.split(":");
    const resolutionKey = parts[0] ?? "unknown";
    const fpsString = parts[1] ?? "0";
    cells[resolutionKey] = cells[resolutionKey] ?? {};
    cells[resolutionKey]![fpsString] = formatCell(resolutionKey, mode);
  }

  return {
    resolutions: groups.map((group) => ({
      key: group.key,
      label: group.label,
      sortValue: getResolutionSortValue(group),
    })),
    fpsValues,
    cells,
  };
}

function getResolutionSortValue(group: ResolutionGroup): number {
  const dimension = Math.max(group.horizontal ?? 0, group.vertical ?? 0);
  if (dimension > 0) return dimension;
  return parseResolutionLabelValue(group.label);
}

function parseResolutionLabelValue(label: string): number {
  const normalized = label.trim().toLowerCase();
  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) {
    const matchValue = kMatch[1];
    if (matchValue?.length) {
      const value = parseFloat(matchValue);
      if (!Number.isNaN(value)) {
        return Math.round(value * 1000);
      }
    }
  }
  const pMatch = normalized.match(/(\d+)\s*p/);
  if (pMatch) {
    const matchValue = pMatch[1];
    if (matchValue?.length) {
      const value = parseInt(matchValue, 10);
      if (!Number.isNaN(value)) {
        return value;
      }
    }
  }
  const genericMatch = normalized.match(/(\d+(\.\d+)?)/);
  if (genericMatch) {
    const matchValue = genericMatch[1];
    if (matchValue?.length) {
      const value = parseFloat(matchValue);
      if (!Number.isNaN(value)) {
        return value;
      }
    }
  }
  return Number.MAX_SAFE_INTEGER;
}

function formatCell(
  resolutionKey: string,
  mode: CameraVideoMode,
): VideoMatrixCell {
  const isCropped = Boolean(mode.cropFactor);
  return {
    resolutionKey,
    fps: Number(mode.fps ?? 0),
    bitDepth: Number(mode.bitDepth ?? 0),
    isCropped,
  };
}

function extractCodecLabels(modes: CameraVideoMode[]): string[] {
  if (!modes?.length) return [];
  const set = new Set<string>();
  for (const mode of modes) {
    if (mode.codecLabel && mode.codecLabel.trim().length > 0) {
      set.add(mode.codecLabel.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function buildVideoDisplayBundle(
  modes: CameraVideoMode[],
): VideoDisplayBundle {
  return {
    summaryLines: buildVideoSummaryLines(modes),
    matrix: buildVideoMatrix(modes),
    codecLabels: extractCodecLabels(modes),
  };
}
