import { EditGearModal } from "~/components/edit-gear-modal";

interface EditGearModalPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function EditGearModalPage({
  searchParams,
}: EditGearModalPageProps) {
  const { type } = await searchParams;

  return <EditGearModal gearType={type as "CAMERA" | "LENS"} />;
}
