"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function UserPendingEditBanner({ slug }: { slug: string }) {
  const { data: session, status } = useSession();
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const run = async () => {
      try {
        const res = await fetch(`/api/gear/${slug}/edits`);
        if (!res.ok) return;
        const data = await res.json();
        setPendingEditId(data?.pendingEditId ?? null);
      } catch {
        // ignore
      }
    };

    run();
  }, [session, status, slug]);

  if (status !== "authenticated" || !pendingEditId) return null;

  return (
    <div className="border-border bg-muted/50 text-muted-foreground mb-6 rounded-md border px-4 py-3 text-sm">
      You have a recent suggestion pending review.{" "}
      <Link
        href={`/edit-success?id=${pendingEditId}`}
        className="text-primary underline"
      >
        View submission
      </Link>
      .
    </div>
  );
}
