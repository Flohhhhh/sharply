export type GearType = "CAMERA" | "LENS" | "";

export type SoftWarningId =
  | "nikkor"
  | "missing-mm"
  | "missing-aperture"
  | "canon-eos";

export interface SoftWarning {
  id: SoftWarningId;
  title: string;
  description: string;
}

function normalize(value?: string): string {
  return (value || "").trim().toLowerCase();
}

export function isBrandNameOnly(params: {
  name: string;
  brandName?: string;
}): boolean {
  const name = normalize(params.name);
  const brand = normalize(params.brandName);
  return !!name && !!brand && name === brand;
}

export function getNameSoftWarnings(params: {
  name: string;
  brandName?: string;
  gearType: GearType;
}): SoftWarning[] {
  const { name, brandName, gearType } = params;
  const n = normalize(name);
  const b = normalize(brandName);
  const warnings: SoftWarning[] = [];

  if (gearType === "LENS") {
    if (b === "nikon" && n && !n.includes("nikkor")) {
      warnings.push({
        id: "nikkor",
        title: 'Suggestion: add "Nikkor" prefix',
        description:
          'Nikon lenses are commonly named with the Nikkor prefix (e.g., "Nikon Nikkor Z 400 f/4.5"). Consider adding "Nikkor" after "Nikon".',
      });
    }
    if (n && !n.includes("mm")) {
      warnings.push({
        id: "missing-mm",
        title: "Suggestion: add focal length units (mm)",
        description:
          'Lens names typically include "mm" after the focal length (e.g., "24-70mm").',
      });
    }
    if (n && !n.includes("f/")) {
      warnings.push({
        id: "missing-aperture",
        title: "Suggestion: add f-stop indicator (f/)",
        description:
          'Lens names typically include f-stop indicator (e.g., "f/2.8").',
      });
    }
  }

  if (gearType === "CAMERA" && b === "canon" && n && !n.includes("eos")) {
    warnings.push({
      id: "canon-eos",
      title: 'Suggestion: add "EOS" prefix',
      description:
        'Canon digital ILC cameras are typically named with the EOS prefix (e.g., "Canon EOS R5"). Consider adding "EOS" after "Canon".',
    });
  }

  return warnings;
}
