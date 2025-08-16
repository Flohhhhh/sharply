"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function EditPendingToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const flag = searchParams.get("editAlreadyPending");
    const id = searchParams.get("id");
    if (flag === "1") {
      toast.error(
        (
          <span>
            You already have a submission pending review.{" "}
            {id ? (
              <a href={`/edit-success?id=${id}`} className="underline">
                View submission
              </a>
            ) : null}
            .
          </span>
        ) as unknown as string,
      );
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("editAlreadyPending");
      sp.delete("id");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }, [searchParams, pathname, router]);

  return null;
}
