"use client";

import { Clock, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { LinkButton } from "~/components/ui/link-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useSession } from "~/lib/auth/auth-client";

type GearType = "CAMERA" | "ANALOG_CAMERA" | "LENS";

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
  label,
  searchParams,
  compact,
}: SuggestEditButtonProps) {
  const t = useTranslations("gearDetail");
  const { data, isPending } = useSession();

  const session = data?.session;
  const [hasMounted, setHasMounted] = useState(false);
  const [hasPending, setHasPending] = useState<boolean>(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    if (session && !isPending)
      run().catch((error) => {
        console.error("[SuggestEditButton] error", error);
      });
  }, [isPending, session, slug]);

  const sessionForRender = hasMounted && !isPending ? session : null;

  const targetUrl = useMemo(() => {
    const qp = new URLSearchParams();
    qp.set("type", gearType);
    if (searchParams) {
      for (const [k, v] of Object.entries(searchParams)) {
        qp.set(k, String(v));
      }
    }
    const editPath = `/gear/${slug}/edit?${qp.toString()}`;
    if (!sessionForRender) {
      return `/auth/signin?callbackUrl=${encodeURIComponent(editPath)}`;
    }
    return editPath;
  }, [gearType, searchParams, sessionForRender, slug]);

  const buttonVariant = variant === "primary" ? "default" : variant;

  if (sessionForRender && hasPending) {
    const pendingContent = (
      <>
        <Clock
          className={compact || buttonVariant === "link" ? "size-3" : "size-4"}
        />
        <span>{t("editRequestPending")}</span>
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
          <TooltipContent>{t("existingOpenChangeRequest")}</TooltipContent>
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
              {t("editRequestPending")}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{t("existingOpenChangeRequest")}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <LinkButton
      href={targetUrl}
      icon={<Pencil />}
      scroll={false}
      size="sm"
      variant={buttonVariant}
    >
      {label ?? t("suggestEdit")}
    </LinkButton>
  );
}
