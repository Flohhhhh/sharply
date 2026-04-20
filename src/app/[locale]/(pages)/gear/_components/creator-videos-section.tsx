import { ExternalLink, InfoIcon } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { PublicGearCreatorVideoRow } from "~/server/creator-videos/service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

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
          return (
            <a
              key={video.id}
              href={video.normalizedUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${video.title} by ${video.creator.name} (opens in new tab)`}
              className="group block overflow-hidden rounded-lg border border-border bg-transparent shadow-sm transition-colors"
            >
              <div className="flex flex-col gap-0 p-0 md:flex-row md:items-stretch md:gap-2 md:p-2">
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-lg border-b border-border md:max-h-30 md:w-44 md:shrink-0 md:rounded-md md:border md:border-border">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 767px) 100vw, 11rem"
                    />
                  ) : (
                    <div className="text-muted-foreground flex aspect-video h-full items-center justify-center text-sm">
                      No thumbnail
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col px-3 py-3 md:px-2 md:py-0">
                  {/* <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">YouTube</Badge>
                    {publishedLabel ? (
                      <span className="text-muted-foreground text-xs">
                        {publishedLabel}
                      </span>
                    ) : null}
                  </div> */}

                  <div className="space-y-2">
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

                  <div className="mt-auto hidden justify-end pt-2 md:flex">
                    <span className="text-muted-foreground inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors group-hover:bg-accent/60 group-hover:text-foreground">
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
