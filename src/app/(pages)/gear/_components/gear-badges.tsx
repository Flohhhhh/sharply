import { Badge } from "~/components/ui/badge";
import { Flame } from "lucide-react";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function isTrending(
  slug: string,
  opts?: { timeframe?: "7d" | "30d"; limit?: number },
) {
  const timeframe = opts?.timeframe ?? "30d";
  const limit = opts?.limit ?? 20;
  const base = getBaseUrl();
  const url = new URL(`${base}/api/popularity/trending`);
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 12, tags: ["trending"] },
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { items?: Array<{ slug: string }> };
  return Boolean(data.items?.some((i) => i.slug === slug));
}

export default async function GearBadges({ slug }: { slug: string }) {
  const badges: {
    key: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }[] = [];

  // Live badge: Trending
  const trending = await isTrending(slug, { timeframe: "30d", limit: 50 });
  if (trending)
    badges.push({
      key: "trending",
      label: "Trending",
      icon: <Flame className="h-3.5 w-3.5" />,
      variant: "default",
    });

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <Badge
          key={b.key}
          variant={b.variant ?? "default"}
          className="inline-flex items-center gap-1.5"
        >
          {b.icon}
          <span>{b.label}</span>
        </Badge>
      ))}
    </div>
  );
}
