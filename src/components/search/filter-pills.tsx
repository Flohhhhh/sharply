"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { mergeSearchParams } from "@utils/url";

export function FilterPills() {
  const sp = useSearchParams();
  const router = useRouter();

  const entries: { key: string; label: string; value: string }[] = [];
  const q = sp.get("q") ?? "";
  const brand = sp.get("brand") ?? "";
  const gearType = sp.get("gearType") ?? "";
  const mount = sp.get("mount") ?? "";
  const sensor = sp.get("sensorFormat") ?? "";
  const priceMin = sp.get("priceMin") ?? "";
  const priceMax = sp.get("priceMax") ?? "";

  if (brand) entries.push({ key: "brand", label: "Brand", value: brand });
  if (gearType)
    entries.push({ key: "gearType", label: "Type", value: gearType });
  if (mount)
    entries.push({
      key: "mount",
      label: "Mount",
      value: mount.split("-")[0]?.toUpperCase() || mount,
    });
  if (sensor)
    entries.push({ key: "sensorFormat", label: "Sensor", value: sensor });
  if (priceMin || priceMax) {
    const v = `${priceMin ? "$" + priceMin : "Any"} – ${priceMax ? "$" + priceMax : "No max"}`;
    entries.push({ key: "price", label: "Price", value: v });
  }

  function remove(key: string) {
    const existing = new URLSearchParams(sp.toString());
    const qs = mergeSearchParams(
      existing,
      key === "price"
        ? { priceMin: null, priceMax: null, page: 1 }
        : { [key]: null, page: 1 },
    );
    const href = qs ? `/search?${qs}` : "/search";
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
            aria-label={`Remove ${e.label} filter`}
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
