import { FlameIcon } from "lucide-react";
import { Badge } from "../ui/badge";

export function TrendingBadge() {
  return (
    <Badge variant="secondary" className="gap-1 bg-orange-500">
      <FlameIcon />
      Trending
    </Badge>
  );
}
