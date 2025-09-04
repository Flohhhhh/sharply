import { Card } from "~/components/ui/card";
import GearStatsClient from "~/app/(pages)/gear/_components/gear-stats-client";
import { getGearStats } from "~/server/popularity/data";

export default async function GearStatsCard({ slug }: { slug: string }) {
  const stats = await getGearStats(slug);
  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-semibold">Popularity</div>
      <GearStatsClient
        slug={slug}
        lifetimeViews={stats.lifetimeViews}
        views30d={stats.views30d}
        wishlistTotal={stats.wishlistTotal}
        ownershipTotal={stats.ownershipTotal}
      />
    </Card>
  );
}
