"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { ApertureInput, NumberInput } from "~/components/custom-inputs";
import { LensApertureProfile } from "~/components/lens-aperture-profile/lens-aperture-profile";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { translateGearDetailWithFallback } from "~/lib/i18n/gear-detail";
import {
  getVariableApertureProfileEndpoints,
  normalizeApertureProfile,
  type ApertureProfileBounds,
  type ApertureProfilePoint,
} from "~/lib/lens-aperture-profile";

type Props = {
  value: unknown;
  bounds: ApertureProfileBounds;
  disabled?: boolean;
  onChange: (value: ApertureProfilePoint[] | null) => void;
};

const PROFILE_FALLBACKS: Record<string, string> = {
  label: "Variable Aperture Profile",
  manage: "Manage profile",
  unavailable: "Available for zoom lenses with different wide and tele maximum apertures.",
  addPointsToPreview: "Add points to see preview.",
  endpointHelp: "Endpoint values come from the lens focal length and maximum aperture fields.",
  focalLength: "Focal length",
  maximumAperture: "Maximum aperture",
  removePoint: "Remove profile point",
  addPoint: "Add point",
  cancel: "Cancel",
  save: "Save profile",
  invalid: "Each point must have a unique focal length within the lens range and a positive aperture.",
};

export function ApertureProfileManager({ value, bounds, disabled = false, onChange }: Props) {
  const gearT = useTranslations("gearDetail");
  const t = (key: string) =>
    translateGearDetailWithFallback(
      gearT,
      `editGear.apertureProfile.${key}`,
      PROFILE_FALLBACKS[key] ?? key,
    );
  const endpoints = useMemo(
    () => getVariableApertureProfileEndpoints(bounds),
    [
      bounds.focalLengthMaxMm,
      bounds.focalLengthMinMm,
      bounds.isPrime,
      bounds.maxApertureTele,
      bounds.maxApertureWide,
    ],
  );
  const initial = useMemo(() => normalizeApertureProfile(value, endpoints), [value, endpoints]);
  const [open, setOpen] = useState(false);
  const [intermediates, setIntermediates] = useState<ApertureProfilePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIntermediates(initial?.slice(1, -1) ?? []);
  }, [initial]);

  useEffect(() => {
    if (value != null && !initial) onChange(null);
  }, [initial, onChange, value]);

  const rows = endpoints ? [endpoints[0]!, ...intermediates, endpoints[1]!] : [];
  const update = (
    index: number,
    key: keyof ApertureProfilePoint,
    value: number | null | undefined,
  ) => {
    if (value == null || value <= 0) return;
    setIntermediates((current) =>
      current
        .map((point, pointIndex) =>
          pointIndex === index ? { ...point, [key]: value } : point,
        )
        .sort((a, b) => a.focalLength - b.focalLength),
    );
    setError(null);
  };
  const save = () => {
    if (!endpoints) return;
    if (!intermediates.length) {
      onChange(null);
      setOpen(false);
      return;
    }
    const normalized = normalizeApertureProfile([endpoints[0], ...intermediates, endpoints[1]], endpoints);
    if (!normalized) {
      setError(t("invalid"));
      return;
    }
    onChange(normalized);
    setOpen(false);
  };

  const hasPreview = Boolean(initial && initial.length >= 3);

  return <div id="aperture-profile" className="space-y-3 rounded-md border p-4">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <Label className="font-semibold">{t("label")}</Label>
      <Button type="button" size="sm" disabled={disabled || !endpoints} onClick={() => setOpen(true)}>
        {t("manage")}
      </Button>
    </div>
    {hasPreview ? (
      <LensApertureProfile points={initial!} expandable={false} />
    ) : (
      <p className="text-muted-foreground text-sm">{t(endpoints ? "addPointsToPreview" : "unavailable")}</p>
    )}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{t("label")}</DialogTitle></DialogHeader>
        <p className="text-muted-foreground text-sm">{t("endpointHelp")}</p>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-sm font-medium"><span className="text-left">{t("focalLength")}</span><span className="text-left">{t("maximumAperture")}</span><span /></div>
        <div className="space-y-2">
          {rows.map((row, index) => {
            const locked = index === 0 || index === rows.length - 1;
            const intermediateIndex = index - 1;
            return <div key={`${row.focalLength}-${index}`} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
              <NumberInput
                id={`aperture-profile-focal-${index}`}
                label={<span className="sr-only">{t("focalLength")}</span>}
                value={row.focalLength}
                suffix="mm"
                step={0.1}
                min={0.1}
                disabled={locked}
                onChange={(next) => update(intermediateIndex, "focalLength", next)}
              />
              <ApertureInput
                id={`aperture-profile-aperture-${index}`}
                label={<span className="sr-only">{t("maximumAperture")}</span>}
                value={row.aperture}
                disabled={locked}
                onChange={(next) => update(intermediateIndex, "aperture", next)}
              />
              {locked ? <span className="w-9" /> : <Button type="button" variant="ghost" size="icon" aria-label={t("removePoint")} onClick={() => setIntermediates((current) => current.filter((_, pointIndex) => pointIndex !== intermediateIndex))}><Trash2 className="size-4" /></Button>}
            </div>;
          })}
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="button" variant="outline" className="w-fit" onClick={() => setIntermediates((current) => {
          const values = [endpoints![0]!.focalLength, ...current.map((point) => point.focalLength), endpoints![1]!.focalLength].sort((a, b) => a - b);
          let widestGap = 0;
          let focalLength = values[0]!;
          for (let index = 1; index < values.length; index += 1) {
            const previous = values[index - 1]!;
            const next = values[index]!;
            if (next - previous > widestGap) {
              widestGap = next - previous;
              focalLength = Math.round(((previous + next) / 2) * 10) / 10;
            }
          }
          return [...current, { focalLength, aperture: endpoints![0]!.aperture }].sort((a, b) => a.focalLength - b.focalLength);
        })}><Plus className="mr-2 size-4" />{t("addPoint")}</Button>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button><Button type="button" onClick={save}>{t("save")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
