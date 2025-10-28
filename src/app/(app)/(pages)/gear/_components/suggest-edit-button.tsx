"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Clock, Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type GearType = "CAMERA" | "LENS";

interface SuggestEditButtonProps {
  slug: string;
  gearType: GearType;
  variant?: "primary" | "secondary" | "link";
  label?: string;
  searchParams?: Record<string, string | number | boolean>;
  compact?: boolean;
}

export function SuggestEditButton({
  slug,
  gearType,
  variant = "primary",
  label = "Suggest Edit",
  searchParams,
  compact,
}: SuggestEditButtonProps) {
  const { status } = useSession();
  const [hasPending, setHasPending] = useState<boolean>(false);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/gear/${slug}/pending-edit`);
        if (!res.ok) return;
        const data = await res.json();
        setHasPending(Boolean(data?.pendingEdit));
      } catch {
        setHasPending(false);
      }
    };
    if (status === "authenticated")
      run().catch((error) => {
        console.error("[SuggestEditButton] error", error);
      });
  }, [slug, status]);

  const targetUrl = useMemo(() => {
    const qp = new URLSearchParams();
    qp.set("type", gearType);
    if (searchParams) {
      for (const [k, v] of Object.entries(searchParams)) {
        qp.set(k, String(v));
      }
    }
    const editPath = `/gear/${slug}/edit?${qp.toString()}`;
    if (status !== "authenticated") {
      return `/api/auth/signin?callbackUrl=${encodeURIComponent(editPath)}`;
    }
    return editPath;
  }, [slug, gearType, status, searchParams]);

  const buttonVariant = variant === "primary" ? "default" : variant;

  if (status === "authenticated" && hasPending) {
    const pendingContent = (
      <>
        <Clock
          className={compact || buttonVariant === "link" ? "size-3" : "size-4"}
        />
        <span>Edit Request Pending</span>
      </>
    );

    // Compact or link-style: render inline text instead of a full button
    if (compact || buttonVariant === "link") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
              {pendingContent}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            You already have an open change request for this item.
          </TooltipContent>
        </Tooltip>
      );
    }

    // Default disabled button appearance
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              disabled
              size="sm"
              variant={buttonVariant}
              icon={<Clock className="size-4" />}
            >
              Edit Request Pending
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          You already have an open change request for this item.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button asChild size="sm" icon={<Pencil />} variant={buttonVariant as any}>
      <Link scroll={false} href={targetUrl}>
        {label}
      </Link>
    </Button>
  );
}
