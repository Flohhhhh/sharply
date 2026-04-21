"use client";

import { useSession } from "~/lib/auth/auth-client";
import Link from "next/link";
import React from "react";

interface SignInToEditSpecsCtaProps {
  slug: string;
  gearType: "CAMERA" | "ANALOG_CAMERA" | "LENS";
}

export function SignInToEditSpecsCta({
  slug,
  gearType,
}: SignInToEditSpecsCtaProps) {
  const { data, isPending, error } = useSession();
  const session = data?.session;

  const callbackUrl = React.useMemo(
    () => `/gear/${slug}/edit?type=${gearType}`,
    [slug, gearType],
  );

  // If the user is authenticated, don't show the CTA
  if (session) return null;

  return (
    <div className="border-border bg-muted/60 text-muted-foreground my-8 rounded-md border px-4 py-3 text-sm">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <span className="block">Want to help improve these specs?</span>
          <span className="block text-xs opacity-90">
            Sharply gear specs are crowdsourced by the community. Your edits are
            reviewed for accuracy before they go live.
          </span>
        </div>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        >
          Sign in to edit specs
        </Link>
      </div>
    </div>
  );
}
