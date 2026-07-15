"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Client component that handles the "already has a pending edit" case.
 *
 * Rendered by the (.)edit intercepting route instead of a server-side
 * `redirect()`. A server redirect inside a parallel-route interception slot
 * causes the Next.js router to re-fetch the slot on every prefetch / soft-nav,
 * producing a runaway request loop (~100+ req/s from a single tab).
 *
 * This component navigates back on the client and shows a toast, which avoids
 * the RSC re-fetch loop entirely.
 */
export function EditAlreadyPendingRedirect({
  slug,
  pendingId,
}: {
  slug: string;
  pendingId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/gear/${slug}?editAlreadyPending=1&id=${pendingId}`, {
      scroll: false,
    });
  }, [router, slug, pendingId]);

  return null;
}
