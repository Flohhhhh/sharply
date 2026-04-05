import { ExternalLink, InfoIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { PublicGearCreatorVideoRow } from "~/server/creator-videos/service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

function formatDate(value: Date | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CreatorVideosSection({
  videos,
}: {
  videos: PublicGearCreatorVideoRow[];
}) {
  if (!videos.length) {
    return null;
  }

  return (
    <section id="creator-videos" className="scroll-mt-24 space-y-4">
      <div className="space-y-2">
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Trusted Coverage</h2>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Videos from respected creators that feature this item.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        {videos.map((video) => {
          const publishedLabel = formatDate(video.publishedAt);
          return (
            <a
              key={video.id}
              href={video.normalizedUrl}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-lg border border-border bg-transparent shadow-sm transition-colors"
            >
              <div className="flex flex-col gap-2 p-2 md:flex-row md:items-stretch">
                <div className="aspect-video overflow-hidden rounded-md border max-h-30">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex aspect-video h-full items-center justify-center text-sm">
                      No thumbnail
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 md:flex md:flex-col">
                  {/* <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">YouTube</Badge>
                    {publishedLabel ? (
                      <span className="text-muted-foreground text-xs">
                        {publishedLabel}
                      </span>
                    ) : null}
                  </div> */}

                  <div className="space-y-2 p-2">
                    <div className="line-clamp-2 font-semibold">
                      {video.title}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Avatar className="size-7 border">
                        <AvatarImage
                          src={video.creator.avatarUrl ?? undefined}
                          alt={video.creator.name}
                        />
                        <AvatarFallback className="text-[11px]">
                          {getInitials(video.creator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">
                        {video.creator.name}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-end pt-2">
                    <span className="text-muted-foreground inline-flex items-center gap-2 rounded-md px-3 py-1.5  text-sm transition-colors group-hover:bg-accent/60 group-hover:text-foreground">
                      <ExternalLink className="size-4" />
                      Watch
                    </span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
