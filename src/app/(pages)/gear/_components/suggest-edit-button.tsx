"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Clock, Loader2 } from "lucide-react";

type GearType = "CAMERA" | "LENS";

interface SuggestEditButtonProps {
  slug: string;
  gearType: GearType;
  variant?: "primary" | "secondary";
}

export function SuggestEditButton({
  slug,
  gearType,
  variant = "primary",
}: SuggestEditButtonProps) {
  const { data: session, status } = useSession();
  const [hasPending, setHasPending] = useState<boolean>(false);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/gear/${slug}/edits`);
        if (!res.ok) return;
        const data = await res.json();
        setHasPending(Boolean(data?.pendingEditId));
      } catch {
        setHasPending(false);
      }
    };
    if (status === "authenticated") run();
  }, [slug, status]);

  const className = useMemo(() => {
    const base =
      "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors";
    const style =
      variant === "secondary"
        ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        : "bg-primary hover:bg-primary/90 text-primary-foreground";
    return `${style} ${base}`;
  }, [variant]);

  const targetUrl = useMemo(() => {
    const editPath = `/gear/${slug}/edit?type=${gearType}`;
    if (status !== "authenticated") {
      return `/api/auth/signin?callbackUrl=${encodeURIComponent(editPath)}`;
    }
    return editPath;
  }, [slug, gearType, status]);

  if (status === "authenticated" && hasPending) {
    return (
      <Button disabled variant="secondary" icon={<Clock className="size-4" />}>
        Edit Request Pending
      </Button>
    );
  }

  return (
    <Link scroll={false} href={targetUrl} className={className}>
      Suggest Edit
    </Link>
  );
}
