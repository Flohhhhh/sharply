import { headers } from "next/headers";
import { auth } from "~/auth";
import GearBulkCreate from "../gear-bulk-create";
import { columns } from "./columns";
import { GearDataTable } from "./data-table";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const dynamic = "force-dynamic";

export default async function AdminGearPage() {
  await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Bulk Create</h2>
        <p className="text-muted-foreground mt-2">
          Create many gear items for a brand and type with validation.
        </p>
        <div className="mt-4">
          <GearBulkCreate />
        </div>
      </div>
      <GearDataTable columns={columns} pageSizeOptions={PAGE_SIZE_OPTIONS} />
    </div>
  );
}
