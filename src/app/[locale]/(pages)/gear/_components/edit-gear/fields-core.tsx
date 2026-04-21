"use client";

import { InfoIcon } from "lucide-react";
import { memo,useCallback,useEffect,useMemo,useState } from "react";
import { DateInput } from "~/components/custom-inputs";
import CurrencyInput from "~/components/custom-inputs/currency-input";
import { MountSelect } from "~/components/custom-inputs/mount-select";
import { NumberInput } from "~/components/custom-inputs/number-input";
import { Card,CardContent,CardHeader,CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import MultiSelect from "~/components/ui/multi-select";
import { ToggleGroup,ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useSession } from "~/lib/auth/auth-client";
import { requireRole } from "~/lib/auth/auth-helpers";
import { GENRES } from "~/lib/constants";
import { formatDateInputValue } from "~/lib/format/date";
import { normalizeMpbLinkInput } from "~/lib/links/mpb";
import { centsToUsd,usdToCents } from "~/lib/utils";
import {
  normalizeAmazonProductLink,
  toDisplayAmazonProductLink,
} from "~/lib/validation/amazon";
import { normalizeBhProductLink } from "~/lib/validation/bhphoto";

type DatePrecision = "YEAR" | "MONTH" | "DAY";

type GenreOptionSource = {
  id?: string;
  slug?: string;
  name?: string;
};

interface CoreFieldsProps {
  currentSpecs: {
    announcedDate: Date | null;
    announceDatePrecision?: DatePrecision | null;
    releaseDate: Date | null;
    releaseDatePrecision?: DatePrecision | null;
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
    linkBh?: string | null;
    linkAmazon?: string | null;
    genres?: string[] | null;
  };
  gearType?: "CAMERA" | "ANALOG_CAMERA" | "LENS";
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
  const { data, isPending, error } = useSession();

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
    (
      field: "linkManufacturer" | "linkMpb" | "linkAmazon" | "linkBh",
      value: string,
    ) => {
      const v = value.trim();
      onChange(field, v.length ? v : null);
    },
    [onChange],
  );

  const [amazonNoticeUrl, setAmazonNoticeUrl] = useState<string | null>(null);
  const [amazonPreviewUrl, setAmazonPreviewUrl] = useState<string | null>(null);
  const [mpbInputValue, setMpbInputValue] = useState(
    currentSpecs.linkMpb || "",
  );
  const [mpbNoticeUrl, setMpbNoticeUrl] = useState<string | null>(null);
  const [mpbPreviewUrl, setMpbPreviewUrl] = useState<string | null>(null);
  const [mpbError, setMpbError] = useState<string | null>(null);

  useEffect(() => {
    setMpbInputValue(currentSpecs.linkMpb || "");
  }, [currentSpecs.linkMpb]);

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

  const handleBhLinkBlur = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const canonical = normalizeBhProductLink(value);
      if (canonical) {
        onChange("linkBh", canonical);
        return;
      }
      onChange("linkBh", trimmed.length ? trimmed : null);
    },
    [onChange],
  );

  const handleMpbLinkInputChange = useCallback((value: string) => {
    setMpbInputValue(value);
    setMpbNoticeUrl(null);
    setMpbError(null);

    const result = normalizeMpbLinkInput(value);
    if (result.kind === "product" && result.wasNormalized) {
      setMpbPreviewUrl(result.normalizedPath);
      return;
    }

    setMpbPreviewUrl(null);
  }, []);

  const handleMpbLinkBlur = useCallback(
    (value: string) => {
      const result = normalizeMpbLinkInput(value);

      if (result.kind === "empty") {
        setMpbInputValue("");
        setMpbNoticeUrl(null);
        setMpbPreviewUrl(null);
        setMpbError(null);
        onChange("linkMpb", null);
        return;
      }

      if (result.kind === "product") {
        setMpbInputValue(result.normalizedPath);
        setMpbNoticeUrl(result.wasNormalized ? result.normalizedPath : null);
        setMpbPreviewUrl(null);
        setMpbError(null);
        onChange("linkMpb", result.normalizedPath);
        return;
      }

      setMpbNoticeUrl(null);
      setMpbPreviewUrl(null);
      setMpbError(
        result.kind === "search"
          ? "MPB search URLs are no longer supported. Paste the MPB link with any fit instead."
          : "Paste an MPB product link or relative product path.",
      );
    },
    [onChange],
  );

  // Safely format the date for the input
  const formattedAnnouncedDate = useMemo(() => {
    return formatDateInputValue(currentSpecs.announcedDate);
  }, [currentSpecs.announcedDate]);

  const formattedReleaseDate = useMemo(() => {
    return formatDateInputValue(currentSpecs.releaseDate);
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
    const mountIdsRaw = currentSpecs.mountIds;
    const hasExplicitClear = mountIdsRaw === null;
    const mountIdsArray = Array.isArray(mountIdsRaw) ? mountIdsRaw : undefined;

    if (gearType === "CAMERA") {
      // Single-select expects a single id string
      if (mountIdsArray !== undefined) return mountIdsArray[0] ?? "";
      if (hasExplicitClear) return "";
      // Fallback to legacy mountId for existing records
      return (currentSpecs.mountId as string | undefined) || "";
    }

    // For lenses (multi select), prefer mountIds and include legacy as fallback for display
    if (mountIdsArray !== undefined) return mountIdsArray;
    if (hasExplicitClear) return [];
    const fromLegacy = currentSpecs.mountId ? [currentSpecs.mountId] : [];
    return fromLegacy;
  }, [currentSpecs.mountIds, currentSpecs.mountId, gearType]);

  // Genres options and values
  const genreOptions = useMemo(
    () =>
      (GENRES as GenreOptionSource[]).map((genre) => ({
        id: genre.slug ?? genre.id ?? "",
        name: genre.name ?? genre.slug ?? "",
      })),
    [],
  );
  const formattedGenres = useMemo(() => {
    return Array.isArray(currentSpecs.genres) ? currentSpecs.genres : [];
  }, [currentSpecs.genres]);

  if (isPending) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (!data) {
    return <div>Unauthenticated</div>;
  }
  const session = data.session;
  const user = data.user;
  const announcedDatePrecision = currentSpecs.announceDatePrecision ?? "DAY";
  const releaseDatePrecision = currentSpecs.releaseDatePrecision ?? "DAY";

  if (!session) return null;

  const isAdmin = requireRole(user, ["ADMIN"]);

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
              showWhenMissing(initialSpecs?.announcedDate) ||
              showWhenMissing(initialSpecs?.announceDatePrecision);
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
                    value={announcedDatePrecision}
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
                      announcedDatePrecision === "YEAR"
                        ? "year"
                        : announcedDatePrecision === "MONTH"
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
              showWhenMissing(initialSpecs?.releaseDate) ||
              showWhenMissing(initialSpecs?.releaseDatePrecision);
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
                    value={releaseDatePrecision}
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
                      releaseDatePrecision === "YEAR"
                        ? "year"
                        : releaseDatePrecision === "MONTH"
                        ? "month"
                        : "day"
                    }
                />
              </>
            );
          })()}

          {showWhenMissing(initialSpecs?.msrpNowUsdCents) && (
            <CurrencyInput
              id="msrpNow"
              label="MSRP now (USD)"
              value={formattedMsrpNow}
              onChange={handleMsrpNowChange}
              placeholder="0.00"
              min={0}
            />
          )}

          {showWhenMissing(initialSpecs?.msrpAtLaunchUsdCents) && (
            <CurrencyInput
              id="msrpAtLaunch"
              label="MSRP at launch (USD)"
              value={formattedMsrpAtLaunch}
              onChange={handleMsrpAtLaunchChange}
              placeholder="0.00"
              min={0}
            />
          )}

          {showWhenMissing(initialSpecs?.mpbMaxPriceUsdCents) && (
            <CurrencyInput
              id="mpbMaxPrice"
              label="MPB max price (USD)"
              value={formattedMpbMaxPrice}
              onChange={handleMpbMaxPriceChange}
              placeholder="0.00"
              min={0}
            />
          )}

          {showWhenMissing(initialSpecs?.weightGrams) && (
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
              const ids = Array.isArray(initialSpecs?.mountIds)
                ? initialSpecs.mountIds
                : [];
              const legacy = initialSpecs?.mountId;
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
              {(showWhenMissing(initialSpecs?.widthMm) ||
                showWhenMissing(initialSpecs?.heightMm)) && (
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
              {showWhenMissing(initialSpecs?.depthMm) && (
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
              {showWhenMissing(initialSpecs?.widthMm) && (
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
              {showWhenMissing(initialSpecs?.heightMm) && (
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
              {showWhenMissing(initialSpecs?.depthMm) && (
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

          {showWhenMissing(initialSpecs?.genres) && (
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

          {showWhenMissing(initialSpecs?.linkManufacturer) && (
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

          {showWhenMissing(initialSpecs?.linkMpb) && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="linkMpb">MPB Link</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground inline-flex"
                      aria-label="How MPB link saving works"
                    >
                      <InfoIcon className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    We trim the fit from the pasted MPB link, store the base
                    path, then rebuild the fit-specific destination later based
                    on the mount the user wants to visit.
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                id="linkMpb"
                type="text"
                value={mpbInputValue}
                onChange={(e) => handleMpbLinkInputChange(e.target.value)}
                onBlur={(e) => handleMpbLinkBlur(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="paste the mpb link with any fit"
              />
              {mpbError ? (
                <p className="mt-1 text-xs text-red-600">{mpbError}</p>
              ) : mpbNoticeUrl ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  This link will be saved as{" "}
                  <a
                    href={mpbNoticeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {mpbNoticeUrl}
                  </a>
                  .
                </p>
              ) : (
                mpbPreviewUrl && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    This link will be saved as{" "}
                    <a
                      href={mpbPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {mpbPreviewUrl}
                    </a>
                    .
                  </p>
                )
              )}
            </div>
          )}

          {showWhenMissing(initialSpecs?.linkBh) && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="linkBh">B&H Link</Label>
              <input
                id="linkBh"
                type="url"
                value={currentSpecs.linkBh || ""}
                onChange={(e) => handleLinkChange("linkBh", e.target.value)}
                onBlur={(e) => handleBhLinkBlur(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://www.bhphotovideo.com/..."
              />
            </div>
          )}

          {showWhenMissing(initialSpecs?.linkAmazon) && (
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
