import { Badge } from "~/components/ui/badge";
import { Flame } from "lucide-react";
import { getTrendingData } from "~/server/popularity/data";

export default async function GearBadges({ slug }: { slug: string }) {
  const badges: {
    key: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }[] = [];

  // Live badge: Trending (30d) — check if slug appears in top N
  const trendingItems = await getTrendingData("30d", 50, {});
  const trending = trendingItems.some((i) => i.slug === slug);
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
