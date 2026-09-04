"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSession } from "~/lib/auth/auth-client";

interface SignInToEditSpecsCtaProps {
  slug: string;
  gearType: "CAMERA" | "ANALOG_CAMERA" | "LENS";
}

export function SignInToEditSpecsCta({
  slug,
  gearType,
}: SignInToEditSpecsCtaProps) {
  const { data, isPending } = useSession();
  const session = data?.session;
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const callbackUrl = React.useMemo(
    () => `/gear/${slug}/edit?type=${gearType}`,
    [slug, gearType],
  );

  // Keep the server and initial client render aligned while the session is
  // loading. The server cannot read the client auth atom, so rendering the
  // signed-out CTA before the request completes causes a hydration mismatch
  // for signed-in users.
  if (!hasMounted || isPending || session) return null;

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
