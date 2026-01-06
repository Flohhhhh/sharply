import { SparklesIcon } from "lucide-react";
import { Badge } from "../ui/badge";

export function NewBadge() {
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-emerald-300 dark:bg-emerald-600"
    >
      <SparklesIcon />
      New
    </Badge>
  );
}
