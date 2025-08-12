import { EditGearForm } from "~/components/edit-gear-form";

interface EditGearPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function EditGearPage({
  searchParams,
}: EditGearPageProps) {
  const { type } = await searchParams;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Gear Specifications</h1>
        <p className="text-muted-foreground">
          Suggest changes to gear specifications for review
        </p>
      </div>
      <EditGearForm gearType={type as "CAMERA" | "LENS"} />
    </div>
  );
}
