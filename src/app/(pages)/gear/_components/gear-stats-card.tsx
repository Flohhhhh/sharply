import { Card } from "~/components/ui/card";
import GearStatsClient from "~/app/(pages)/gear/_components/gear-stats-client";

function getBaseUrl() {
  // Prefer explicit public site URL, then Vercel URL, then localhost for dev
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function fetchStats(slug: string) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/gear/${slug}/stats`, {
    next: {
      revalidate: 60 * 60, // 1 hour
      tags: ["popularity", `gear-stats:${slug}`],
    },
  });
  if (!res.ok) throw new Error("Failed to fetch gear stats");
  return (await res.json()) as {
    gearId: string;
    lifetimeViews: number;
    views30d: number;
    wishlistTotal: number;
    ownershipTotal: number;
  };
}

export default async function GearStatsCard({ slug }: { slug: string }) {
  const stats = await fetchStats(slug);
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
