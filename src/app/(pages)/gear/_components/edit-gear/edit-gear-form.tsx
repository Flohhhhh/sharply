"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { CoreFields } from "./core-fields";
import type { CurrentSpecs } from "~/lib/gear-helpers";

interface EditGearFormProps {
  gearType?: "CAMERA" | "LENS";
  currentSpecs?: CurrentSpecs;
  gearSlug: string;
}

export function EditGearForm({
  gearType,
  currentSpecs,
  gearSlug,
}: EditGearFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    core: {
      releaseDate: currentSpecs?.core?.releaseDate || null,
      msrpUsdCents: currentSpecs?.core?.msrpUsdCents || null,
      mountId: currentSpecs?.core?.mountId || null,
    },
    camera: {},
    lens: {},
  });

  // Update form data when currentSpecs changes
  useEffect(() => {
    if (currentSpecs) {
      setFormData({
        core: {
          releaseDate: currentSpecs.core?.releaseDate || null,
          msrpUsdCents: currentSpecs.core?.msrpUsdCents || null,
          mountId: currentSpecs.core?.mountId || null,
        },
        camera: currentSpecs.camera || {},
        lens: currentSpecs.lens || {},
      });
    }
  }, [currentSpecs]);

  const handleChange = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

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
      {gearType === "CAMERA" && (
        <div className="text-muted-foreground py-8 text-center">
          Camera fields coming soon...
        </div>
      )}

      {gearType === "LENS" && (
        <div className="py-8 text-center">
          <div className="text-muted-foreground mb-2">
            Lens fields coming soon...
          </div>
          <div className="text-muted-foreground text-sm">
            Gear type: {gearType}
          </div>
        </div>
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
