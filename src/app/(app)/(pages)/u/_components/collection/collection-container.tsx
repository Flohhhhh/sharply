"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ClipboardCopy, Loader } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import type { GearItem } from "~/types/gear";
import { CollectionGrid } from "./collection-grid";
import Logo from "public/logo";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import type { AuthUser } from "~/auth";

const designWidth = 1920;
const designHeight = 1080;
const bottomPadding = 120;
const designHeightWithPadding = designHeight + bottomPadding;

export function CollectionContainer(props: {
  items: GearItem[];
  user: AuthUser;
  className?: string;
}) {
  const { items, user, className } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [containerHeight, setContainerHeight] = useState(designHeightWithPadding);
  const [contentSize, setContentSize] = useState({
    width: designWidth,
    height: designHeightWithPadding,
  });
  const [isCopying, setIsCopying] = useState(false);

  const updateScale = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const containerWidth = container.clientWidth || designWidth;
    const targetHeight =
      (containerWidth / designWidth) * designHeightWithPadding;

    const measuredWidth = Math.max(content.scrollWidth, designWidth);
    const measuredHeight = Math.max(content.scrollHeight, designHeightWithPadding);

    const fit = Math.min(
      containerWidth / measuredWidth,
      targetHeight / measuredHeight,
      1,
    );

    setScale((prev) => (prev === fit ? prev : fit));
    setContainerHeight((prev) =>
      Math.abs(prev - targetHeight) < 0.5 ? prev : targetHeight,
    );
    setContentSize((prev) =>
      prev.width === measuredWidth && prev.height === measuredHeight
        ? prev
        : { width: measuredWidth, height: measuredHeight },
    );
  }, []);

  useLayoutEffect(() => {
    updateScale();
    const container = containerRef.current;
    const content = contentRef.current;
    const ro = new ResizeObserver(updateScale);
    if (container) ro.observe(container);
    if (content) ro.observe(content);
    return () => ro.disconnect();
  }, [updateScale, items]);

  useEffect(() => {
    console.log("isCopying", isCopying);
    return () => {
      console.log("unmounting");
    };
  }, [isCopying]);

  const handleCopyImage = useCallback(async () => {
    setIsCopying(true);

    const task = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 150));

        const node = containerRef.current;
        if (!node) {
          throw new Error("Missing collection node");
        }

        const htmlToImage = await import("html-to-image");
        const pixelRatio = Math.max(
          2,
          Math.round((window.devicePixelRatio || 1) / Math.max(scale, 0.1)),
        );

        const filter = (element: HTMLElement | SVGElement) => {
          return !(
            element instanceof Element &&
            element.getAttribute("data-export-ignore") === "true"
          );
        };

        const blob = await htmlToImage.toBlob(node, {
          pixelRatio,
          cacheBust: true,
          skipFonts: true,
          filter,
        });

        if (!blob) {
          throw new Error("Failed to render collection preview");
        }

        if (
          typeof navigator.clipboard?.write === "function" &&
          typeof ClipboardItem !== "undefined"
        ) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          return "Copied collection image to clipboard";
        } else {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = "sharply-collection.png";
          link.click();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return "Downloaded collection image";
        }
      } catch (error) {
        console.error("Failed to copy collection image", error);
        throw error;
      }
    };

    const promise = task();

    toast.promise(promise, {
      loading: "Rendering collection image...",
      success: (message) => message,
      error: "Unable to copy collection image",
    });

    try {
      await promise;
    } finally {
      setIsCopying(false);
    }
  }, [scale]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={cn(
          "bg-background relative w-full overflow-hidden",
          className,
        )}
        style={{ height: containerHeight }}
      >
        <div
          ref={contentRef}
          style={{
            width: contentSize.width,
            height: contentSize.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="bg-accent/20 relative mx-auto flex flex-col justify-center border"
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
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? ""}
              />
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
      <div className="w-full">
        <Button
          type="button"
          onClick={handleCopyImage}
          loading={isCopying}
          data-export-ignore="true"
          icon={<ClipboardCopy />}
          className="hidden w-full md:flex"
        >
          Copy image
        </Button>
      </div>
    </div>
  );
}
