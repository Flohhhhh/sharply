"use client";

import { mergeSearchParams } from "@utils/url";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname,useRouter,useSearchParams } from "next/navigation";
import { useLocalePathnames } from "~/i18n/client";

export function FilterPills() {
  const t = useTranslations("search");
  const sp = useSearchParams();
  const router = useRouter();
  const rawPathname = usePathname();
  const { pathname } = useLocalePathnames();

  const entries: { key: string; label: string; value: string }[] = [];
  const q = sp.get("q") ?? "";
  const brand = sp.get("brand") ?? "";
  const gearType = sp.get("gearType") ?? "";
  const mount = sp.get("mount") ?? "";
  const isBrowse = pathname.startsWith("/browse");
  const sensorParamKey = isBrowse ? "sensor" : "sensorFormat";
  const sensor = sp.get(sensorParamKey) ?? "";
  const priceMin =
    sp.get(pathname.startsWith("/browse") ? "minPrice" : "priceMin") ?? "";
  const priceMax =
    sp.get(pathname.startsWith("/browse") ? "maxPrice" : "priceMax") ?? "";

  if (brand) entries.push({ key: "brand", label: t("brand"), value: brand });
  if (gearType)
    entries.push({ key: "gearType", label: t("type"), value: gearType });
  if (mount)
    entries.push({
      key: "mount",
      label: t("mount"),
      value: mount.split("-")[0]?.toUpperCase() || mount,
    });
  if (sensor)
    entries.push({ key: sensorParamKey, label: t("sensor"), value: sensor });
  if (priceMin || priceMax) {
    const v = `${priceMin ? "$" + priceMin : t("any")} – ${priceMax ? "$" + priceMax : t("noMax")}`;
    entries.push({ key: "price", label: t("price"), value: v });
  }

  function remove(key: string) {
    const existing = new URLSearchParams(sp.toString());
    const qs = mergeSearchParams(
      existing,
      key === "price"
        ? isBrowse
          ? { minPrice: null, maxPrice: null, page: 1 }
          : { priceMin: null, priceMax: null, page: 1 }
        : { [key]: null, page: 1 },
    );
    const href = qs ? `${rawPathname}?${qs}` : rawPathname;
    router.replace(href);
  }

  if (entries.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {entries.map((e) => (
        <span
          key={`${e.key}-${e.value}`}
          className="border-input text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
        >
          <span className="opacity-70">{e.label}:</span>
          <span className="font-medium">{e.value}</span>
          <button
            onClick={() => remove(e.key)}
            aria-label={t("removeFilter", { label: e.label })}
            className="hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {q && <span className="text-xs opacity-50">•</span>}
    </div>
  );
}
