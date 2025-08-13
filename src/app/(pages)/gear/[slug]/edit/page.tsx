import { EditGearForm } from "~/app/(pages)/gear/_components/edit-gear/edit-gear-form";
import { fetchGearBySlug } from "~/lib/queries/gear";
import type { GearItem } from "~/types/gear";

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
  const gearData: GearItem = await fetchGearBySlug(slug);

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Gear: {gearData?.name}</h1>
        <p className="text-muted-foreground">
          Suggest changes to gear specifications for review
        </p>
      </div>
      <EditGearForm
        gearType={type as "CAMERA" | "LENS"}
        gearData={gearData}
        gearSlug={slug}
      />
    </div>
  );
}
