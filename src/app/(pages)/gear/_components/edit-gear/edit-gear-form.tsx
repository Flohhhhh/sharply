"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { CoreFields } from "./fields-core";
import { LensFields } from "./fields-lenses";
import { CameraFields } from "./fields-cameras";
import { gear, cameraSpecs, lensSpecs } from "~/server/db/schema";

interface EditGearFormProps {
  gearType?: "CAMERA" | "LENS";
  gearSlug: string;
  gearData: typeof gear.$inferSelect & {
    cameraSpecs?: typeof cameraSpecs.$inferSelect | null;
    lensSpecs?: typeof lensSpecs.$inferSelect | null;
  };
}

type FormData = {
  core: {
    releaseDate: Date | null;
    msrpUsdCents: number | null;
    mountId: string | null;
    weightGrams: number | null;
  };
  camera: {
    sensorFormatId: string | null;
    resolutionMp: string | null;
    isoMin: number | null;
    isoMax: number | null;
    maxFpsRaw: number | null;
    maxFpsJpg: number | null;
  };
  lens: {
    focalLengthMinMm: number | null;
    focalLengthMaxMm: number | null;
    hasStabilization: boolean | null;
  };
};

export function EditGearForm({
  gearType,
  gearData,
  gearSlug,
}: EditGearFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData = useMemo<FormData>(
    () => ({
      core: {
        releaseDate: gearData?.releaseDate || null,
        msrpUsdCents: gearData?.msrpUsdCents || null,
        mountId: gearData?.mountId || null,
        weightGrams: gearData?.weightGrams || null,
      },
      camera: {
        sensorFormatId: gearData?.cameraSpecs?.sensorFormatId || null,
        resolutionMp: gearData?.cameraSpecs?.resolutionMp || null,
        isoMin: gearData?.cameraSpecs?.isoMin || null,
        isoMax: gearData?.cameraSpecs?.isoMax || null,
        maxFpsRaw: gearData?.cameraSpecs?.maxFpsRaw || null,
        maxFpsJpg: gearData?.cameraSpecs?.maxFpsJpg || null,
      },
      lens: {
        focalLengthMinMm: gearData?.lensSpecs?.focalLengthMinMm || null,
        focalLengthMaxMm: gearData?.lensSpecs?.focalLengthMaxMm || null,
        hasStabilization: gearData?.lensSpecs?.hasStabilization || null,
      },
    }),
    [gearData],
  );

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleChange = useCallback(
    (section: string, field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: value,
        },
      }));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement form submission logic
    console.log("Form submitted with data:", formData);
    console.log("Gear slug:", gearSlug);

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CoreFields currentSpecs={formData.core} onChange={handleChange} />

      {/* TODO: Add gear-type-specific fields */}
      {gearType === "CAMERA" && <CameraFields />}

      {gearType === "LENS" && <LensFields />}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Changes"}
        </Button>
      </div>
    </form>
  );
}
