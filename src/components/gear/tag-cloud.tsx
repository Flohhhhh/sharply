import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { TagIcon } from "./tag-icon";

export type TagCloudTag = { slug: string; name: string; icon?: string | null };

export function TagCloud({ tags }: { tags: TagCloudTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Tags">
      {tags.map((tag) => (
        <Badge
          key={tag.slug}
          variant="secondary"
          className="border-border font-medium"
          asChild
        >
          <Link
            href={`/tags/${tag.slug}`}
            className="flex items-center gap-1.5"
          >
            <TagIcon name={tag.icon} size={13} />
            {tag.name}
          </Link>
        </Badge>
      ))}
    </div>
  );
}
