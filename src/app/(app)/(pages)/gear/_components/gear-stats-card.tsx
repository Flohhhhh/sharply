import GearStatsClient from "~/app/(app)/(pages)/gear/_components/gear-stats-client";
import { fetchGearStats } from "~/server/gear/service";

export default async function GearStatsCard({ slug }: { slug: string }) {
  const stats = await fetchGearStats(slug);
  return (
    <section>
      <div className="mb-2 text-lg font-semibold">Popularity</div>
      <GearStatsClient
        slug={slug}
        lifetimeViews={stats.lifetimeViews}
        views30d={stats.views30d}
        wishlistTotal={stats.wishlistTotal}
        ownershipTotal={stats.ownershipTotal}
      />
    </section>
  );
}
