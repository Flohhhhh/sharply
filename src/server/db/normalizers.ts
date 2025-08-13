import { SENSOR_FORMATS } from "~/lib/constants";

type ProposalPayload = {
  core?: Record<string, any>;
  camera?: Record<string, any>;
  lens?: Record<string, any>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseDateUTC(value: string): Date | null {
  // Accept ISO strings, or YYYY-MM-DD and coerce to UTC midnight
  if (!value) return null;
  if (/[tT]/.test(value)) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function coerceNumber(n: any): number | null {
  if (n === null || n === undefined || n === "") return null;
  const num = typeof n === "number" ? n : Number(n);
  return Number.isFinite(num) ? num : null;
}

function coerceBoolean(b: any): boolean | null {
  if (b === null || b === undefined) return null;
  if (typeof b === "boolean") return b;
  if (b === "true") return true;
  if (b === "false") return false;
  return null;
}

export function normalizeProposalPayloadForDb(
  payload: ProposalPayload,
): ProposalPayload {
  const out: ProposalPayload = {};

  if (payload.core) {
    const core: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload.core)) {
      if (v === undefined) continue;
      if (k === "releaseDate") {
        if (v instanceof Date) core.releaseDate = v;
        else if (typeof v === "string") {
          const d = parseDateUTC(v);
          if (d) core.releaseDate = d;
        }
        continue;
      }
      if (k === "msrpUsdCents" || k === "weightGrams") {
        const num = coerceNumber(v);
        if (num !== null) core[k] = Math.trunc(num);
        continue;
      }
      // pass-through for other known scalar fields (name, slug, mountId, brandId, thumbnailUrl, etc.)
      core[k] = v;
    }
    if (Object.keys(core).length) out.core = core;
  }

  if (payload.camera) {
    const camera: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload.camera)) {
      if (v === undefined) continue;
      if (k === "sensorFormatId") {
        if (typeof v === "string") {
          if (isUuid(v)) camera.sensorFormatId = v;
          else {
            const match = SENSOR_FORMATS.find(
              (f: any) => f.slug === v || f.id === v,
            );
            if (match) camera.sensorFormatId = match.id;
          }
        }
        continue;
      }
      if (k === "resolutionMp") {
        const num = coerceNumber(v);
        if (num !== null) camera.resolutionMp = num;
        continue;
      }
      if (
        k === "isoMin" ||
        k === "isoMax" ||
        k === "maxFpsRaw" ||
        k === "maxFpsJpg"
      ) {
        const num = coerceNumber(v);
        if (num !== null) camera[k] = Math.trunc(num);
        continue;
      }
      camera[k] = v;
    }
    if (Object.keys(camera).length) out.camera = camera;
  }

  if (payload.lens) {
    const lens: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload.lens)) {
      if (v === undefined) continue;
      if (k === "focalLengthMinMm" || k === "focalLengthMaxMm") {
        const num = coerceNumber(v);
        if (num !== null) lens[k] = Math.trunc(num);
        continue;
      }
      if (k === "hasStabilization") {
        const bool = coerceBoolean(v);
        if (bool !== null) lens.hasStabilization = bool;
        continue;
      }
      lens[k] = v;
    }
    if (Object.keys(lens).length) out.lens = lens;
  }

  return out;
}
