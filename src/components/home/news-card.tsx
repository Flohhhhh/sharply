import Image from "next/image";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

export type HomePost = {
  id: number | string;
  title: string;
  excerpt?: string;
  href: string;
  image: string;
  date?: string;
  readMinutes?: number;
};

export function NewsCard({ post, badge }: { post: HomePost; badge?: string }) {
  return (
    <Link
      href={post.href}
      className="group bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm"
    >
      <div className="shrink-0 p-2">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="rounded-lg object-cover"
          />
          {badge ? (
            <div className="absolute top-3 left-3">
              <Badge>{badge}</Badge>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3 pt-2 pb-4">
        <h2 className="mb-1 text-lg font-bold group-hover:underline">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="text-muted-foreground line-clamp-2 text-sm group-hover:underline">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-auto">
          <Separator className="my-5" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-sm group-hover:underline">
              {post.date ?? ""}
            </span>
            {typeof post.readMinutes === "number" ? (
              <Badge
                variant="secondary"
                className="h-fit group-hover:underline"
              >
                {post.readMinutes} Min Read
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
