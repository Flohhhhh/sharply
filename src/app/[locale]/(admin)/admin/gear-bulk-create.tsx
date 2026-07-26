"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  CheckCircle,
  ChevronDown,
  Clipboard,
  Copy,
  Loader2,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BrandSelect } from "~/components/custom-inputs/brand-select";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import {
  BULK_IMPORT_FIELD_GUIDE,
  BULK_IMPORT_TEMPLATE_CSV,
  applyLensInferencesFromName,
  buildBulkImportAiFixPrompt,
  buildBulkImportValidationReport,
  getMappedValueCount,
  parseGearBulkImportCsv,
  type BulkImportParsedRow,
  type BulkImportValidationMessage,
} from "~/lib/admin/gear-bulk-import";
import { createBulkGearReviewDebouncer } from "~/lib/admin/gear-bulk-review-debounce";
import { BRANDS, ENUMS } from "~/lib/constants";
import { GEAR_PUBLICATION_STATES } from "~/lib/gear/publication-state";
import { humanizeKey } from "~/lib/utils";
import {
  getNameSoftWarnings,
  isBrandNameOnly as isBrandOnlyName,
} from "~/lib/validation/gear-creation-validations";
import type { GearType } from "~/types/gear";

type RowValidation = {
  slugPreview: string;
  slugConflict: boolean;
  modelConflict: boolean;
  fuzzyMatches: { id: string; name: string; slug: string }[];
};

type ImportRowState = BulkImportParsedRow & {
  id: string;
  validation: RowValidation | null;
  validationStatus: "pending" | "validating" | "done" | "error";
  proceedAnyway: boolean;
  expanded: boolean;
  status: "idle" | "creating" | "created" | "error";
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

function getBrandById(brandId: string | undefined) {
  if (!brandId) return undefined;
  return BRANDS.find((brand) => brand.id === brandId);
}

function makeManualRow(params: {
  rowNumber: number;
  brandId?: string;
}): ImportRowState {
  const brand = getBrandById(params.brandId);
  return {
    id: crypto.randomUUID(),
    rowNumber: params.rowNumber,
    raw: {},
    name: "",
    modelNumber: undefined,
    brandId: brand?.id,
    brandName: brand?.name,
    mountIds: [],
    mountValues: [],
    core: {},
    lens: {},
    inferred: { focalLength: false, aperture: false },
    validations: [],
    validation: null,
    validationStatus: "done",
    proceedAnyway: false,
    expanded: false,
    status: "idle",
  };
}

function applyNameInferences(row: ImportRowState): ImportRowState {
  const { lens, inferred } = applyLensInferencesFromName(row.name, row.lens);
  return {
    ...row,
    lens,
    inferred,
  };
}

function validationMessagesForRow(
  row: ImportRowState,
  gearType: GearType | "",
): BulkImportValidationMessage[] {
  const messages: BulkImportValidationMessage[] = [];
  const v = row.validation;
  const brandNameOnly = isBrandOnlyName({
    name: row.name,
    brandName: row.brandName,
  });

  if (!row.name.trim()) {
    messages.push({ level: "error", message: "Name is required." });
  }
  if (!row.brandId) {
    messages.push({ level: "error", message: "Brand is required." });
  }
  if (
    row.validationStatus === "pending" ||
    row.validationStatus === "validating"
  ) {
    messages.push({
      level: "warning",
      message: "Duplicate check is still running.",
    });
  }
  if (row.validationStatus === "error") {
    messages.push({
      level: "warning",
      message: "Duplicate check failed. Try importing again.",
    });
  }
  if (brandNameOnly) {
    messages.push({
      level: "error",
      message: `Name is only the brand "${row.brandName}". Add the specific product name.`,
    });
  }
  if (v?.slugConflict) {
    messages.push({
      level: "error",
      message: `Slug "${v.slugPreview}" already exists.`,
    });
  }
  if (v?.modelConflict) {
    messages.push({
      level: "error",
      message: `Model number "${row.modelNumber}" already exists.`,
    });
  }
  if ((v?.fuzzyMatches.length ?? 0) > 0 && !row.proceedAnyway) {
    messages.push({
      level: "warning",
      message: `Similar items found: ${v!.fuzzyMatches
        .slice(0, 5)
        .map((match) => `${match.name} (${match.slug})`)
        .join("; ")}. Mark reviewed if this is not a duplicate.`,
    });
  }

  for (const warning of getNameSoftWarnings({
    name: row.name,
    brandName: row.brandName,
    gearType,
  })) {
    messages.push({ level: "warning", message: warning.description });
  }

  if (row.status === "error") {
    messages.push({
      level: "error",
      message: `Creation failed: ${row.errorMessage ?? "Create failed."}`,
    });
  }

  return messages;
}

function isRowReady(row: ImportRowState, gearType: GearType | ""): boolean {
  const parseErrors = row.validations.some(
    (message) => message.level === "error",
  );
  const duplicateMessages = validationMessagesForRow(row, gearType);
  const hardErrors = duplicateMessages.some(
    (message) => message.level === "error",
  );
  const fuzzyNeedsReview =
    (row.validation?.fuzzyMatches.length ?? 0) > 0 && !row.proceedAnyway;

  return (
    row.name.trim().length > 0 &&
    Boolean(row.brandId) &&
    !parseErrors &&
    !hardErrors &&
    !fuzzyNeedsReview &&
    row.validationStatus === "done" &&
    row.status !== "created"
  );
}

function formatFocal(row: ImportRowState): string {
  const min = row.lens.focalLengthMinMm;
  const max = row.lens.focalLengthMaxMm;
  if (min === undefined && max === undefined) return "—";
  if (min !== undefined && max !== undefined && min !== max) {
    return `${min}-${max}mm${row.inferred.focalLength ? " inferred" : ""}`;
  }
  return `${min ?? max}mm${row.inferred.focalLength ? " inferred" : ""}`;
}

function formatAperture(row: ImportRowState): string {
  const wide = row.lens.maxApertureWide;
  const tele = row.lens.maxApertureTele;
  if (wide === undefined) return "—";
  if (tele !== undefined && tele !== wide) {
    return `f/${wide}-${tele}${row.inferred.aperture ? " inferred" : ""}`;
  }
  return `f/${wide}${row.inferred.aperture ? " inferred" : ""}`;
}

function RowDetails({
  row,
  gearType,
  onToggleProceed,
}: {
  row: ImportRowState;
  gearType: GearType | "";
  onToggleProceed: (id: string) => void;
}) {
  const messages = [
    ...row.validations,
    ...validationMessagesForRow(row, gearType),
  ];

  return (
    <div className="max-w-full min-w-0 overflow-hidden p-4">
      {messages.length > 0 ? (
        <div className="flex flex-col gap-2">
          {messages.map((message, index) => (
            <div
              key={`${message.level}-${index}`}
              className="flex min-w-0 items-start gap-2 text-sm"
            >
              <Badge
                variant={
                  message.level === "error" ? "destructive" : "secondary"
                }
                className="shrink-0"
              >
                {message.level}
              </Badge>
              <span className="min-w-0 break-words whitespace-normal">
                {message.message}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">
          No validation issues.
        </div>
      )}
      {(row.validation?.fuzzyMatches.length ?? 0) > 0 ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={row.proceedAnyway}
            onChange={() => onToggleProceed(row.id)}
            disabled={row.status === "created"}
          />
          Reviewed; this row is not a duplicate.
        </label>
      ) : null}
    </div>
  );
}

async function copyText(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(label);
}

export default function GearBulkCreate(): React.JSX.Element {
  const t = useTranslations("gearDetail");
  const [gearType, setGearType] = React.useState<GearType | "">("LENS");
  const [publicationState, setPublicationState] = React.useState<
    "PUBLISHED" | "RUMORED" | "HIDDEN"
  >(GEAR_PUBLICATION_STATES.PUBLISHED);
  const [rows, setRows] = React.useState<ImportRowState[]>([]);
  const [csvText, setCsvText] = React.useState(BULK_IMPORT_TEMPLATE_CSV);
  const [isCsvOpen, setIsCsvOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [parseErrors, setParseErrors] = React.useState<string[]>([]);
  const [unknownHeaders, setUnknownHeaders] = React.useState<string[]>([]);
  const rowsRef = React.useRef(rows);
  const [validationDebouncer] = React.useState(() =>
    createBulkGearReviewDebouncer(),
  );
  const validationRequests = React.useRef(new Map<string, AbortController>());

  React.useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const patchRow = React.useCallback(
    (id: string, patch: Partial<ImportRowState>) => {
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      );
    },
    [],
  );

  const validateRow = React.useCallback(
    async (row: ImportRowState) => {
      if (row.status === "created" || !row.brandId || !row.name.trim()) {
        patchRow(row.id, { validationStatus: "done", validation: null });
        return;
      }

      validationRequests.current.get(row.id)?.abort();
      const request = new AbortController();
      validationRequests.current.set(row.id, request);

      patchRow(row.id, { validationStatus: "validating" });
      const params = new URLSearchParams({
        brandId: row.brandId,
        name: row.name,
        modelNumber: row.modelNumber ?? "",
      }).toString();

      try {
        const response = await fetch(`/api/admin/gear/create/check?${params}`, {
          signal: request.signal,
        });
        if (!response.ok) {
          throw new Error(`Duplicate check failed with ${response.status}`);
        }
        const json = await response.json();
        const data = CheckResponse.parse(json);
        if (
          request.signal.aborted ||
          validationRequests.current.get(row.id) !== request
        ) {
          return;
        }
        patchRow(row.id, {
          validationStatus: "done",
          validation: {
            slugPreview: data.slugPreview,
            slugConflict: Boolean(data.hard.slug),
            modelConflict: Boolean(data.hard.modelName),
            fuzzyMatches: data.fuzzy,
          },
        });
      } catch {
        if (
          request.signal.aborted ||
          validationRequests.current.get(row.id) !== request
        ) {
          return;
        }
        patchRow(row.id, { validationStatus: "error", validation: null });
      } finally {
        if (validationRequests.current.get(row.id) === request) {
          validationRequests.current.delete(row.id);
        }
      }
    },
    [patchRow],
  );

  const validateRows = React.useCallback(
    async (rowsToValidate: ImportRowState[]) => {
      await Promise.all(rowsToValidate.map(validateRow));
    },
    [validateRow],
  );

  const queueRowValidation = React.useCallback(
    (rowId: string) => {
      validationRequests.current.get(rowId)?.abort();
      validationRequests.current.delete(rowId);
      validationDebouncer.schedule(rowId, () => {
        const current = rowsRef.current.find((row) => row.id === rowId);
        if (current) void validateRow(current);
      });
    },
    [validateRow, validationDebouncer],
  );

  React.useEffect(() => {
    return () => {
      validationDebouncer.clear();
      for (const request of validationRequests.current.values()) {
        request.abort();
      }
      validationRequests.current.clear();
    };
  }, [validationDebouncer]);

  const updateEditableRow = React.useCallback(
    (
      id: string,
      patch: Partial<
        Pick<ImportRowState, "name" | "modelNumber" | "brandId" | "brandName">
      >,
    ) => {
      const withBrand =
        patch.brandId !== undefined
          ? (() => {
              const brand = getBrandById(patch.brandId);
              return {
                ...patch,
                brandId: brand?.id,
                brandName: brand?.name,
              };
            })()
          : patch;

      setRows((existing) =>
        existing.map((row) => {
          if (row.id !== id || row.status === "created") return row;
          return applyNameInferences({
            ...row,
            ...withBrand,
            validation: null,
            validationStatus: "pending",
            status: "idle",
            errorMessage: undefined,
            proceedAnyway: false,
          });
        }),
      );
      queueRowValidation(id);
    },
    [queueRowValidation],
  );

  const importCsv = React.useCallback(async () => {
    setIsImporting(true);
    try {
      const parsed = parseGearBulkImportCsv(csvText);
      setParseErrors(parsed.errors);
      setUnknownHeaders(parsed.unknownHeaders);
      const nextRows: ImportRowState[] = parsed.rows.map((row) => ({
        ...row,
        id: crypto.randomUUID(),
        validation: null,
        validationStatus: "pending",
        proceedAnyway: false,
        expanded: false,
        status: "idle",
      }));
      setRows(nextRows);
      if (parsed.errors.length === 0) {
        setIsCsvOpen(false);
        void validateRows(nextRows);
      }
    } finally {
      setIsImporting(false);
    }
  }, [csvText, validateRows]);

  const removeRow = React.useCallback(
    (id: string) => {
      validationDebouncer.cancel(id);
      validationRequests.current.get(id)?.abort();
      validationRequests.current.delete(id);
      setRows((current) => current.filter((row) => row.id !== id));
    },
    [validationDebouncer],
  );

  const addManualRow = React.useCallback(() => {
    const lastRow = rows.at(-1);
    const nextRow = makeManualRow({
      rowNumber: rows.reduce((max, row) => Math.max(max, row.rowNumber), 0) + 1,
      brandId: lastRow?.brandId,
    });
    setRows((current) => [...current, nextRow]);
  }, [rows]);

  const toggleExpanded = React.useCallback((id: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, expanded: !row.expanded } : row,
      ),
    );
  }, []);

  const toggleProceed = React.useCallback((id: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, proceedAnyway: !row.proceedAnyway } : row,
      ),
    );
  }, []);

  const readyRows = React.useMemo(
    () => rows.filter((row) => isRowReady(row, gearType)),
    [gearType, rows],
  );

  const validationReport = React.useMemo(
    () =>
      buildBulkImportValidationReport(
        rows.map((row) => ({
          rowNumber: row.rowNumber,
          name: row.name,
          brandName: row.brandName,
          mountValues: row.mountValues,
          validations: row.validations,
          duplicateMessages: validationMessagesForRow(row, gearType),
        })),
      ),
    [gearType, rows],
  );

  const aiFixPrompt = React.useMemo(
    () =>
      buildBulkImportAiFixPrompt({
        csvText,
        validationReport,
        fieldGuide: BULK_IMPORT_FIELD_GUIDE,
      }),
    [csvText, validationReport],
  );

  const createAll = React.useCallback(async () => {
    if (!gearType || readyRows.length === 0) return;
    setIsSubmitting(true);
    let createdCount = 0;

    try {
      const { actionCreateGear } = await import("~/server/admin/gear/actions");
      for (const row of readyRows) {
        if (!row.brandId) continue;
        patchRow(row.id, { status: "creating", errorMessage: undefined });
        try {
          const result = await actionCreateGear({
            name: row.name,
            modelNumber: row.modelNumber,
            brandId: row.brandId,
            gearType,
            publicationState,
            mountIds: row.mountIds.length > 0 ? row.mountIds : undefined,
            initialCore: row.core,
            initialLensSpecs: gearType === "LENS" ? row.lens : undefined,
            force: row.proceedAnyway,
          });
          createdCount++;
          patchRow(row.id, {
            status: "created",
            createdSlug: result.slug,
            expanded: false,
          });
        } catch (error) {
          patchRow(row.id, {
            status: "error",
            errorMessage:
              error instanceof Error ? error.message : "Unknown create error.",
          });
        }
      }
      toast.success(
        `Created ${createdCount} gear item${createdCount === 1 ? "" : "s"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [gearType, patchRow, publicationState, readyRows]);

  const columns = React.useMemo<ColumnDef<ImportRowState>[]>(
    () => [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row }) => row.original.rowNumber,
      },
      {
        accessorKey: "brandName",
        header: "Brand",
        cell: ({ row }) => (
          <BrandSelect
            value={row.original.brandId ?? ""}
            onChange={(brandId) =>
              updateEditableRow(row.original.id, { brandId })
            }
            disabled={row.original.status === "created"}
            placeholder="Brand"
            allowClear
            className="min-w-[10rem]"
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <Input
            value={row.original.name}
            onChange={(event) =>
              updateEditableRow(row.original.id, {
                name: event.target.value,
              })
            }
            disabled={row.original.status === "created"}
            placeholder="Product name"
            className="min-w-[18rem]"
          />
        ),
      },
      {
        accessorKey: "modelNumber",
        header: "Model",
        cell: ({ row }) => (
          <Input
            value={row.original.modelNumber ?? ""}
            onChange={(event) =>
              updateEditableRow(row.original.id, {
                modelNumber: event.target.value.trim() || undefined,
              })
            }
            disabled={row.original.status === "created"}
            placeholder="Optional"
            className="min-w-[9rem]"
          />
        ),
      },
      {
        id: "mounts",
        header: "Mounts",
        cell: ({ row }) =>
          row.original.mountValues.length > 0
            ? row.original.mountValues.join(", ")
            : "—",
      },
      {
        id: "lens",
        header: "Focal / Aperture",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{formatFocal(row.original)}</div>
            <div className="text-muted-foreground">
              {formatAperture(row.original)}
            </div>
          </div>
        ),
      },
      {
        id: "mapped",
        header: "Mapped",
        cell: ({ row }) => getMappedValueCount(row.original),
      },
      {
        id: "status",
        header: "Validation",
        cell: ({ row }) => {
          const original = row.original;
          const messages = [
            ...original.validations,
            ...validationMessagesForRow(original, gearType),
          ];
          const hasError = messages.some(
            (message) => message.level === "error",
          );
          const hasWarning = messages.some(
            (message) => message.level === "warning",
          );
          const reviewedDuplicate =
            (original.validation?.fuzzyMatches.length ?? 0) > 0 &&
            original.proceedAnyway;

          if (original.status === "created") {
            return (
              <Badge variant="secondary">
                <CheckCircle data-icon="inline-start" />
                Created
              </Badge>
            );
          }
          if (
            original.status === "creating" ||
            original.validationStatus === "validating"
          ) {
            return (
              <Badge variant="secondary">
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Checking
              </Badge>
            );
          }
          if (hasError) {
            return (
              <Badge variant="destructive">
                <XCircle data-icon="inline-start" />
                Errors
              </Badge>
            );
          }
          if (reviewedDuplicate) {
            return (
              <Badge variant="secondary">
                <CheckCircle data-icon="inline-start" />
                Reviewed
              </Badge>
            );
          }
          if (hasWarning) {
            return <Badge variant="secondary">Review</Badge>;
          }
          return (
            <Badge variant="secondary">
              <CheckCircle data-icon="inline-start" />
              Ready
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(row.original.id)}
            >
              <ChevronDown
                data-icon="inline-start"
                className={row.original.expanded ? "rotate-180" : undefined}
              />
              Details
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Remove row"
              onClick={() => removeRow(row.original.id)}
              disabled={row.original.status === "creating"}
            >
              <Trash2 data-icon="inline-start" />
            </Button>
          </div>
        ),
      },
    ],
    [gearType, removeRow, toggleExpanded, updateEditableRow],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const conflictCount = rows.filter(
    (row) =>
      row.validations.some((message) => message.level === "error") ||
      validationMessagesForRow(row, gearType).some(
        (message) => message.level === "error",
      ),
  ).length;
  const reviewCount = rows.filter(
    (row) =>
      (row.validation?.fuzzyMatches.length ?? 0) > 0 && !row.proceedAnyway,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(12rem,16rem)_minmax(12rem,16rem)_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Type</label>
          <Select
            value={gearType}
            onValueChange={(value) => setGearType(value as GearType)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {(ENUMS.gear_type ?? []).map((value) => (
                <SelectItem key={value} value={value}>
                  {value === "ANALOG_CAMERA"
                    ? "Analog Camera"
                    : humanizeKey(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            {t("publicationStateLabel")}
          </label>
          <Select
            value={publicationState}
            onValueChange={(value) =>
              setPublicationState(value as "PUBLISHED" | "RUMORED" | "HIDDEN")
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GEAR_PUBLICATION_STATES.PUBLISHED}>
                {t("publicationStatePublished")}
              </SelectItem>
              <SelectItem value={GEAR_PUBLICATION_STATES.RUMORED}>
                {t("publicationStateRumored")}
              </SelectItem>
              <SelectItem value={GEAR_PUBLICATION_STATES.HIDDEN}>
                {t("publicationStateHidden")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 md:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={addManualRow}
            disabled={isSubmitting}
          >
            + Add Row
          </Button>
          <Dialog open={isCsvOpen} onOpenChange={setIsCsvOpen}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCsvOpen(true)}
              disabled={isSubmitting}
            >
              <Upload data-icon="inline-start" />
              Paste CSV
            </Button>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-none overflow-y-auto sm:w-[min(92vw,84rem)]">
              <DialogHeader>
                <DialogTitle>Import from CSV</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">Template CSV</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyText(BULK_IMPORT_TEMPLATE_CSV, "Template copied")
                      }
                    >
                      <Copy data-icon="inline-start" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={BULK_IMPORT_TEMPLATE_CSV}
                    readOnly
                    rows={4}
                    className="field-sizing-fixed resize-y font-mono text-xs"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">Field Guide</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyText(BULK_IMPORT_FIELD_GUIDE, "Field guide copied")
                      }
                    >
                      <Copy data-icon="inline-start" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={BULK_IMPORT_FIELD_GUIDE}
                    readOnly
                    rows={4}
                    className="field-sizing-fixed resize-y text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">CSV rows</label>
                <Textarea
                  value={csvText}
                  onChange={(event) => setCsvText(event.target.value)}
                  rows={20}
                  className="field-sizing-fixed min-h-[42vh] resize-y overflow-auto font-mono text-sm break-words whitespace-pre-wrap"
                  wrap="soft"
                />
                {parseErrors.length > 0 ? (
                  <div className="text-destructive text-sm">
                    {parseErrors.join(" ")}
                  </div>
                ) : null}
                {unknownHeaders.length > 0 ? (
                  <div className="text-muted-foreground text-sm">
                    Ignored unknown headers: {unknownHeaders.join(", ")}
                  </div>
                ) : null}
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
                  onClick={importCsv}
                  disabled={isImporting || csvText.trim().length === 0}
                >
                  {isImporting ? (
                    <Loader2
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <Upload data-icon="inline-start" />
                  )}
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            variant="outline"
            disabled={!validationReport}
            onClick={() => copyText(aiFixPrompt, "AI fix prompt copied")}
          >
            <Clipboard data-icon="inline-start" />
            Copy AI Fix Prompt
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow className="odd:bg-transparent even:bg-transparent">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.original.expanded ? (
                    <TableRow className="odd:bg-transparent even:bg-transparent hover:bg-transparent">
                      <TableCell
                        colSpan={columns.length}
                        className="max-w-0 p-0 whitespace-normal"
                      >
                        <Collapsible open={row.original.expanded}>
                          <CollapsibleContent forceMount>
                            <RowDetails
                              row={row.original}
                              gearType={gearType}
                              onToggleProceed={toggleProceed}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))
            ) : (
              <TableRow className="odd:bg-transparent even:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  Paste a CSV batch to preview mapped rows.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="bg-muted/30 flex flex-col gap-3 border-t p-3 md:flex-row md:items-center md:justify-between">
          <div className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">
              {readyRows.length}
            </span>{" "}
            ready • <span>{conflictCount}</span> errors •{" "}
            <span>{reviewCount}</span> need duplicate review
          </div>
          <Button
            type="button"
            onClick={createAll}
            disabled={
              !gearType ||
              readyRows.length === 0 ||
              isSubmitting ||
              rows.some((row) => row.validationStatus === "validating")
            }
          >
            {isSubmitting ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <CheckCircle data-icon="inline-start" />
            )}
            Create Ready Rows ({readyRows.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
