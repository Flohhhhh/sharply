import { EditGearModal } from "~/app/(pages)/gear/_components/edit-gear/edit-gear-modal";
import { fetchGearBySlug } from "~/lib/queries/gear";
import type { GearItem } from "~/types/gear";

interface EditGearModalPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function EditGearModalPage({
  params,
  searchParams,
}: EditGearModalPageProps) {
  const [{ slug }, { type }] = await Promise.all([params, searchParams]);

  // Fetch current gear data
  const gearDataResult: GearItem = await fetchGearBySlug(slug);

  // Validate and set default gear type
  const gearType = type === "CAMERA" || type === "LENS" ? type : "CAMERA";

  // Create gearData object outside of JSX to prevent recreation on every render
  const gearData = gearDataResult
    ? {
        ...gearDataResult,
        cameraSpecs: gearDataResult.cameraSpecs || null,
        lensSpecs: gearDataResult.lensSpecs || null,
      }
    : ({} as GearItem);

  return (
    <EditGearModal
      gearType={gearType}
      gearData={gearData}
      gearSlug={slug}
      gearName={gearData.name || ""}
    />
  );
}
