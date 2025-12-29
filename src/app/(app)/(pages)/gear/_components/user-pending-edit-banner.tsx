"use client";

import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth/auth-client";

export function UserPendingEditBanner({ slug }: { slug: string }) {
  const { data } = useSession();

  const session = data?.session;

  const [pendingEdit, setPendingEdit] = useState<{
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "MERGED";
  } | null>(null);

  useEffect(() => {
    if (!session) return;

    const run = async () => {
      try {
        const res = await fetch(`/api/gear/${slug}/pending-edit`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.pendingEdit) {
          setPendingEdit(data.pendingEdit);
        } else {
          setPendingEdit(null);
        }
      } catch {}
    };

    run().catch((error) => {
      console.error("[UserPendingEditBanner] error", error);
    });
  }, [session, slug]);

  if (!session || !pendingEdit) return null;

  if (pendingEdit.status !== "PENDING") return null;

  return (
    <div className="border-border bg-muted/50 text-muted-foreground mb-6 rounded-md border px-4 py-3 text-sm">
      You have a recent suggestion pending review.{" "}
      <button
        type="button"
        onClick={() => {
          window.location.href = `/edit-success?id=${pendingEdit.id}`;
        }}
        className="text-primary underline"
      >
        View submission
      </button>
      .
    </div>
  );
}
