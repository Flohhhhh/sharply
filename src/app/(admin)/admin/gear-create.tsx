"use client";
import { useEffect, useState } from "react";
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
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  isBrandNameOnly as isBrandOnlyName,
  getNameSoftWarnings,
  type SoftWarning,
} from "~/lib/validation/gear-creation-validations";

type Brand = { id: string; name: string };

export function GearCreateCard() {
  const [name, setName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [linkManufacturer, setLinkManufacturer] = useState("");
  const [linkMpb, setLinkMpb] = useState("");
  const [linkAmazon, setLinkAmazon] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [gearType, setGearType] = useState<"CAMERA" | "LENS" | "">("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [slugPreview, setSlugPreview] = useState<string>("");
  const [hardSlugConflict, setHardSlugConflict] = useState<any | null>(null);
  const [hardModelConflict, setHardModelConflict] = useState<any | null>(null);
  const [fuzzy, setFuzzy] = useState<any[]>([]);
  const [proceedAnyway, setProceedAnyway] = useState(false);
  const debouncedName = useDebounce(name, 300);
  const debouncedModel = useDebounce(modelNumber, 300);

  useEffect(() => {
    // Load brands minimal list
    (async () => {
      try {
        const res = await fetch("/api/admin/brands");
        if (res.ok) {
          const data = await res.json();
          setBrands(data.brands || []);
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
    setHardSlugConflict(null);
    setHardModelConflict(null);
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
      const res = await fetch("/api/admin/gear/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brandId,
          gearType,
          modelNumber: modelNumber.trim() || undefined,
          linkManufacturer: linkManufacturer.trim() || undefined,
          linkMpb: linkMpb.trim() || undefined,
          linkAmazon: linkAmazon.trim() || undefined,
          force: proceedAnyway,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedSlug(data.gear?.slug ?? null);
        setName("");
        setBrandId("");
        setGearType("");
        setModelNumber("");
        setLinkManufacturer("");
        setLinkMpb("");
        setLinkAmazon("");
        setSlugPreview("");
        setHardSlugConflict(null);
        setHardModelConflict(null);
        setFuzzy([]);
        setProceedAnyway(false);
      } else {
        console.error("Create failed", await res.text());
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced preflight check
  useEffect(() => {
    const run = async () => {
      if (!brandId || !debouncedName.trim()) {
        setSlugPreview("");
        setHardSlugConflict(null);
        setHardModelConflict(null);
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
        const data = await res.json();
        setSlugPreview(data.slugPreview || "");
        setHardSlugConflict(data.hard?.slug || null);
        setHardModelConflict(data.hard?.modelName || null);
        setFuzzy(data.fuzzy || []);
        setProceedAnyway(false);
      }
    };
    run();
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
                {brands.map((b) => (
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
              onValueChange={(v) => setGearType(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAMERA">Camera</SelectItem>
                <SelectItem value="LENS">Lens</SelectItem>
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
