"use client";

import * as React from "react";
import { useDebounce } from "~/lib/hooks/useDebounce";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { BRANDS, MOUNTS } from "~/lib/constants";
import {
  isBrandNameOnly as isBrandOnlyName,
  getNameSoftWarnings,
} from "~/lib/validation/gear-creation-validations";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useState, useEffect } from "react";
import { z } from "zod";
import { getMountLongName } from "~/lib/mapping/mounts-map";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { parseSingleColumnCsv } from "~/lib/utils/csv";

type Brand = { id: string; name: string };
type GearType = "CAMERA" | "LENS";
type MountOption = { id: string; name: string; brandId: string | null };
type GeneratedMount = (typeof MOUNTS)[number];

type RowValidation = {
  slugPreview: string;
  slugConflict: boolean;
  modelConflict: boolean;
  fuzzyMatches: { id: string; name: string; slug: string }[];
};

type RowState = {
  id: string;
  name: string;
  modelNumber: string;
  mountId: string;
  validation: RowValidation | null;
  proceedAnyway: boolean;
  status: "idle" | "blocked" | "creating" | "created" | "error" | "pending";
  errorMessage?: string;
  createdSlug?: string;
};

const FuzzyItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
const CheckResponse = z.object({
  slugPreview: z.string().default(""),
  hard: z
    .object({
      slug: FuzzyItemSchema.nullable().default(null),
      modelName: FuzzyItemSchema.nullable().default(null),
    })
    .default({ slug: null, modelName: null }),
  fuzzy: z.array(FuzzyItemSchema).default([]),
});

type BulkCreateRowProps = {
  row: RowState;
  brandId: string;
  gearType: GearType | "";
  canEditRows: boolean;
  mountOptions: MountOption[];
  updateRow: (id: string, patch: Partial<RowState>) => void;
  removeRow: (id: string) => void;
};

function BulkCreateRow({
  row,
  brandId,
  gearType,
  canEditRows,
  mountOptions,
  updateRow,
  removeRow,
}: BulkCreateRowProps): React.JSX.Element {
  const debounced = useDebounce(
    `${brandId}|${gearType}|${row.name}|${row.modelNumber}`,
    450,
  );
  const [isValidating, setIsValidating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    const name = row.name.trim();
    if (!canEditRows || !name) {
      setIsValidating(false);
      if (!name) updateRow(row.id, { validation: null });
      return;
    }
    setIsValidating(true);
    const params = new URLSearchParams({
      brandId,
      name,
      modelNumber: row.modelNumber.trim(),
    }).toString();
    fetch(`/api/admin/gear/create/check?${params}`)
      .then((r) => r.json())
      .then((json) => CheckResponse.parse(json))
      .then((data) => {
        const validation: RowValidation = {
          slugPreview: data.slugPreview ?? "",
          slugConflict: Boolean(data.hard?.slug),
          modelConflict: Boolean(data.hard?.modelName),
          fuzzyMatches: data.fuzzy ?? [],
        };
        updateRow(row.id, { validation });
      })
      .catch(() => {
        updateRow(row.id, { validation: null });
      })
      .finally(() => setIsValidating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const v = row.validation;
  const brandName = BRANDS.find((b) => b.id === brandId)?.name;
  const isBrandNameOnly = isBrandOnlyName({ name: row.name, brandName });
  const softWarnings = getNameSoftWarnings({
    name: row.name,
    brandName,
    gearType,
  });
  const nikkorWarn = softWarnings.some((w) => w.id === "nikkor");
  const missingMmWarn = softWarnings.some((w) => w.id === "missing-mm");
  const missingApertureWarn = softWarnings.some(
    (w) => w.id === "missing-aperture",
  );
  const lensFormatWarn = missingMmWarn || missingApertureWarn;
  const hardBlocked = v?.slugConflict || v?.modelConflict || isBrandNameOnly;
  const fuzzyWarn = (v?.fuzzyMatches?.length || 0) > 0;
  const softWarn = nikkorWarn || missingMmWarn || missingApertureWarn;
  const canProceed = !hardBlocked && (!fuzzyWarn || row.proceedAnyway);
  const isFailing =
    !!row.name.trim() && (!canProceed || row.status === "error");
  const isSoftOnly = softWarn && !hardBlocked && !fuzzyWarn;
  const isReviewed = row.proceedAnyway || !isFailing;
  const hasValidationIssues = hardBlocked || fuzzyWarn || softWarn;
  const columnCount = gearType === "LENS" ? 6 : 5;

  return (
    <>
      <TableRow
        key={row.id}
        className={
          isFailing && !row.proceedAnyway
            ? "bg-red-50 hover:bg-red-50 dark:bg-red-950/20"
            : undefined
        }
      >
        <TableCell>
          <Input
            value={row.name}
            onChange={(e) => updateRow(row.id, { name: e.target.value })}
            placeholder={
              canEditRows ? "Product name…" : "Select brand and type first"
            }
            disabled={!canEditRows || row.status === "created"}
          />
        </TableCell>
        <TableCell>
          <Input
            value={row.modelNumber}
            onChange={(e) => updateRow(row.id, { modelNumber: e.target.value })}
            placeholder="Optional"
            disabled={!canEditRows || row.status === "created"}
          />
        </TableCell>
        {gearType === "LENS" && (
          <TableCell>
            <Select
              value={row.mountId}
              onValueChange={(v) => updateRow(row.id, { mountId: v })}
              disabled={!canEditRows || row.status === "created"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {mountOptions.map((mount) => (
                  <SelectItem key={mount.id} value={mount.id}>
                    {mount.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableCell>
        )}
        <TableCell>
          <div className="text-muted-foreground truncate text-sm">
            {v?.slugPreview || "—"}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap items-start gap-2">
            {isValidating ? (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            ) : hasValidationIssues ? (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Badge
                    variant={isSoftOnly ? "secondary" : "destructive"}
                    className={`cursor-pointer ${
                      isSoftOnly ? "0 bg-amber-500/80 text-amber-950" : ""
                    }`}
                  >
                    {isReviewed ? "Reviewed" : "Needs review"}
                    <svg
                      className={`ml-1 h-3 w-3 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Badge>
                </CollapsibleTrigger>
              </Collapsible>
            ) : row.validation ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <div className="h-4 w-4" />
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeRow(row.id)}
              disabled={!canEditRows || row.status === "creating"}
            >
              Remove
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {hasValidationIssues && (
        <TableRow>
          <TableCell colSpan={columnCount} className="p-0">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleContent className="mb-2 space-y-3 rounded-md p-3">
                {v?.slugConflict && (
                  <div className="space-y-2">
                    <h4 className="text-destructive font-medium">
                      Slug Conflict
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      The slug "{v.slugPreview}" already exists in the database.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/gear/${v.slugPreview}`, "_blank")
                        }
                      >
                        View existing item
                      </Button>
                    </div>
                  </div>
                )}
                {isBrandNameOnly && (
                  <div className="space-y-2">
                    <h4 className="text-destructive font-medium">
                      Brand Name Only
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Please enter the specific product name, not just the brand
                      name "{brandName}".
                    </p>
                  </div>
                )}
                {nikkorWarn && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600">
                      Suggestion: add "Nikkor"
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Nikon lenses are commonly named with the Nikkor prefix,
                      e.g.
                      <span className="font-medium">
                        {" "}
                        Nikon Nikkor Z 400 f/4.5
                      </span>
                      . Consider adding "Nikkor" after "Nikon".
                    </p>
                  </div>
                )}
                {lensFormatWarn && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600">
                      Suggestion: add focal length and aperture
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Lens names typically include focal length (e.g.,
                      "24-70mm") and maximum aperture (e.g., "f/2.8"). Consider
                      adding these details.
                    </p>
                  </div>
                )}
                {missingMmWarn && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600">
                      Suggestion: add focal length
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Lens names typically include focal length, e.g.,
                      "24-70mm".
                    </p>
                  </div>
                )}
                {missingApertureWarn && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600">
                      Suggestion: add maximum aperture
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Lens names typically include maximum aperture, e.g.,
                      "f/2.8".
                    </p>
                  </div>
                )}
                {softWarnings.some((w) => w.id === "canon-eos") && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600">
                      Suggestion: add "EOS"
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Canon digital ILC cameras are typically named with the EOS
                      prefix (e.g., "Canon EOS R5"). Consider adding "EOS" after
                      "Canon".
                    </p>
                  </div>
                )}
                {v?.modelConflict && (
                  <div className="space-y-2">
                    <h4 className="text-destructive font-medium">
                      Model Number Conflict
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      The model number "{row.modelNumber}" already exists in the
                      database.
                    </p>
                  </div>
                )}
                {fuzzyWarn &&
                  v?.fuzzyMatches &&
                  v.fuzzyMatches.length > 0 &&
                  !v?.slugConflict && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-amber-600">
                        Fuzzy Matches ({v.fuzzyMatches.length})
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Similar items were found. Review to avoid duplicates.
                      </p>
                      <div className="space-y-2">
                        {v.fuzzyMatches.slice(0, 5).map((match) => (
                          <div
                            key={match.id}
                            className="bg-background flex items-center justify-between rounded border p-2"
                          >
                            <div>
                              <p className="font-medium">{match.name}</p>
                              <p className="text-muted-foreground text-sm">
                                {match.slug}
                              </p>
                            </div>
                          </div>
                        ))}
                        {v.fuzzyMatches.length > 5 && (
                          <p className="text-muted-foreground text-sm">
                            ... and {v.fuzzyMatches.length - 5} more matches
                          </p>
                        )}
                      </div>
                      {!v?.slugConflict && !v?.modelConflict && (
                        <div className="flex items-center gap-2">
                          <input
                            id={`proceed-${row.id}`}
                            type="checkbox"
                            className="h-4 w-4"
                            checked={row.proceedAnyway}
                            onChange={(e) =>
                              updateRow(row.id, {
                                proceedAnyway: e.target.checked,
                              })
                            }
                            disabled={row.status === "created"}
                          />
                          <label
                            htmlFor={`proceed-${row.id}`}
                            className="text-sm"
                          >
                            {row.proceedAnyway
                              ? "Reviewed – not a duplicate"
                              : "Proceed anyway – I confirm this isn’t a duplicate"}
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                {row.status === "error" && (
                  <div className="mt-2 text-sm text-red-600">
                    {row.errorMessage || "Error"}
                  </div>
                )}
                {row.status === "created" && row.createdSlug && (
                  <div className="mt-2 text-sm text-green-600">
                    Created: {row.createdSlug}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function GearBulkCreate(): React.JSX.Element {
  const brandOptions = React.useMemo<Brand[]>(
    () => BRANDS.map((b) => ({ id: b.id, name: b.name })),
    [],
  );
  const mountOptions = React.useMemo<MountOption[]>(
    () =>
      (MOUNTS as readonly GeneratedMount[]).map((m) => ({
        id: m.id,
        name: getMountLongName(m.value),
        brandId: m.brand_id ?? null,
      })),
    [],
  );
  const [brandId, setBrandId] = React.useState<string>("");
  const [gearType, setGearType] = React.useState<GearType | "">("");
  const [rows, setRows] = React.useState<RowState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");

  const scopedMountOptions = React.useMemo(() => {
    if (!brandId) return mountOptions;
    const seen = new Set<string>();
    const preferred: MountOption[] = [];
    const neutral: MountOption[] = [];
    const others: MountOption[] = [];

    for (const m of mountOptions) {
      if (seen.has(m.id)) continue;
      if (m.brandId === brandId) {
        preferred.push(m);
      } else if (m.brandId === null) {
        neutral.push(m);
      } else {
        others.push(m);
      }
      seen.add(m.id);
    }

    return [...preferred, ...neutral, ...others];
  }, [brandId, mountOptions]);

  // Brands come from generated constants

  const canEditRows = Boolean(brandId && gearType);
  const canInteractRows =
    canEditRows && !isSubmitting && !isImporting && !isSuccess;
  const validRows = rows.filter((r) => {
    const v = r.validation;
    const brandName = BRANDS.find((b) => b.id === brandId)?.name;
    const isBrandNameOnly = isBrandOnlyName({ name: r.name, brandName });

    return (
      v &&
      !v.slugConflict &&
      !v.modelConflict &&
      (v.fuzzyMatches.length === 0 || r.proceedAnyway) &&
      !isBrandNameOnly
    );
  });
  const anyFailing = rows.some((r) => {
    const v = r.validation;
    const brandName = BRANDS.find((b) => b.id === brandId)?.name;
    const isBrandNameOnly = isBrandOnlyName({ name: r.name, brandName });

    return (
      !!r.name.trim() &&
      (!v ||
        v.slugConflict ||
        v.modelConflict ||
        (v.fuzzyMatches.length > 0 && !r.proceedAnyway) ||
        isBrandNameOnly)
    );
  });

  const addRow = () => {
    const newRow: RowState = {
      id: crypto.randomUUID(),
      name: "",
      modelNumber: "",
      mountId: "",
      validation: null,
      proceedAnyway: false,
      status: "pending",
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleImportCsv = async () => {
    if (!canEditRows) return;
    const parsed = parseSingleColumnCsv(csvText);
    if (parsed.length === 0) {
      setIsCsvOpen(false);
      setCsvText("");
      return;
    }
    const existing = new Set(
      rows.map((r) => r.name.trim().toLowerCase()).filter((n) => n.length > 0),
    );
    const uniqueNames: string[] = [];
    for (const raw of parsed) {
      const t = raw.trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (existing.has(key)) continue;
      existing.add(key);
      uniqueNames.push(t);
    }
    if (uniqueNames.length === 0) {
      setIsCsvOpen(false);
      setCsvText("");
      return;
    }
    setIsImporting(true);
    try {
      for (const name of uniqueNames) {
        const newRow: RowState = {
          id: crypto.randomUUID(),
          name,
          modelNumber: "",
          mountId: "",
          validation: null,
          proceedAnyway: false,
          status: "pending",
        };
        setRows((prev) => [...prev, newRow]);
        // Stagger additions slightly so validations fire in sequence
        await new Promise((r) => setTimeout(r, 50));
      }
      setIsCsvOpen(false);
      setCsvText("");
    } finally {
      setIsImporting(false);
    }
  };

  const updateRow = (id: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const createAll = async () => {
    if (!canEditRows || validRows.length === 0) return;
    setIsSubmitting(true);
    let createdCount = 0;
    try {
      for (const r of validRows) {
        const name = r.name.trim();
        if (!name) continue;
        const v = r.validation;
        const canCreate =
          v &&
          !v.slugConflict &&
          !v.modelConflict &&
          (v.fuzzyMatches.length === 0 || r.proceedAnyway);
        if (!canCreate) {
          updateRow(r.id, { status: "blocked" });
          continue;
        }
        updateRow(r.id, { status: "creating" });
        try {
          const trimmedMountId = r.mountId.trim();
          const { actionCreateGear } = await import(
            "~/server/admin/gear/actions"
          );
          const mountIdValue =
            gearType === "LENS" && trimmedMountId ? trimmedMountId : undefined;
          const result = await actionCreateGear({
            name,
            modelNumber: r.modelNumber.trim() || undefined,
            brandId,
            gearType: gearType as "CAMERA" | "LENS",
            mountId: mountIdValue,
            force: r.proceedAnyway,
          });
          updateRow(r.id, { status: "created", createdSlug: result.slug });
        } catch (error) {
          updateRow(r.id, {
            status: "error",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          });
          continue;
        }
        createdCount++;
      }
      // Show success state and clear form
      setSuccessCount(createdCount);
      setIsSuccess(true);
      console.log(
        "🎉 Success! Created",
        createdCount,
        "items. Setting success state to true",
      );
      setRows([]);
      setBrandId("");
      setGearType("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset success state and rows when brand/type changes
  useEffect(() => {
    if (brandId || gearType) {
      setRows([]);
    }
    if (isSuccess) {
      console.log("🔄 Resetting success state due to brand/type change");
    }
    setIsSuccess(false);
    setSuccessCount(0);
  }, [brandId, gearType]);

  return (
    <div className="space-y-4">
      {isSuccess && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    🎉 Successfully created {successCount} gear item
                    {successCount !== 1 ? "s" : ""}!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    The form has been cleared. You can create more items or
                    start a new batch.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSuccess(false)}
                className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/30"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bulk Create Gear</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Brand</label>
              <Select value={brandId} onValueChange={(v) => setBrandId(v)}>
                <SelectTrigger disabled={isImporting || isSubmitting}>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brandOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={gearType}
                onValueChange={(v) => setGearType(v as GearType)}
              >
                <SelectTrigger disabled={isImporting || isSubmitting}>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAMERA">Camera</SelectItem>
                  <SelectItem value="LENS">Lens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Name</TableHead>
                  <TableHead className="w-[20%]">Model Number</TableHead>
                  {gearType === "LENS" && (
                    <TableHead className="w-[20%]">Mount</TableHead>
                  )}
                  <TableHead className="w-[20%]">Slug Preview</TableHead>
                  <TableHead className="w-[20%]">Validation</TableHead>
                  <TableHead className="w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={gearType === "LENS" ? 6 : 5}
                      className="text-muted-foreground text-center text-sm"
                    >
                      {isSuccess
                        ? "Form cleared after successful creation"
                        : "Add rows to begin"}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <BulkCreateRow
                      key={r.id}
                      row={r}
                      brandId={brandId}
                      gearType={gearType}
                      canEditRows={canEditRows}
                      mountOptions={scopedMountOptions}
                      updateRow={updateRow}
                      removeRow={removeRow}
                    />
                  ))
                )}
              </TableBody>
            </Table>
            <div className="bg-muted/30 flex items-center gap-2 border-t p-3">
              <Button
                type="button"
                onClick={addRow}
                disabled={!canInteractRows}
                variant="outline"
                size="sm"
              >
                + Add Row
              </Button>
              <Dialog open={isCsvOpen} onOpenChange={setIsCsvOpen}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCsvOpen(true)}
                  disabled={
                    !canEditRows || isImporting || isSubmitting || isSuccess
                  }
                >
                  Import with CSV
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import from CSV</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                      Paste a single column of names. The first column will be
                      used.
                    </p>
                    <Textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="One name per line or first column of CSV"
                      rows={10}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCsvOpen(false)}
                      disabled={isImporting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleImportCsv}
                      disabled={
                        isImporting ||
                        !canEditRows ||
                        csvText.trim().length === 0
                      }
                    >
                      {isImporting ? (
                        <>
                          <svg
                            className="mr-2 h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                          </svg>
                          Importing…
                        </>
                      ) : (
                        "Import"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">
                {validRows.length}
              </span>{" "}
              ready •{" "}
              <span>
                {
                  rows.filter(
                    (r) =>
                      r.validation?.slugConflict || r.validation?.modelConflict,
                  ).length
                }
              </span>{" "}
              conflicts •{" "}
              <span>
                {
                  rows.filter(
                    (r) =>
                      (r.validation?.fuzzyMatches?.length || 0) > 0 &&
                      !r.proceedAnyway,
                  ).length
                }
              </span>{" "}
              need review
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={createAll}
                disabled={
                  !canEditRows ||
                  validRows.length === 0 ||
                  isSubmitting ||
                  isImporting ||
                  anyFailing ||
                  isSuccess
                }
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Creating…
                  </>
                ) : (
                  `Create All (${validRows.length})`
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
