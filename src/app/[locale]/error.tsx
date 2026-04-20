"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import NotFound from "./not-found";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  // If Next.js signaled a 404 via its special digest, render our NotFound UI
  if (error.digest === "NEXT_NOT_FOUND") {
    return <NotFound />;
  }

  // Fallback for custom errors that encode 404 in the message
  if (error.message.includes("404")) {
    return <NotFound />;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold">{t("genericTitle")}</h2>
      <Button type="button" onClick={() => reset()}>
        {t("tryAgain")}
      </Button>
    </div>
  );
}
