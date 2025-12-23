"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import type { GearItem } from "~/types/gear";
import { CollectionGrid } from "./collection-grid";
import Logo from "public/logo";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { User } from "next-auth";

const designWidth = 1920;
const designHeight = 1080;
const bottomPadding = 120;
const designHeightWithPadding = designHeight + bottomPadding;

export function CollectionContainer(props: {
  items: GearItem[];
  user: User;
  className?: string;
}) {
  const { items, user, className } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;

      const fit = Math.min(w / designWidth, h / designHeightWithPadding);
      setScale(Math.min(1, fit)); // clamp so it doesn't upscale in preview
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height: designHeightWithPadding * scale }}
    >
      <div
        style={{
          width: designWidth,
          height: designHeightWithPadding,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="bg-accent/50 relative mx-auto flex flex-col justify-center rounded"
      >
        <CollectionGrid items={items} />
      </div>
      <div className="absolute top-6 right-6 left-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Logo className="fill-foreground h-4 w-4" />
          <span className="text-foreground text-xl font-bold">Sharply</span>
        </div>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback>{user.name}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="absolute right-6 bottom-6 left-6 flex items-center justify-center gap-2">
        <p className="text-muted-foreground text-xs">
          {user.name}'s collection on sharplyphoto.com
        </p>
      </div>
    </div>
  );
}
