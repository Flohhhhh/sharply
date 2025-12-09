"use client";

import { useCallback, memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { DateInput } from "~/components/custom-inputs";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import CurrencyInput from "~/components/custom-inputs/currency-input";
import { NumberInput } from "~/components/custom-inputs/number-input";
import { MountSelect } from "~/components/custom-inputs/mount-select";
import MultiSelect from "~/components/ui/multi-select";
import { GENRES } from "~/lib/constants";
import { centsToUsd, usdToCents } from "~/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import {
  normalizeAmazonProductLink,
  toDisplayAmazonProductLink,
} from "~/lib/validation/amazon";
import { useSession } from "next-auth/react";
import type { UserRole } from "~/server/auth";

interface CoreFieldsProps {
  currentSpecs: {
    announcedDate: Date | null;
    releaseDate: Date | null;
    msrpNowUsdCents?: number | null;
    msrpAtLaunchUsdCents?: number | null;
    mpbMaxPriceUsdCents?: number | null;
    mountId?: string | null; // Legacy single mount (cameras)
    mountIds?: string[] | null; // New multi-mount support (lenses)
    weightGrams: number | null;
    widthMm?: number | null;
    heightMm?: number | null;
    depthMm?: number | null;
    linkManufacturer?: string | null;
    linkMpb?: string | null;
    linkAmazon?: string | null;
    genres?: string[] | null;
  };
  gearType?: "CAMERA" | "LENS";
  showMissingOnly?: boolean;
  initialSpecs?: CoreFieldsProps["currentSpecs"]; // initial snapshot for filtering only
  onChange: (field: string, value: any) => void;
  sectionId?: string;
}

function CoreFieldsComponent({
  currentSpecs,
  gearType,
  showMissingOnly,
  initialSpecs,
  onChange,
  sectionId,
}: CoreFieldsProps) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: UserRole } | null | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  const isMissing = useCallback((v: unknown): boolean => {
    if (v == null) return true;
    if (typeof v === "string") return v.trim().length === 0;
    if (Array.isArray(v)) return v.length === 0;
    return false;
  }, []);

  const showWhenMissing = useCallback(
    (v: unknown): boolean => !showMissingOnly || isMissing(v),
    [showMissingOnly, isMissing],
  );

  const handleMountChange = useCallback(
    (value: string | string[]) => {
      console.log("handleMountChange", value);
      // Always update canonical mountIds (array). Legacy mountId is derived server-side.
      const ids = Array.isArray(value) ? value : value ? [value] : [];
      onChange("mountIds", ids.length ? ids : null);
    },
    [onChange],
  );

  const handleLensDiameterChange = useCallback(
    (value: number | null) => {
      const nextValue = value ?? null;
      onChange("widthMm", nextValue);
      onChange("heightMm", nextValue);
    },
    [onChange],
  );

  const handleLensLengthChange = useCallback(
    (value: number | null) => {
      onChange("depthMm", value ?? null);
    },
    [onChange],
  );

  const handleReleaseDateChange = useCallback(
    (value: string) => {
      if (!value) {
        onChange("releaseDate", null);
        return;
      }
      const [yStr, mStr, dStr] = value.split("-");
      const y = Number(yStr);
      const m = Number(mStr);
      const d = Number(dStr);
      const utcDate = new Date(Date.UTC(y, m - 1, d));
      onChange("releaseDate", utcDate);
    },
    [onChange],
  );

  const handleAnnouncedDateChange = useCallback(
    (value: string) => {
      if (!value) {
        onChange("announcedDate", null);
        return;
      }
      const [yStr, mStr, dStr] = value.split("-");
      const y = Number(yStr);
      const m = Number(mStr);
      const d = Number(dStr);
      const utcDate = new Date(Date.UTC(y, m - 1, d));
      onChange("announcedDate", utcDate);
    },
    [onChange],
  );

  const handleMsrpNowChange = useCallback(
    (value: number | undefined) => {
      onChange("msrpNowUsdCents", usdToCents(value));
    },
    [onChange],
  );

  const handleMsrpAtLaunchChange = useCallback(
    (value: number | undefined) => {
      onChange("msrpAtLaunchUsdCents", usdToCents(value));
    },
    [onChange],
  );

  const handleMpbMaxPriceChange = useCallback(
    (value: number | undefined) => {
      onChange("mpbMaxPriceUsdCents", usdToCents(value));
    },
    [onChange],
  );

  const handleLinkChange = useCallback(
    (field: "linkManufacturer" | "linkMpb" | "linkAmazon", value: string) => {
      const v = value.trim();
      onChange(field, v.length ? v : null);
    },
    [onChange],
  );

  const [amazonNoticeUrl, setAmazonNoticeUrl] = useState<string | null>(null);
  const [amazonPreviewUrl, setAmazonPreviewUrl] = useState<string | null>(null);

  const handleAmazonLinkInputChange = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      onChange("linkAmazon", trimmed.length ? trimmed : null);
      // While typing, show a preview if we can canonicalize and it's different
      const canonical = normalizeAmazonProductLink(value);
      if (canonical && canonical !== trimmed) {
        const display = toDisplayAmazonProductLink(canonical) || canonical;
        setAmazonPreviewUrl(display);
      } else {
        setAmazonPreviewUrl(null);
      }
      // Clear any prior post-blur notice while user edits
      setAmazonNoticeUrl(null);
    },
    [onChange],
  );

  const handleAmazonLinkBlur = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const canonical = normalizeAmazonProductLink(value);
      if (canonical) {
        onChange("linkAmazon", canonical);
        // Only show the post-blur notice if we actually changed it
        setAmazonNoticeUrl(canonical !== trimmed ? canonical : null);
        setAmazonPreviewUrl(null);
        return;
      }
      // Fallback to standard trim/null behavior if not canonicalizable
      onChange("linkAmazon", trimmed.length ? trimmed : null);
      setAmazonNoticeUrl(null);
      setAmazonPreviewUrl(null);
    },
    [onChange],
  );

  // Safely format the date for the input
  const formattedAnnouncedDate = useMemo(() => {
    if (!currentSpecs.announcedDate) return "";
    try {
      const d = currentSpecs.announcedDate;
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  }, [currentSpecs.announcedDate]);

  const formattedReleaseDate = useMemo(() => {
    if (!currentSpecs.releaseDate) return "";
    try {
      const d = currentSpecs.releaseDate;
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  }, [currentSpecs.releaseDate]);

  // Safely format the current MSRP and launch MSRP for the inputs (convert cents to dollars)
  const formattedMsrpNow = useMemo(() => {
    return centsToUsd(currentSpecs.msrpNowUsdCents);
  }, [currentSpecs.msrpNowUsdCents]);

  const formattedMsrpAtLaunch = useMemo(() => {
    return centsToUsd(currentSpecs.msrpAtLaunchUsdCents);
  }, [currentSpecs.msrpAtLaunchUsdCents]);

  const formattedMpbMaxPrice = useMemo(() => {
    return centsToUsd(currentSpecs.mpbMaxPriceUsdCents);
  }, [currentSpecs.mpbMaxPriceUsdCents]);

  // Safely format the weight for the input
  const formattedWeight = useMemo(() => {
    if (
      currentSpecs.weightGrams === null ||
      currentSpecs.weightGrams === undefined
    )
      return null;
    return currentSpecs.weightGrams;
  }, [currentSpecs.weightGrams]);

  const formattedWidth = useMemo(() => {
    return currentSpecs.widthMm != null ? currentSpecs.widthMm : null;
  }, [currentSpecs.widthMm]);

  const formattedHeight = useMemo(() => {
    return currentSpecs.heightMm != null ? currentSpecs.heightMm : null;
  }, [currentSpecs.heightMm]);

  const formattedDepth = useMemo(() => {
    return currentSpecs.depthMm != null ? currentSpecs.depthMm : null;
  }, [currentSpecs.depthMm]);

  const formattedLensDiameter = useMemo(() => {
    if (gearType !== "LENS") return null;
    if (currentSpecs.widthMm != null) return currentSpecs.widthMm;
    if (currentSpecs.heightMm != null) return currentSpecs.heightMm;
    return null;
  }, [gearType, currentSpecs.widthMm, currentSpecs.heightMm]);

  const formattedLensLength = useMemo(() => {
    if (gearType !== "LENS") return null;
    return currentSpecs.depthMm != null ? currentSpecs.depthMm : null;
  }, [gearType, currentSpecs.depthMm]);

  // Safely format the mount value(s) for the select
  const formattedMountValue = useMemo(() => {
    if (gearType === "CAMERA") {
      // Single-select expects a single id string
      const firstFromArray = Array.isArray(currentSpecs.mountIds)
        ? currentSpecs.mountIds[0]
        : undefined;
      if (firstFromArray) return firstFromArray;
      // Fallback to legacy mountId for existing records
      return (currentSpecs.mountId as string | undefined) || "";
    }

    // For lenses (multi select), prefer mountIds and include legacy as fallback for display
    const fromArray = Array.isArray(currentSpecs.mountIds)
      ? currentSpecs.mountIds
      : [];
    const fromLegacy = currentSpecs.mountId ? [currentSpecs.mountId] : [];
    return Array.from(new Set<string>([...fromArray, ...fromLegacy]));
  }, [currentSpecs.mountIds, currentSpecs.mountId, gearType]);

  // Genres options and values
  const genreOptions = useMemo(
    () =>
      (GENRES as any[]).map((g) => ({
        id: (g.slug as string) ?? (g.id as string),
        name: (g.name as string) ?? ((g.slug as string) || ""),
      })),
    [],
  );
  const formattedGenres = useMemo(() => {
    return Array.isArray(currentSpecs.genres) ? currentSpecs.genres : [];
  }, [currentSpecs.genres]);

  return (
    <Card
      id={sectionId}
      className="rounded-md border-0 bg-transparent px-0 py-0"
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="flex flex-col gap-3">
          {/* Announced Date + Precision (paired) */}
          {(() => {
            const showPair =
              showWhenMissing((initialSpecs as any)?.announcedDate) ||
              showWhenMissing((initialSpecs as any)?.announceDatePrecision);
            if (!showPair) return null;
            return (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Announced Date Precision</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="text-muted-foreground h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        Select a precision level for the date. For example,
                        selecting "Month" will display the date as "September
                        2025" instead of "September 5th 2025". Selecting"Year"
                        would only show the year. Day shows Year month and day.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={(currentSpecs as any).announceDatePrecision ?? "DAY"}
                    onValueChange={(v) =>
                      v && onChange("announceDatePrecision", v)
                    }
                    variant="outline"
                    className="w-full"
                  >
                    <ToggleGroupItem
                      className="data-[state=on]:bg-accent hover:bg-accent/50"
                      value="YEAR"
                    >
                      Year
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      className="data-[state=on]:bg-accent hover:bg-accent/50"
                      value="MONTH"
                    >
                      Month
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      className="data-[state=on]:bg-accent hover:bg-accent/50"
                      value="DAY"
                    >
                      Day
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <DateInput
                  label="Announced Date"
                  value={formattedAnnouncedDate}
                  onChange={handleAnnouncedDateChange}
                  granularity={
                    ((currentSpecs as any).announceDatePrecision as any) ===
                    "YEAR"
                      ? "year"
                      : ((currentSpecs as any).announceDatePrecision as any) ===
                          "MONTH"
                        ? "month"
                        : "day"
                  }
                />
              </>
            );
          })()}

          {/* Release Date + Precision (paired) */}
          {(() => {
            const showPair =
              showWhenMissing((initialSpecs as any)?.releaseDate) ||
              showWhenMissing((initialSpecs as any)?.releaseDatePrecision);
            if (!showPair) return null;
            return (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Release Date Precision</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="text-muted-foreground h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        Select a precision level for the date. For example,
                        selecting "Month" will display the date as "September
                        2025" instead of "September 5th 2025". Selecting"Year"
                        would only show the year. Day shows year, month and day.
                        Use when the full date is not available.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={(currentSpecs as any).releaseDatePrecision ?? "DAY"}
                    onValueChange={(v) =>
                      v && onChange("releaseDatePrecision", v)
                    }
                    variant="outline"
                    className="w-full"
                  >
                    <ToggleGroupItem
                      className="data-[state=on]:bg-accent hover:bg-accent/50"
                      value="YEAR"
                    >
                      Year
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      className="data-[state=on]:bg-accent hover:bg-accent/50"
                      value="MONTH"
                    >
                      Month
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      className="data-[state=on]:bg-accent hover:bg-accent/50"
                      value="DAY"
                    >
                      Day
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <DateInput
                  label="Release Date"
                  value={formattedReleaseDate}
                  onChange={handleReleaseDateChange}
                  granularity={
                    ((currentSpecs as any).releaseDatePrecision as any) ===
                    "YEAR"
                      ? "year"
                      : ((currentSpecs as any).releaseDatePrecision as any) ===
                          "MONTH"
                        ? "month"
                        : "day"
                  }
                />
              </>
            );
          })()}

          {showWhenMissing((initialSpecs as any)?.msrpNowUsdCents) && (
            <CurrencyInput
              id="msrpNow"
              label="MSRP now (USD)"
              value={formattedMsrpNow}
              onChange={handleMsrpNowChange}
              placeholder="0.00"
              min={0}
            />
          )}

          {showWhenMissing((initialSpecs as any)?.msrpAtLaunchUsdCents) && (
            <CurrencyInput
              id="msrpAtLaunch"
              label="MSRP at launch (USD)"
              value={formattedMsrpAtLaunch}
              onChange={handleMsrpAtLaunchChange}
              placeholder="0.00"
              min={0}
            />
          )}

          {showWhenMissing((initialSpecs as any)?.mpbMaxPriceUsdCents) && (
            <CurrencyInput
              id="mpbMaxPrice"
              label="MPB max price (USD)"
              value={formattedMpbMaxPrice}
              onChange={handleMpbMaxPriceChange}
              placeholder="0.00"
              min={0}
            />
          )}

          {showWhenMissing((initialSpecs as any)?.weightGrams) && (
            <NumberInput
              id="weight"
              label={gearType === "CAMERA" ? "Weight with battery" : "Weight"}
              value={formattedWeight}
              onChange={(v) => onChange("weightGrams", v)}
              min={0}
              placeholder={
                gearType === "CAMERA"
                  ? "Enter weight w/ battery"
                  : "Enter weight"
              }
              suffix="g"
              prefix="≈"
            />
          )}

          {(() => {
            const hadMounts = (() => {
              const ids = Array.isArray((initialSpecs as any)?.mountIds)
                ? ((initialSpecs as any)?.mountIds as string[])
                : [];
              const legacy = (initialSpecs as any)?.mountId;
              return (ids?.length ?? 0) > 0 || Boolean(legacy);
            })();
            if (showMissingOnly && hadMounts) return null;
            return (
              <MountSelect
                value={formattedMountValue}
                onChange={handleMountChange}
                mode={gearType === "CAMERA" ? "single" : "multiple"}
                label="Mount"
                placeholder={
                  gearType === "CAMERA"
                    ? "Select mount"
                    : "Select compatible mounts"
                }
              />
            );
          })()}

          {/* Dimensions */}
          {gearType === "LENS" ? (
            <>
              {(showWhenMissing((initialSpecs as any)?.widthMm) ||
                showWhenMissing((initialSpecs as any)?.heightMm)) && (
                <NumberInput
                  id="diameterMm"
                  label="Diameter"
                  value={formattedLensDiameter}
                  onChange={handleLensDiameterChange}
                  min={0}
                  step={0.1}
                  placeholder="e.g., 90.5"
                  suffix="mm"
                />
              )}
              {showWhenMissing((initialSpecs as any)?.depthMm) && (
                <NumberInput
                  id="lengthMm"
                  label="Length"
                  value={formattedLensLength}
                  onChange={handleLensLengthChange}
                  min={0}
                  step={0.1}
                  placeholder="e.g., 150"
                  suffix="mm"
                />
              )}
            </>
          ) : (
            <>
              {showWhenMissing((initialSpecs as any)?.widthMm) && (
                <NumberInput
                  id="widthMm"
                  label="Width"
                  value={formattedWidth}
                  onChange={(v) => onChange("widthMm", v)}
                  min={0}
                  step={0.1}
                  placeholder="e.g., 135.5"
                  suffix="mm"
                />
              )}
              {showWhenMissing((initialSpecs as any)?.heightMm) && (
                <NumberInput
                  id="heightMm"
                  label="Height"
                  value={formattedHeight}
                  onChange={(v) => onChange("heightMm", v)}
                  min={0}
                  step={0.1}
                  placeholder="e.g., 98.2"
                  suffix="mm"
                />
              )}
              {showWhenMissing((initialSpecs as any)?.depthMm) && (
                <NumberInput
                  id="depthMm"
                  label="Depth"
                  value={formattedDepth}
                  onChange={(v) => onChange("depthMm", v)}
                  min={0}
                  step={0.1}
                  placeholder="e.g., 75.8"
                  suffix="mm"
                />
              )}
            </>
          )}

          {showWhenMissing((initialSpecs as any)?.genres) && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label>Best use cases</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Select use cases where this gear excels, not just the ones
                      where it can satisfy a need.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <MultiSelect
                options={genreOptions}
                value={formattedGenres}
                onChange={(ids) => {
                  if (isAdmin) onChange("genres", ids);
                }}
                className={
                  !isAdmin ? "pointer-events-none opacity-60" : undefined
                }
                maxSelected={3}
                placeholder="Select top 3 use cases..."
                searchPlaceholder="Search genres..."
              />
            </div>
          )}

          {showWhenMissing((initialSpecs as any)?.linkManufacturer) && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="linkManufacturer">Manufacturer Link</Label>
              <input
                id="linkManufacturer"
                type="url"
                value={currentSpecs.linkManufacturer || ""}
                onChange={(e) =>
                  handleLinkChange("linkManufacturer", e.target.value)
                }
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://manufacturer.example.com/product"
              />
            </div>
          )}

          {showWhenMissing((initialSpecs as any)?.linkMpb) && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="linkMpb">MPB Link</Label>
              <input
                id="linkMpb"
                type="url"
                value={currentSpecs.linkMpb || ""}
                onChange={(e) => handleLinkChange("linkMpb", e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://www.mpb.com/..."
              />
            </div>
          )}

          {showWhenMissing((initialSpecs as any)?.linkAmazon) && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="linkAmazon">Amazon Link</Label>
              <input
                id="linkAmazon"
                type="url"
                value={currentSpecs.linkAmazon || ""}
                onChange={(e) => handleAmazonLinkInputChange(e.target.value)}
                onBlur={(e) => handleAmazonLinkBlur(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://amazon.com/..."
              />
              {amazonNoticeUrl ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  This link was automatically changed to{" "}
                  <a
                    href={amazonNoticeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {toDisplayAmazonProductLink(amazonNoticeUrl) ||
                      amazonNoticeUrl}
                  </a>
                  . Please verify it still works.
                </p>
              ) : (
                amazonPreviewUrl && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    This link will be saved as{" "}
                    <a
                      href={amazonPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {amazonPreviewUrl}
                    </a>
                    . Please verify it will work.
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const CoreFields = memo(CoreFieldsComponent);
