import { TrophyIcon } from "lucide-react";
import { Badge } from "../ui/badge";

export function HallOfFameBadge() {
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-indigo-300 dark:bg-indigo-500"
    >
      <TrophyIcon />
      Hall of Fame
    </Badge>
  );
}
