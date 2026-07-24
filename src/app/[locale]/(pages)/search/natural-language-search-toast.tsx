"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { BRANDS } from "~/lib/constants";
import { getMountLongName } from "~/lib/mapping/mounts-map";
import type { ParsedSearchIntentKind } from "~/types/search";

type BrandConst = {
  slug: string;
  name: string;
};

const BRAND_LIST = BRANDS as BrandConst[];

function getBrandName(slug: string | null) {
  if (!slug) return null;
  return BRAND_LIST.find((brand) => brand.slug === slug)?.name ?? slug;
}

function buildDescription(params: {
  kind: ParsedSearchIntentKind;
  subject: string;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  switch (params.kind) {
    case "brand-lenses":
      return params.t("smartSearchBrandLensesTitle", {
        brand: params.subject,
      });
    case "mount-lenses":
      return params.t("smartSearchMountLensesTitle", {
        mount: params.subject,
      });
    case "lenses-for-camera":
      return params.t("smartSearchLensesForCameraTitle", {
        camera: params.subject,
      });
    case "brand-cameras":
      return params.t("smartSearchBrandCamerasTitle", {
        brand: params.subject,
      });
    case "mount-cameras":
      return params.t("smartSearchMountCamerasTitle", {
        mount: params.subject,
      });
  }
}

export function NaturalLanguageSearchToast() {
  const t = useTranslations("search");
  const rawPathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("nl") !== "1") return;

    const kind = searchParams.get("nlIntent") as ParsedSearchIntentKind | null;
    const subjectFromMarker = searchParams.get("nlSubject");
    const subject =
      subjectFromMarker ||
      getBrandName(searchParams.get("brand")) ||
      (searchParams.get("mount")
        ? getMountLongName(searchParams.get("mount"))
        : null);

    if (!kind || !subject) return;

    toast.info(t("smartSearchApplied"), {
      description: buildDescription({ kind, subject, t }),
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("nl");
    nextParams.delete("nlIntent");
    nextParams.delete("nlSubject");

    router.replace(
      nextParams.size > 0
        ? `${rawPathname}?${nextParams.toString()}`
        : rawPathname,
      { scroll: false },
    );
  }, [rawPathname, router, searchParams, t]);

  return null;
}
