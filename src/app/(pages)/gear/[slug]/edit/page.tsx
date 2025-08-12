import { EditGearForm } from "~/app/(pages)/gear/_components/edit-gear/edit-gear-form";
import { fetchGearData } from "~/lib/gear-helpers";

interface EditGearPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function EditGearPage({
  params,
  searchParams,
}: EditGearPageProps) {
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
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Edit Gear: {gearData.gear.name}
        </h1>
        <p className="text-muted-foreground">
          Suggest changes to gear specifications for review
        </p>
      </div>
      <EditGearForm
        gearType={type as "CAMERA" | "LENS"}
        currentSpecs={currentSpecs}
        gearSlug={slug}
      />
    </div>
  );
}
