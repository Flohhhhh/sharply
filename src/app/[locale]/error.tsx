"use client"; // Error boundaries must be Client Components

import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import NotFound from "./not-found";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const isNotFound =
    error.digest === "NEXT_NOT_FOUND" || error.status === 404;

  useEffect(() => {
    if (!isNotFound) {
      Sentry.captureException(error);
    }
  }, [error, isNotFound]);

  if (isNotFound) {
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
