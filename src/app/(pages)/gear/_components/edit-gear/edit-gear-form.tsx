"use client";

import { useState, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { CoreFields } from "./fields-core";
import { LensFields } from "./fields-lenses";
import CameraFields from "./fields-cameras";
import { gear, cameraSpecs, lensSpecs } from "~/server/db/schema";

interface EditGearFormProps {
  gearType?: "CAMERA" | "LENS";
  gearSlug: string;
  gearData: typeof gear.$inferSelect & {
    cameraSpecs?: typeof cameraSpecs.$inferSelect | null;
    lensSpecs?: typeof lensSpecs.$inferSelect | null;
  };
}

export function EditGearForm({
  gearType,
  gearData,
  gearSlug,
}: EditGearFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(gearData);

  const handleChange = useCallback(
    (field: string, value: any, section?: string) => {
      if (section) {
        // Handle nested updates (e.g., cameraSpecs, lensSpecs)
        setFormData((prev) => ({
          ...prev,
          [section]: {
            ...(prev[section as keyof typeof prev] as Record<string, any>),
            [field]: value,
          },
        }));
      } else {
        // Handle direct gear field updates
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
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
      <CoreFields currentSpecs={formData} onChange={handleChange} />

      {/* TODO: Add gear-type-specific fields */}
      {gearType === "CAMERA" && (
        <CameraFields
          currentSpecs={formData.cameraSpecs}
          onChange={(field, value) => handleChange(field, value, "cameraSpecs")}
        />
      )}

      {gearType === "LENS" && (
        <LensFields
          currentSpecs={formData.lensSpecs}
          onChange={(field, value) => handleChange(field, value, "lensSpecs")}
        />
      )}

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
