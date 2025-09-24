"use client";

import Tilt from "react-parallax-tilt";
import { useIsMobile } from "~/hooks/use-mobile";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import type { User } from "~/server/db/schema";
import { formatHumanDate } from "~/lib/utils";
import { useCallback, useMemo, useRef } from "react";
import QrCode from "~/components/qr-code";
import { HyperText } from "~/components/ui/hyper-text";
import { Button } from "~/components/ui/button";
import { ClipboardCopy, UserPen } from "lucide-react";
import { BadgeTile } from "~/components/badges/badge-tile";
import { BADGE_CATALOG } from "~/lib/badges/catalog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { SettingsForm } from "~/app/(pages)/profile/settings/settings-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserCard(props: { user: User }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(props.user.name ?? "");

  const joinedDate = props.user?.createdAt
    ? formatHumanDate(props.user.createdAt)
    : "Unknown";

  const handle = (() => {
    const fromEmail = props.user?.email?.split("@")[0];
    if (fromEmail) return `@${fromEmail}`;
    const fromName = props.user?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (fromName && fromName.length >= 3) return `@${fromName}`;
    return `@${props.user?.id?.slice(0, 8) ?? "user"}`;
  })();

  const memberId =
    props.user?.memberNumber != null
      ? String(props.user.memberNumber).padStart(6, "0")
      : "?";

  const avatarSrc = props.user?.image
    ? props.user.image.startsWith("http")
      ? `/api/proxy-image?src=${encodeURIComponent(props.user.image)}`
      : props.user.image
    : "";

  const pioneerDef = BADGE_CATALOG.find((b) => b.key === "pioneer");

  const roleName = useMemo(() => {
    switch (props.user.role) {
      case "USER":
        return "Member";
      case "EDITOR":
        return "Editor";
      case "ADMIN":
        return "Admin";
    }
  }, [props.user.role]);

  const handleCopy = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;

    try {
      const htmlToImage = await import("html-to-image");
      const filter = (n: HTMLElement | SVGElement) => {
        return !(
          n instanceof Element &&
          (n as Element).getAttribute("data-export-ignore") === "true"
        );
      };

      const blob = await htmlToImage.toBlob(node, {
        pixelRatio: Math.max(2, window.devicePixelRatio || 1),
        cacheBust: true,
        skipFonts: true,
        filter,
      });

      if (!blob) throw new Error("Failed to render image");

      if (
        typeof navigator.clipboard?.write === "function" &&
        typeof ClipboardItem !== "undefined"
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      } else {
        const dataUrl = await htmlToImage.toPng(node, {
          pixelRatio: Math.max(2, window.devicePixelRatio || 1),
          cacheBust: true,
          skipFonts: true,
          filter,
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "user-card.png";
        a.click();
      }
    } catch (err) {
      console.error("Failed to copy image:", err);
    }
  }, []);

  if (!props.user) return null;

  return (
    <div className="hidden flex-col items-center gap-8 sm:flex">
      <Tilt
        tiltReverse
        transitionSpeed={1800}
        trackOnWindow
        tiltMaxAngleX={12}
        tiltMaxAngleY={12}
        tiltAngleXInitial={-7}
        tiltAngleYInitial={7}
        glareEnable={true}
        glareMaxOpacity={0.2}
        glareColor="hsl(var(--primary))"
        glarePosition="top"
        glareBorderRadius="24px"
        gyroscope={isMobile}
      >
        <div
          ref={cardRef}
          className="border-muted bg-card relative aspect-[3/2] w-72 overflow-hidden rounded-3xl border-2 p-6 shadow-md sm:w-[500px]"
        >
          {/* Liquid gradient accent (bottom-right) */}
          {/* <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -bottom-24 z-0 h-[36rem] w-[36rem] opacity-20 blur-3xl"
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 70% 70%, #22d3ee 0%, transparent 60%), radial-gradient(55% 55% at 90% 85%, #a78bfa 0%, transparent 60%), radial-gradient(50% 50% at 110% 30%, #fb7185 0%, transparent 60%), radial-gradient(45% 45% at 85% 30%, #f59e0b 0%, transparent 60%), radial-gradient(40% 40% at 70% 100%, #f472b6 0%, transparent 60%), linear-gradient(135deg, transparent 0%, transparent 35%, #fde68a 45%, transparent 60%, #93c5fd 75%, transparent 100%)",
            }}
          /> */}
          <div className="relative z-10 flex h-full flex-col">
            {/* Lanyard cutout (just a centered full rounded rectangle) */}
            <div className="absolute top-0 -z-10 h-3 w-full rounded-3xl">
              <div className="flex h-full w-full items-center justify-center">
                <div className="bg-background border-border h-full w-16 rounded-3xl border" />
              </div>
            </div>
            {/* Top: Logo + All-Access */}
            <div className="flex items-start justify-between">
              <div className="text-foreground text-sm font-semibold">
                Sharply
              </div>
              <div className="text-muted-foreground text-xs tracking-[0.25em]">
                ALL-ACCESS
              </div>
            </div>

            <div className="border-border mt-2 border-t" />

            {/* Middle: Name/handle + QR */}
            <div className="mt-4 grid flex-1 grid-cols-2 gap-4">
              <div className="flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    {/* <Avatar className="h-10 w-10 ring-1 ring-slate-200 sm:h-12 sm:w-12">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>
                        {props.user.name?.split(" ")[0]}
                      </AvatarFallback>
                    </Avatar> */}
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs">
                        {roleName}
                      </div>
                      <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-4xl">
                        {displayName}
                      </h1>
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex items-end gap-2">
                  {/* Pioneer badge via BadgeTile */}
                  {pioneerDef ? (
                    <div className="origin-left scale-75 sm:scale-90">
                      <BadgeTile badge={pioneerDef} />
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs">
                      Sharply Founding Member
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Joined {joinedDate}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <QrCode className="text-foreground h-24 w-24 sm:h-32 sm:w-32" />
              </div>
            </div>

            <div className="border-border mb-2 border-t" />

            {/* Bottom: Member Id */}
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-xs tracking-widest uppercase">
                Member Id
              </div>

              <HyperText
                className="text-foreground font-mono text-sm"
                duration={2000}
                characterSet={[
                  "0",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                ]}
              >
                {`#${memberId}`}
              </HyperText>
            </div>
          </div>
        </div>
      </Tilt>
      <div className="flex flex-col items-center gap-2">
        <div className="mt-2 flex justify-center">
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <Button
              variant="outline"
              type="button"
              onClick={handleCopy}
              icon={<ClipboardCopy />}
            >
              Copy Card to Clipboard
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" icon={<UserPen />}>
                  Update Display Name
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update display name</DialogTitle>
                  <DialogDescription>
                    This is the name other users see on your profile and
                    reviews.
                  </DialogDescription>
                </DialogHeader>
                <SettingsForm
                  defaultName={displayName}
                  onSuccess={(name) => {
                    setDisplayName(name);
                    router.refresh();
                    toast.success("Display name updated");
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          You can view your card again or change your display name later in your
          profile.
        </p>
      </div>
    </div>
  );
}
