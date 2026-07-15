"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Reads the `editAlreadyPending` search param set by the edit route redirect,
 * shows a user-facing toast, and cleans up the URL.
 *
 * Mirrors the pattern used by `EditAppliedToast` for the `editApplied` param.
 */
export function EditAlreadyPendingToast() {
  const rawPathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("editAlreadyPending") !== "1") return;

    toast.info("You already have a pending edit for this item.", {
      description: "Your previous suggestion is still under review.",
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("editAlreadyPending");
    nextParams.delete("id");

    router.replace(
      nextParams.size > 0
        ? `${rawPathname}?${nextParams.toString()}`
        : rawPathname,
      { scroll: false },
    );
  }, [rawPathname, router, searchParams]);

  return null;
}
