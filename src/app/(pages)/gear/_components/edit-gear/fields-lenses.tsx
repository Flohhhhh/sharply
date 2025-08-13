import { lensSpecs } from "~/server/db/schema";

interface LensFieldsProps {
  currentSpecs: typeof lensSpecs.$inferSelect | null | undefined;
  onChange: (field: string, value: any) => void;
}

export function LensFields({ currentSpecs, onChange }: LensFieldsProps) {
  return <div>LensFields</div>;
}
