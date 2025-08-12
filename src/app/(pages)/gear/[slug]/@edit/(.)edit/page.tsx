import { EditGearModal } from "~/components/edit-gear-modal";
import { fetchGearData } from "~/lib/gear-helpers";

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
  const gearData = await fetchGearData(slug);

  // Transform data for the edit form
  const currentSpecs = {
    core: {
      releaseDate: gearData.gear.releaseDate
        ? gearData.gear.releaseDate.toISOString().split("T")[0]
        : null,
      msrpUsdCents: gearData.gear.msrpUsdCents ?? null,
      mountId: gearData.gear.mountId ?? null,
    },
    // TODO: Add camera and lens specs when implementing those sections
    camera: {},
    lens: {},
  };

  return (
    <EditGearModal
      gearType={type as "CAMERA" | "LENS"}
      currentSpecs={currentSpecs}
      gearSlug={slug}
      gearName={gearData.gear.name}
    />
  );
}
