"use client";

import { usePathname,useRouter,useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function EditAppliedToast() {
  const rawPathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("editApplied") !== "1") return;

    toast.success("Your change request was automatically approved!", {
      description: "Your update is already live on this gear page.",
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("editApplied");

    router.replace(
      nextParams.size > 0
        ? `${rawPathname}?${nextParams.toString()}`
        : rawPathname,
      { scroll: false },
    );
  }, [rawPathname, router, searchParams]);

  return null;
}
