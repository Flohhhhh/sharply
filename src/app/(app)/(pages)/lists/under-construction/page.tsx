import Link from "next/link";
import type { Metadata } from "next";
import { listUnderConstruction } from "~/server/gear/service";
import UnderConstructionClient from "./_components/under-construction-client";
import { BRANDS } from "~/lib/generated";
// Avoid importing runtime schema in pages; use a local constant
const GEAR_TYPES = ["CAMERA", "LENS"] as const;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Under Construction",
  openGraph: { title: "Under Construction" },
};

export default async function Page() {
  // Include items with at least 1 missing key OR less than 20% completion overall
  const items = await listUnderConstruction(1, 40);

  return (
    <div className="mx-auto mt-24 min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 space-y-4">
        <h1 className="text-2xl font-semibold sm:text-4xl">
          Construction List
        </h1>
        <div className="text-muted-foreground max-w-4xl space-y-2 text-sm">
          <p>
            This page highlights gear that is incomplete in our database. Items
            marked Under construction have critical specs missing (for example,
            mount, sensor, or focal length). Items labeled Low completeness
            don’t meet our threshold of filled specs yet, but may still be
            usable.
          </p>
          <p>
            Rows are prioritized by the number of missing key specs and then by
            overall completion percentage. Click any row to open the edit form
            in a modal and contribute updates—small fixes help a lot!
          </p>
        </div>
      </header>

      <UnderConstructionClient
        items={items}
        brands={BRANDS.map((b) => ({ value: b.id, label: b.name }))}
        types={GEAR_TYPES}
      />
    </div>
  );
}
