"use client";

import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ApertureInput from "~/components/custom-inputs/aperture-input";
import { NumberInput } from "~/components/custom-inputs/number-input";
import MultiSelect from "~/components/ui/multi-select";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  parseApertureFromName,
  parseFocalLengthFromName,
} from "~/lib/admin/gear-bulk-import";
import { splitBrandsWithPriority } from "~/lib/brands";
import { ENUMS, MOUNTS, SENSOR_FORMATS } from "~/lib/constants";
import { GEAR_PUBLICATION_STATES } from "~/lib/gear/publication-state";
import { useDebounce } from "~/lib/hooks/useDebounce";
import { normalizeMpbLinkInput } from "~/lib/links/mpb";
import { getMountLongName } from "~/lib/mapping/mounts-map";
import { sortSensorFormats } from "~/lib/sensor-formats";
import { humanizeKey } from "~/lib/utils";
import {
  getNameSoftWarnings,
  isBrandNameOnly,
} from "~/lib/validation/gear-creation-validations";
import type { GearType } from "~/types/gear";

type Brand = { id: string; name: string; sortOrder: number | null };
type FuzzyItem = { id: string; slug: string; name: string };
type PublicationState = "PUBLISHED" | "RUMORED" | "HIDDEN";
type FieldErrors = Partial<Record<"brand" | "type" | "name", string>>;

const mountOptions = MOUNTS.map((mount) => ({
  id: mount.id,
  name: getMountLongName(mount.value),
})).sort((a, b) => a.name.localeCompare(b.name));

const sensorFormatOptions = sortSensorFormats(
  SENSOR_FORMATS.map((format) => ({
    id: format.id,
    name: format.name,
    slug: format.slug,
  })),
);

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inferLensFieldsFromName(name: string) {
  const focal = parseFocalLengthFromName(name);
  const aperture = parseApertureFromName(name);
  return {
    focalLengthMinMm: focal?.min.toString() ?? "",
    focalLengthMaxMm: focal?.max.toString() ?? "",
    isPrime: focal?.isPrime,
    maxApertureWide: aperture?.wide.toString() ?? "",
    maxApertureTele: aperture?.tele?.toString() ?? "",
  };
}

export function GearCreateCard({
  onCreated,
  onLoadingChange,
}: {
  onCreated?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const t = useTranslations("gearCreate");
  const gearT = useTranslations("gearDetail");
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [brandId, setBrandId] = useState("");
  const [gearType, setGearType] = useState<GearType | "">("");
  const [publicationState, setPublicationState] = useState<PublicationState>(
    GEAR_PUBLICATION_STATES.PUBLISHED,
  );
  const [mountIds, setMountIds] = useState<string[]>([]);
  const [imageCircleSizeId, setImageCircleSizeId] = useState("");
  const [sensorFormatId, setSensorFormatId] = useState("");
  const [resolutionMp, setResolutionMp] = useState("");
  const [analogCameraType, setAnalogCameraType] = useState("");
  const [captureMedium, setCaptureMedium] = useState("");
  const [focalLengthMinMm, setFocalLengthMinMm] = useState("");
  const [focalLengthMaxMm, setFocalLengthMaxMm] = useState("");
  const [lensKind, setLensKind] = useState<"" | "prime" | "zoom">("");
  const [maxApertureWide, setMaxApertureWide] = useState("");
  const [maxApertureTele, setMaxApertureTele] = useState("");
  const [linkManufacturer, setLinkManufacturer] = useState("");
  const [linkMpb, setLinkMpb] = useState("");
  const [linkAmazon, setLinkAmazon] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [slugPreview, setSlugPreview] = useState("");
  const [hardSlugConflict, setHardSlugConflict] = useState(false);
  const [hardModelConflict, setHardModelConflict] = useState(false);
  const [fuzzy, setFuzzy] = useState<FuzzyItem[]>([]);
  const [proceedAnyway, setProceedAnyway] = useState(false);
  const debouncedName = useDebounce(name, 300);
  const debouncedModel = useDebounce(modelNumber, 300);
  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const selectedMount = MOUNTS.find((mount) => mount.id === mountIds[0]);
  const hasFixedLens =
    gearType !== "LENS" && selectedMount?.value === "fixed-lens";
  const { hoisted: hoistedBrands, remaining: remainingBrands } = useMemo(
    () => splitBrandsWithPriority(brands),
    [brands],
  );

  useEffect(() => {
    void fetch("/api/admin/brands")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return (await response.json()) as { brands?: Brand[] };
      })
      .then((data) => setBrands(Array.isArray(data.brands) ? data.brands : []))
      .catch(() => setSubmitError(t("brandsLoadError")));
  }, [t]);

  useEffect(() => {
    if (gearType !== "LENS" && !hasFixedLens) return;
    const inferred = inferLensFieldsFromName(name);
    setFocalLengthMinMm(inferred.focalLengthMinMm);
    setFocalLengthMaxMm(inferred.focalLengthMaxMm);
    setLensKind(
      inferred.isPrime === undefined ? "" : inferred.isPrime ? "prime" : "zoom",
    );
    setMaxApertureWide(inferred.maxApertureWide);
    setMaxApertureTele(inferred.maxApertureTele);
  }, [name, gearType, hasFixedLens]);

  useEffect(() => {
    if (!brandId || !debouncedName.trim()) {
      setSlugPreview("");
      setHardSlugConflict(false);
      setHardModelConflict(false);
      setFuzzy([]);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({
      brandId,
      name: debouncedName,
      modelNumber: debouncedModel,
    });
    void fetch(`/api/admin/gear/create/check?${params}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return (await response.json()) as {
          slugPreview?: string;
          hard?: { slug?: unknown; modelName?: unknown };
          fuzzy?: FuzzyItem[];
        };
      })
      .then((data) => {
        setSlugPreview(data.slugPreview ?? "");
        setHardSlugConflict(Boolean(data.hard?.slug));
        setHardModelConflict(Boolean(data.hard?.modelName));
        setFuzzy(Array.isArray(data.fuzzy) ? data.fuzzy : []);
        setProceedAnyway(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setSubmitError(t("preflightError"));
      });
    return () => controller.abort();
  }, [brandId, debouncedModel, debouncedName, t]);

  const softWarnings = getNameSoftWarnings({
    name,
    brandName: selectedBrand?.name,
    gearType,
  });
  const blockingWarning = softWarnings.some((warning) =>
    ["nikkor", "missing-mm", "missing-aperture"].includes(warning.id),
  );
  const nameWarningMessages = softWarnings.flatMap((warning) => {
    if (warning.id === "nikkor") return [t("nikkorNameWarning")];
    if (warning.id === "missing-mm") return [t("focalLengthNameWarning")];
    if (warning.id === "missing-aperture") {
      return [t("apertureNameWarning")];
    }
    return [];
  });
  const duplicateBlocked = hardSlugConflict || hardModelConflict;
  const confirmationRequired =
    !duplicateBlocked && (blockingWarning || fuzzy.length > 0);

  const validateStepOne = () => {
    const nextErrors: FieldErrors = {};
    if (!brandId) nextErrors.brand = t("brandRequired");
    if (!gearType) nextErrors.type = t("typeRequired");
    if (name.trim().length < 2) nextErrors.name = t("nameRequired");
    if (
      selectedBrand &&
      isBrandNameOnly({ name, brandName: selectedBrand.name })
    ) {
      nextErrors.name = t("specificNameRequired");
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    setSubmitError(null);
    if (validateStepOne() && !duplicateBlocked) setStep(2);
  };

  const onSubmit = async () => {
    setSubmitError(null);
    if (confirmationRequired && !proceedAnyway) return;

    const numericValues = [
      focalLengthMinMm,
      focalLengthMaxMm,
      maxApertureWide,
      maxApertureTele,
      resolutionMp,
    ].filter((value) => value.trim());
    if (
      numericValues.some((value) => {
        const parsed = Number(value);
        return !Number.isFinite(parsed) || parsed <= 0;
      })
    ) {
      setSubmitError(t("positiveNumberError"));
      return;
    }

    for (const link of [linkManufacturer, linkAmazon]) {
      if (!link.trim()) continue;
      try {
        const parsed = new URL(link);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setSubmitError(t("urlError"));
          return;
        }
      } catch {
        setSubmitError(t("urlError"));
        return;
      }
    }

    const normalizedMpb = normalizeMpbLinkInput(linkMpb);
    if (normalizedMpb.kind === "search" || normalizedMpb.kind === "invalid") {
      setSubmitError(t("mpbUrlError"));
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);
    try {
      const inferred = inferLensFieldsFromName(name);
      const { actionCreateGear } = await import("~/server/admin/gear/actions");
      const result = await actionCreateGear({
        name: name.trim(),
        brandId,
        gearType: gearType as GearType,
        publicationState,
        modelNumber: modelNumber.trim() || undefined,
        mountIds: mountIds.length ? mountIds : undefined,
        linkManufacturer: linkManufacturer.trim() || undefined,
        linkMpb:
          normalizedMpb.kind === "product"
            ? normalizedMpb.normalizedPath
            : undefined,
        linkAmazon: linkAmazon.trim() || undefined,
        initialLensSpecs:
          gearType === "LENS"
            ? {
                focalLengthMinMm: optionalNumber(focalLengthMinMm),
                focalLengthMaxMm: optionalNumber(focalLengthMaxMm),
                isPrime:
                  lensKind === "" ? inferred.isPrime : lensKind === "prime",
                maxApertureWide: optionalNumber(maxApertureWide),
                maxApertureTele: optionalNumber(maxApertureTele),
                imageCircleSizeId: imageCircleSizeId || undefined,
              }
            : undefined,
        initialCameraSpecs:
          gearType === "CAMERA"
            ? {
                sensorFormatId: sensorFormatId || undefined,
                resolutionMp: optionalNumber(resolutionMp),
              }
            : undefined,
        initialAnalogCameraSpecs:
          gearType === "ANALOG_CAMERA"
            ? {
                cameraType:
                  (analogCameraType as NonNullable<
                    Parameters<
                      typeof actionCreateGear
                    >[0]["initialAnalogCameraSpecs"]
                  >["cameraType"]) || undefined,
                captureMedium:
                  (captureMedium as NonNullable<
                    Parameters<
                      typeof actionCreateGear
                    >[0]["initialAnalogCameraSpecs"]
                  >["captureMedium"]) || undefined,
              }
            : undefined,
        initialFixedLensSpecs: hasFixedLens
          ? {
              focalLengthMinMm: optionalNumber(focalLengthMinMm),
              focalLengthMaxMm: optionalNumber(focalLengthMaxMm),
              isPrime:
                lensKind === "" ? inferred.isPrime : lensKind === "prime",
              maxApertureWide: optionalNumber(maxApertureWide),
              maxApertureTele: optionalNumber(maxApertureTele),
            }
          : undefined,
        force: proceedAnyway,
      });
      toast.success(t("successTitle"), {
        description: t("successDescription", { name: name.trim() }),
        duration: 15_000,
        action: {
          label: t("viewPage"),
          onClick: () => window.location.assign(`/gear/${result.slug}`),
        },
      });
      onCreated?.();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("unknownError");
      setSubmitError(message);
      toast.error(t("errorTitle"));
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const disabled = loading;

  return (
    <Card
      aria-busy={loading}
      className="max-h-[90vh] overflow-y-auto shadow-lg"
    >
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-4">
          <CardTitle>{t("title")}</CardTitle>
          <span className="text-muted-foreground text-sm font-medium">
            {t("stepLabel", {
              current: step,
              label: step === 1 ? t("identityStep") : t("detailsStep"),
            })}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2" aria-hidden="true">
          <div className="bg-primary h-1 rounded-full" />
          <div
            className={`h-1 rounded-full ${
              step === 2 ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {step === 1 ? (
          <fieldset disabled={disabled} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("brand")}</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger aria-invalid={Boolean(fieldErrors.brand)}>
                  <SelectValue placeholder={t("selectBrand")} />
                </SelectTrigger>
                <SelectContent>
                  {hoistedBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                  {hoistedBrands.length > 0 && remainingBrands.length > 0 ? (
                    <SelectSeparator />
                  ) : null}
                  {remainingBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.brand ? (
                <p className="text-destructive text-xs">{fieldErrors.brand}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t("type")}</Label>
              <Select
                value={gearType}
                onValueChange={(value) => {
                  setGearType(value as GearType);
                  setMountIds([]);
                  setImageCircleSizeId("");
                  setSensorFormatId("");
                  setResolutionMp("");
                  setAnalogCameraType("");
                  setCaptureMedium("");
                }}
              >
                <SelectTrigger aria-invalid={Boolean(fieldErrors.type)}>
                  <SelectValue placeholder={t("selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {(ENUMS.gear_type ?? []).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value === "ANALOG_CAMERA"
                        ? t("analogCamera")
                        : humanizeKey(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.type ? (
                <p className="text-destructive text-xs">{fieldErrors.type}</p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gear-name">{t("name")}</Label>
              <Input
                id="gear-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFieldErrors((errors) => ({ ...errors, name: undefined }));
                }}
                placeholder={t("namePlaceholder")}
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name ? (
                <p className="text-destructive text-xs">{fieldErrors.name}</p>
              ) : slugPreview ? (
                <p className="text-muted-foreground text-xs">
                  {t("slugPreview", { slug: slugPreview })}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-number">{t("modelNumber")}</Label>
              <Input
                id="model-number"
                value={modelNumber}
                onChange={(event) => setModelNumber(event.target.value)}
                placeholder={t("modelPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{gearT("publicationStateLabel")}</Label>
              <Select
                value={publicationState}
                onValueChange={(value) =>
                  setPublicationState(value as PublicationState)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GEAR_PUBLICATION_STATES.PUBLISHED}>
                    {gearT("publicationStatePublished")}
                  </SelectItem>
                  <SelectItem value={GEAR_PUBLICATION_STATES.RUMORED}>
                    {gearT("publicationStateRumored")}
                  </SelectItem>
                  <SelectItem value={GEAR_PUBLICATION_STATES.HIDDEN}>
                    {gearT("publicationStateHidden")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </fieldset>
        ) : (
          <fieldset disabled={disabled} className="space-y-5">
            {gearType === "LENS" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{t("lensDetails")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("inferenceHelp")}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("mounts")}</Label>
                    <MultiSelect
                      options={mountOptions}
                      value={mountIds}
                      onChange={setMountIds}
                      placeholder={t("selectMounts")}
                      searchPlaceholder={t("searchMounts")}
                      inDialog
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("primeOrZoom")}</Label>
                    <Select
                      value={lensKind}
                      onValueChange={(value) =>
                        setLensKind(value as "prime" | "zoom")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectPrimeOrZoom")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prime">{t("prime")}</SelectItem>
                        <SelectItem value="zoom">{t("zoom")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("imageCircle")}</Label>
                    <Select
                      value={imageCircleSizeId}
                      onValueChange={setImageCircleSizeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectImageCircle")} />
                      </SelectTrigger>
                      <SelectContent>
                        {sensorFormatOptions.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <NumberInput
                    id="focal-length-wide"
                    label={t("focalWide")}
                    value={optionalNumber(focalLengthMinMm)}
                    onChange={(value) =>
                      setFocalLengthMinMm(value?.toString() ?? "")
                    }
                    min={0.1}
                    step={0.1}
                    suffix="mm"
                    disabled={disabled}
                  />
                  <NumberInput
                    id="focal-length-tele"
                    label={t("focalTele")}
                    value={optionalNumber(focalLengthMaxMm)}
                    onChange={(value) =>
                      setFocalLengthMaxMm(value?.toString() ?? "")
                    }
                    min={0.1}
                    step={0.1}
                    suffix="mm"
                    disabled={disabled}
                  />
                  <ApertureInput
                    id="maximum-aperture-wide"
                    label={t("apertureWide")}
                    value={optionalNumber(maxApertureWide)}
                    onChange={(value) =>
                      setMaxApertureWide(value?.toString() ?? "")
                    }
                    disabled={disabled}
                  />
                  <ApertureInput
                    id="maximum-aperture-tele"
                    label={t("apertureTele")}
                    value={optionalNumber(maxApertureTele)}
                    onChange={(value) =>
                      setMaxApertureTele(value?.toString() ?? "")
                    }
                    disabled={disabled}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{t("cameraDetails")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("completionFieldsHelp")}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("mount")}</Label>
                    <Select
                      value={mountIds[0] ?? ""}
                      onValueChange={(id) => setMountIds([id])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectMount")} />
                      </SelectTrigger>
                      <SelectContent>
                        {mountOptions.map((mount) => (
                          <SelectItem key={mount.id} value={mount.id}>
                            {mount.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {gearType === "CAMERA" ? (
                    <>
                      <div className="space-y-2">
                        <Label>{t("sensorFormat")}</Label>
                        <Select
                          value={sensorFormatId}
                          onValueChange={setSensorFormatId}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("selectSensorFormat")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {sensorFormatOptions.map((format) => (
                              <SelectItem key={format.id} value={format.id}>
                                {format.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <NumberInput
                        id="sensor-resolution"
                        label={t("resolution")}
                        value={optionalNumber(resolutionMp)}
                        onChange={(value) =>
                          setResolutionMp(value?.toString() ?? "")
                        }
                        min={0.1}
                        step={0.1}
                        suffix="MP"
                        disabled={disabled}
                      />
                    </>
                  ) : (
                    <>
                      <EnumSelect
                        label={t("cameraType")}
                        value={analogCameraType}
                        onChange={setAnalogCameraType}
                        options={ENUMS.analog_types_enum ?? []}
                        placeholder={t("selectCameraType")}
                      />
                      <EnumSelect
                        label={t("captureMedium")}
                        value={captureMedium}
                        onChange={setCaptureMedium}
                        options={ENUMS.analog_medium_enum ?? []}
                        placeholder={t("selectCaptureMedium")}
                      />
                    </>
                  )}
                  {hasFixedLens ? (
                    <>
                      <div className="md:col-span-2">
                        <h4 className="font-medium">{t("integratedLens")}</h4>
                        <p className="text-muted-foreground text-sm">
                          {t("inferenceHelp")}
                        </p>
                      </div>
                      <NumberInput
                        id="integrated-focal-length-wide"
                        label={t("focalWide")}
                        value={optionalNumber(focalLengthMinMm)}
                        onChange={(value) =>
                          setFocalLengthMinMm(value?.toString() ?? "")
                        }
                        min={0.1}
                        step={0.1}
                        suffix="mm"
                        disabled={disabled}
                      />
                      <NumberInput
                        id="integrated-focal-length-tele"
                        label={t("focalTele")}
                        value={optionalNumber(focalLengthMaxMm)}
                        onChange={(value) =>
                          setFocalLengthMaxMm(value?.toString() ?? "")
                        }
                        min={0.1}
                        step={0.1}
                        suffix="mm"
                        disabled={disabled}
                      />
                      <ApertureInput
                        id="integrated-maximum-aperture-wide"
                        label={t("apertureWide")}
                        value={optionalNumber(maxApertureWide)}
                        onChange={(value) =>
                          setMaxApertureWide(value?.toString() ?? "")
                        }
                        disabled={disabled}
                      />
                      <ApertureInput
                        id="integrated-maximum-aperture-tele"
                        label={t("apertureTele")}
                        value={optionalNumber(maxApertureTele)}
                        onChange={(value) =>
                          setMaxApertureTele(value?.toString() ?? "")
                        }
                        disabled={disabled}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <h3 className="font-semibold">{t("optionalLinks")}</h3>
              <LinkInput
                id="manufacturer-link"
                label={t("manufacturerLink")}
                value={linkManufacturer}
                onChange={setLinkManufacturer}
              />
              <LinkInput
                id="mpb-link"
                label={t("mpbLink")}
                value={linkMpb}
                onChange={setLinkMpb}
              />
              <LinkInput
                id="amazon-link"
                label={t("amazonLink")}
                value={linkAmazon}
                onChange={setLinkAmazon}
              />
            </div>
          </fieldset>
        )}

        {duplicateBlocked ? (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
          >
            {hardSlugConflict ? t("slugConflict") : t("modelConflict")}
          </div>
        ) : null}

        {step === 2 && confirmationRequired ? (
          <div className="space-y-3 border-l-2 border-amber-500/70 pl-3 text-sm">
            {fuzzy.length > 0 ? (
              <>
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    {t("possibleDuplicate")}
                  </p>
                  <p className="text-muted-foreground">
                    {t("possibleDuplicateDescription")}
                  </p>
                </div>
                <ul className="space-y-1">
                  {fuzzy.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`/gear/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {t("nameFormatSuggestion")}
                </p>
                <ul className="text-muted-foreground list-disc space-y-1 pl-4">
                  {nameWarningMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="confirm-creation-warning"
                checked={proceedAnyway}
                onCheckedChange={(checked) =>
                  setProceedAnyway(checked === true)
                }
              />
              <Label htmlFor="confirm-creation-warning" className="font-normal">
                {fuzzy.length > 0
                  ? t("confirmDifferentProduct")
                  : t("confirmNameIntentional")}
              </Label>
            </div>
          </div>
        ) : null}

        {submitError ? (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
          >
            <p className="font-medium">{t("errorTitle")}</p>
            <p>{submitError}</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t pt-4">
          {step === 2 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={disabled}
              icon={<ArrowLeft className="size-4" />}
            >
              {t("back")}
            </Button>
          ) : (
            <span />
          )}
          {step === 1 ? (
            <Button
              onClick={goNext}
              disabled={disabled || duplicateBlocked}
              icon={<ArrowRight className="size-4" />}
            >
              {t("continue")}
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={
                disabled ||
                duplicateBlocked ||
                (confirmationRequired && !proceedAnyway)
              }
              icon={
                loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )
              }
            >
              {loading ? t("creating") : t("create")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LinkInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://"
      />
    </div>
  );
}

function EnumSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {humanizeKey(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
