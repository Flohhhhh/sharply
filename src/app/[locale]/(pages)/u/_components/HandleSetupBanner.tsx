"use client";

import { AlertCircle,PenTool } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Alert,AlertDescription,AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

export function HandleSetupBanner() {
  const t = useTranslations("userProfile");
  return (
    <Alert className="mb-8 rounded-xl border-blue-500/50 bg-blue-500/10">
      <AlertCircle className="h-4 w-4" />
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AlertTitle className="text-primary text-base font-bold">
            {t("handleBannerTitle")}
          </AlertTitle>
          <AlertDescription className="text-base">
            {t("handleBannerDescription")}
          </AlertDescription>
        </div>
        <Button asChild icon={<PenTool />}>
          <Link href="/profile/settings">{t("handleBannerCta")}</Link>
        </Button>
      </div>
    </Alert>
  );
}
