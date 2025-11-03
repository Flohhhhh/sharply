import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { Progress } from "~/components/ui/progress";

// TODO: Replace this with Payload type
export type ReviewPost = {
  id: number | string;
  title: string;
  href: string;
  author: {
    name: string;
    avatar?: string;
  };
  date: string;
  ratingPercent: number; // 0-100
};

function getInitials(name: string) {
  const trimmed = (name ?? "").trim();
  if (trimmed.length === 0) return "?";
  const parts = trimmed.split(/\s+/);
  const firstInitial = parts[0]?.charAt(0) ?? "";
  const lastInitial =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  const initials = (firstInitial + lastInitial).toUpperCase();
  return initials || "?";
}

export function ReviewCard({ post }: { post: ReviewPost }) {
  return (
    <Link
      href={post.href}
      className="group bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm"
    >
      <div className="flex flex-1 flex-col px-3 pt-3 pb-3">
        <h3 className="font-semibold group-hover:underline">{post.title}</h3>

        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
          <Avatar className="size-6">
            {post.author.avatar ? (
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
            ) : null}
            <AvatarFallback className="text-xs">
              {getInitials(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <span>{post.author.name}</span>
          <span>•</span>
          <span>{post.date}</span>
        </div>

        <div className="mt-2">
          <Separator className="my-3" />
          <div className="flex items-center gap-3">
            <Progress value={post.ratingPercent} className="h-1.5" />
            <span className="text-muted-foreground w-12 text-right text-xs">
              {post.ratingPercent}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
