import { SENSOR_FORMATS } from "~/lib/constants";
import { getMountNameById, getMountNamesById } from "~/lib/mapping/mounts-map";
import type { GearItem } from "~/types/gear";

type BuildGearMetaDescriptionParams = {
  gear: GearItem;
  displayName: string;
  staffVerdictContent?: string | null;
  maxLength?: number;
};

function clampToMetaLength(text: string, maxLength: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLength) return t;

  const hard = t.slice(0, maxLength);
  const lastSpace = hard.lastIndexOf(" ");
  const candidate = (lastSpace > 40 ? hard.slice(0, lastSpace) : hard).trim();
  return candidate.replace(/[\s.,;:!-]+$/g, "") + "…";
}

function firstParagraph(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n");
  const parts = normalized
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[0] ?? "";
}

function sanitizeVerdictForMeta(content: string): string {
  // Keep it conservative: one paragraph, whitespace normalized.
  let t = firstParagraph(content);
  t = t.replace(/^[-*]\s+/gm, "");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function sensorFormatNameFromId(id: string | null | undefined): string | null {
  if (!id) return null;
  const match = SENSOR_FORMATS.find((f) => f.id === id);
  return match?.name ?? null;
}

function formatMp(resolutionMp: unknown): string | null {
  if (resolutionMp == null) return null;
  const n =
    typeof resolutionMp === "number" ? resolutionMp : Number(resolutionMp);
  if (!Number.isFinite(n) || n <= 0) return null;
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function cameraTypeLabel(cameraType: unknown): string | null {
  const v = typeof cameraType === "string" ? cameraType : null;
  if (!v) return null;
  const map: Record<string, string> = {
    dslr: "DSLR",
    mirrorless: "mirrorless",
    slr: "SLR",
    action: "action",
    cinema: "cinema",
  };
  return map[v] ?? v;
}

function formatFocalLength(lens: GearItem["lensSpecs"]): string | null {
  if (!lens) return null;
  const min = lens.focalLengthMinMm;
  const max = lens.focalLengthMaxMm;
  if (typeof min !== "number" && typeof max !== "number") return null;
  if (typeof min === "number" && typeof max === "number" && min && max) {
    return min === max ? `${min}mm` : `${min}-${max}mm`;
  }
  const only =
    typeof min === "number" ? min : typeof max === "number" ? max : null;
  return only ? `${only}mm` : null;
}

function formatMaxApertureWide(lens: GearItem["lensSpecs"]): string | null {
  if (!lens) return null;
  const wide =
    lens.maxApertureWide != null ? Number(lens.maxApertureWide) : null;
  if (wide == null || !Number.isFinite(wide) || wide <= 0) return null;
  return String(wide);
}

export function buildGearMetaDescription(
  params: BuildGearMetaDescriptionParams,
): string {
  const maxLength = params.maxLength ?? 160;

  if (params.staffVerdictContent?.trim()) {
    const staff = sanitizeVerdictForMeta(params.staffVerdictContent);
    if (staff) return clampToMetaLength(staff, maxLength);
  }

  const name = params.displayName;
  const mountNamesRaw = getMountNamesById(params.gear.mountIds);
  const mountClause =
    mountNamesRaw && mountNamesRaw !== "Unknown"
      ? ` (${mountNamesRaw} mount)`
      : "";

  const generic = `See specs and reviews for ${name} on Sharply.`;

  if (params.gear.gearType === "CAMERA") {
    const cameraType = cameraTypeLabel(params.gear.cameraSpecs?.cameraType);
    const mp = formatMp(params.gear.cameraSpecs?.resolutionMp);
    const sensor = sensorFormatNameFromId(
      params.gear.cameraSpecs?.sensorFormatId,
    );

    if (!cameraType || !mp || !sensor) {
      return clampToMetaLength(generic, maxLength);
    }

    const text = `The ${name} is a ${sensor} ${cameraType} camera with a ${mp}MP sensor. More specs and reviews on Sharply, the crowd-sourced photo gear database.`;
    return clampToMetaLength(text, maxLength);
  }

  if (params.gear.gearType === "LENS") {
    const focal = formatFocalLength(params.gear.lensSpecs);
    const aperture = formatMaxApertureWide(params.gear.lensSpecs);

    // Get mount names as array and validate
    const mountIds = params.gear.mountIds;
    if (!mountIds || mountIds.length === 0) {
      return clampToMetaLength(generic, maxLength);
    }

    const mounts = mountIds
      .map((id) => getMountNameById(id))
      .filter((n) => n !== "Unknown");

    if (!focal || !aperture || mounts.length === 0) {
      return clampToMetaLength(generic, maxLength);
    }

    // Form an Oxford comma-separated list of mounts
    const mountString =
      mounts.length === 1
        ? mounts[0]
        : mounts.length === 2
          ? `${mounts[0]} and ${mounts[1]}`
          : mounts.slice(0, -1).join(", ") +
            ", and " +
            mounts[mounts.length - 1];

    const text = `The ${name} is a ${focal} f/${aperture} lens for ${mountString} mount cameras. More specs and reviews on Sharply, the crowd-sourced photo gear database.`;
    return clampToMetaLength(text, maxLength);
  }

  return clampToMetaLength(generic, maxLength);
}
