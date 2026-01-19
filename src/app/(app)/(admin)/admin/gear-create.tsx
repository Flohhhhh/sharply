"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useDebounce } from "~/lib/hooks/useDebounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  isBrandNameOnly as isBrandOnlyName,
  getNameSoftWarnings,
  type SoftWarning,
} from "~/lib/validation/gear-creation-validations";
import type { GearType } from "~/types/gear";
import { ENUMS } from "~/lib/constants";
import { humanizeKey } from "~/lib/utils";
import { splitBrandsWithPriority } from "~/lib/brands";

type Brand = { id: string; name: string };
type FuzzyItem = { id: string; slug: string; name: string };

export function GearCreateCard() {
  const [name, setName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [linkManufacturer, setLinkManufacturer] = useState("");
  const [linkMpb, setLinkMpb] = useState("");
  const [linkAmazon, setLinkAmazon] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [gearType, setGearType] = useState<GearType | "">("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [slugPreview, setSlugPreview] = useState<string>("");
  const [hardSlugConflict, setHardSlugConflict] = useState<boolean>(false);
  const [hardModelConflict, setHardModelConflict] = useState<boolean>(false);
  const [fuzzy, setFuzzy] = useState<FuzzyItem[]>([]);
  const [proceedAnyway, setProceedAnyway] = useState(false);
  const debouncedName = useDebounce(name, 300);
  const debouncedModel = useDebounce(modelNumber, 300);
  const { hoisted: hoistedBrands, remaining: remainingBrands } = useMemo(
    () => splitBrandsWithPriority(brands),
    [brands],
  );
  const showBrandDivider =
    hoistedBrands.length > 0 && remainingBrands.length > 0;

  useEffect(() => {
    // Load brands minimal list
    void (async () => {
      try {
        const res = await fetch("/api/admin/brands");
        if (res.ok) {
          const data: unknown = await res.json();
          if (
            typeof data === "object" &&
            data !== null &&
            "brands" in data &&
            Array.isArray((data as { brands: unknown }).brands)
          ) {
            const arr = (data as { brands: unknown }).brands as unknown[];
            const typed = arr.filter((b): b is Brand => {
              if (typeof b !== "object" || b === null) return false;
              const rec = b as Record<string, unknown>;
              return typeof rec.id === "string" && typeof rec.name === "string";
            });
            setBrands(typed);
          } else {
            setBrands([]);
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Reset form when changing brand or gear type
    setName("");
    setModelNumber("");
    setLinkManufacturer("");
    setLinkMpb("");
    setLinkAmazon("");
    setSlugPreview("");
    setProceedAnyway(false);
    setHardSlugConflict(false);
    setHardModelConflict(false);
    setFuzzy([]);
    setCreatedSlug(null);
  }, [brandId, gearType]);

  const canSubmit =
    name.trim().length > 1 &&
    brandId &&
    gearType &&
    !loading &&
    !hardSlugConflict &&
    !hardModelConflict &&
    (fuzzy.length === 0 || proceedAnyway) &&
    name.trim().toLowerCase() !==
      brands.find((b) => b.id === brandId)?.name.toLowerCase();

  const selectedBrandName = brands.find((b) => b.id === brandId)?.name;
  const isBrandNameOnly = isBrandOnlyName({
    name,
    brandName: selectedBrandName,
  });
  const softWarnings: SoftWarning[] = getNameSoftWarnings({
    name,
    brandName: selectedBrandName,
    gearType,
  });
  const nikkorWarn = softWarnings.some((w) => w.id === "nikkor");
  const missingMmWarn = softWarnings.some((w) => w.id === "missing-mm");
  const missingApertureWarn = softWarnings.some(
    (w) => w.id === "missing-aperture",
  );
  const lensFormatWarn = missingMmWarn || missingApertureWarn;

  const canSubmitWithWarnings =
    canSubmit && (!(nikkorWarn || lensFormatWarn) || proceedAnyway);

  const onSubmit = async () => {
    try {
      setLoading(true);
      setCreatedSlug(null);
      const { actionCreateGear } = await import("~/server/admin/gear/actions");
      const result = await actionCreateGear({
        name: name.trim(),
        brandId,
        gearType: gearType as "CAMERA" | "LENS",
        modelNumber: modelNumber.trim() || undefined,
        linkManufacturer: linkManufacturer.trim() || undefined,
        linkMpb: linkMpb.trim() || undefined,
        linkAmazon: linkAmazon.trim() || undefined,
        force: proceedAnyway,
      });
      setCreatedSlug(result.slug);
      setName("");
      setBrandId("");
      setGearType("");
      setModelNumber("");
      setLinkManufacturer("");
      setLinkMpb("");
      setLinkAmazon("");
      setSlugPreview("");
      setHardSlugConflict(false);
      setHardModelConflict(false);
      setFuzzy([]);
      setProceedAnyway(false);
    } catch (error) {
      console.error("Create failed", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced preflight check
  useEffect(() => {
    void (async () => {
      if (!brandId || !debouncedName.trim()) {
        setSlugPreview("");
        setHardSlugConflict(false);
        setHardModelConflict(false);
        setFuzzy([]);
        setProceedAnyway(false);
        return;
      }
      const params = new URLSearchParams({
        brandId,
        name: debouncedName,
        modelNumber: debouncedModel,
      });
      const res = await fetch(`/api/admin/gear/create/check?${params}`);
      if (res.ok) {
        const data: unknown = await res.json();
        if (typeof data === "object" && data !== null) {
          const rec = data as Record<string, unknown>;
          const sp = rec.slugPreview;
          setSlugPreview(typeof sp === "string" ? sp : "");
          const hard = rec.hard as Record<string, unknown> | undefined;
          setHardSlugConflict(Boolean(hard?.slug));
          setHardModelConflict(Boolean(hard?.modelName));
          const fz = rec.fuzzy as unknown;
          if (Array.isArray(fz)) {
            const items = fz.filter((g): g is FuzzyItem => {
              if (typeof g !== "object" || g === null) return false;
              const gr = g as Record<string, unknown>;
              return (
                typeof gr.id === "string" &&
                typeof gr.slug === "string" &&
                typeof gr.name === "string"
              );
            });
            setFuzzy(items);
          } else {
            setFuzzy([]);
          }
          setProceedAnyway(false);
        }
      }
    })();
  }, [brandId, debouncedName, debouncedModel]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Gear</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Brand</Label>
            <Select value={brandId} onValueChange={(v) => setBrandId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {hoistedBrands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
                {showBrandDivider ? <SelectSeparator /> : null}
                {remainingBrands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              value={gearType}
              onValueChange={(v) => setGearType(v as GearType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {(ENUMS.gear_type ?? []).map((v) => (
                  <SelectItem key={v} value={v}>
                    {v === "ANALOG_CAMERA" ? "Analog Camera" : humanizeKey(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label htmlFor="gear-name">Name</Label>
            <Input
              id="gear-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nikon Z6 III"
              disabled={!brandId || !gearType}
            />
            {slugPreview && (
              <div className="text-muted-foreground text-xs">
                Slug: {slugPreview}
              </div>
            )}
            {isBrandNameOnly && (
              <div className="text-destructive text-xs">
                Please enter the specific product name, not just the brand name.
              </div>
            )}
            <Collapsible>
              <CollapsibleTrigger className="text-muted-foreground text-xs underline">
                Naming guide
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="text-muted-foreground mt-2 space-y-1 text-xs">
                  <div>
                    Use the exact product name as shown on the manufacturer's
                    site.
                  </div>
                  <div>Examples:</div>
                  <ul className="list-disc pl-4">
                    <li>Canon: EOS R5 Mark II</li>
                    <li>Nikon: Z6III</li>
                    <li>Sony: Alpha 7R V</li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label htmlFor="model-number">Model Number (recommended)</Label>
            <Input
              id="model-number"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              placeholder="e.g., ILCE-7RM5 (Sony)"
              disabled={!brandId || !gearType}
            />
            <div className="text-muted-foreground text-xs">
              Helps prevent duplicates. If unknown, you can add later.
            </div>
            <Collapsible>
              <CollapsibleTrigger className="text-muted-foreground text-xs underline">
                Model number guide
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="text-muted-foreground mt-2 space-y-2 text-xs">
                  <div>
                    Check the manufacturer's product page and manuals. Model
                    numbers are often listed near the top of the spec table, on
                    the first/second page of the manual, or in the SKU/Code
                    section.
                  </div>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      <span className="font-medium">Nikon:</span> Looks like
                      <span className="font-mono"> N0000</span> when the camera
                      has Wi‑Fi/Bluetooth registration. Otherwise they sometimes
                      use the item name (e.g.,{" "}
                      <span className="font-mono">D5</span>,
                      <span className="font-mono"> FM2</span>). Usually found on
                      the second page or at the end of the manual if available.
                    </li>
                    <li>
                      <span className="font-medium">Canon:</span> Looks like
                      <span className="font-mono"> 6536C002</span>. Easy to find
                      on Canon USA under “SKU”.
                    </li>
                    <li>
                      <span className="font-medium">Sony:</span> Looks like
                      <span className="font-mono"> ILCE-6700</span>,
                      <span className="font-mono"> ILCE-7RM5</span>, or
                      sometimes just the product name (
                      <span className="font-mono">ZV-E10</span>). Usually shown
                      on the product page and in manuals.
                    </li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label htmlFor="link-manufacturer">Manufacturer Link</Label>
            <Input
              id="link-manufacturer"
              type="url"
              value={linkManufacturer}
              onChange={(e) => setLinkManufacturer(e.target.value)}
              placeholder="https://manufacturer.example.com/product"
              disabled={!brandId || !gearType}
            />
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label htmlFor="link-mpb">MPB Link</Label>
            <Input
              id="link-mpb"
              type="url"
              value={linkMpb}
              onChange={(e) => setLinkMpb(e.target.value)}
              placeholder="https://www.mpb.com/..."
              disabled={!brandId || !gearType}
            />
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label htmlFor="link-amazon">Amazon Link</Label>
            <Input
              id="link-amazon"
              type="url"
              value={linkAmazon}
              onChange={(e) => setLinkAmazon(e.target.value)}
              placeholder="https://amazon.com/..."
              disabled={!brandId || !gearType}
            />
          </div>
        </div>

        {(hardSlugConflict || hardModelConflict) && (
          <div className="border-destructive text-destructive bg-destructive/10 rounded border p-2 text-sm">
            A duplicate already exists (
            {hardSlugConflict ? "slug" : "model number"}). Please check existing
            items.
          </div>
        )}

        {nikkorWarn && !hardSlugConflict && !hardModelConflict && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
            <div className="mb-1 font-medium">Suggestion: add "Nikkor"</div>
            <p>
              Nikon lenses are commonly named with the Nikkor prefix, e.g.
              <span className="font-medium"> Nikon Nikkor Z 400 f/4.5</span>.
              Consider adding "Nikkor" after "Nikon".
            </p>
          </div>
        )}

        {missingMmWarn && !hardSlugConflict && !hardModelConflict && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
            <div className="mb-1 font-medium">Suggestion: add focal length</div>
            <p>Lens names typically include focal length, e.g., "24-70mm".</p>
          </div>
        )}

        {missingApertureWarn && !hardSlugConflict && !hardModelConflict && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
            <div className="mb-1 font-medium">
              Suggestion: add maximum aperture
            </div>
            <p>Lens names typically include maximum aperture, e.g., "f/2.8".</p>
          </div>
        )}

        {softWarnings.some((w) => w.id === "canon-eos") &&
          !hardSlugConflict &&
          !hardModelConflict && (
            <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
              <div className="mb-1 font-medium">Suggestion: add "EOS"</div>
              <p>
                Canon digital ILC cameras are typically named with the EOS
                prefix, e.g., "Canon EOS R5". Consider adding "EOS" after
                "Canon".
              </p>
            </div>
          )}

        {(nikkorWarn || lensFormatWarn) &&
          !hardSlugConflict &&
          !hardModelConflict && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={proceedAnyway}
                onChange={(e) => setProceedAnyway(e.target.checked)}
              />
              Proceed anyway – I confirm the name format is intentional
            </label>
          )}

        {fuzzy.length > 0 && !hardSlugConflict && !hardModelConflict && (
          <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-900">
            <div className="mb-1 font-medium">Possible duplicates</div>
            <ul className="list-disc pl-5">
              {fuzzy.map((g) => (
                <li key={g.id}>
                  <a
                    className="underline"
                    href={`/gear/${g.slug}`}
                    target="_blank"
                  >
                    {g.name}
                  </a>
                </li>
              ))}
            </ul>
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={proceedAnyway}
                onChange={(e) => setProceedAnyway(e.target.checked)}
              />
              Proceed anyway – I confirm this is a different product
            </label>
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          {createdSlug && (
            <a
              href={`/gear/${createdSlug}`}
              className="text-primary text-sm underline"
            >
              View page →
            </a>
          )}
          <Button
            onClick={onSubmit}
            disabled={!canSubmitWithWarnings}
            loading={loading}
          >
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
