"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { GearItem } from "~/types/gear";
import { getBrandNameById } from "~/lib/mapping/brand-map";
import { getItemDisplayPrice, PRICE_FALLBACK_TEXT } from "~/lib/mapping";
import { getSpecFieldDefByKey } from "~/lib/specs/registry";
import { useCountry } from "~/lib/hooks/useCountry";
import { GetGearDisplayName } from "~/lib/gear/naming";
import type { GearRegion } from "~/types/gear";

export const COLLECTION_TABLE_COLUMNS_DEFAULT = [
  "name",
  "displayPrice",
  "frontFilterThreadSizeMm",
  "weightGrams",
] as const;

export type CollectionTableColumnKey =
  (typeof COLLECTION_TABLE_COLUMNS_DEFAULT)[number];

type ColumnConfig = {
  key: CollectionTableColumnKey;
  label: string;
  render: (item: GearItem) => React.ReactNode;
};

type CollectionTableModalProps = {
  items: GearItem[];
  columnKeys?: CollectionTableColumnKey[];
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
};

function buildColumnConfigMap(region: GearRegion) {
  return {
    name: {
      key: "name",
      label: "Name",
      render: (item: GearItem) => {
        const brandName = getBrandNameById(item.brandId);
        const displayName = buildDisplayName(item, brandName, region);
        const brandLabel = brandName || "Unknown brand";

        return (
          <div className="flex min-w-[220px] flex-col">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {brandLabel}
            </span>
            <span className="font-medium">{displayName}</span>
          </div>
        );
      },
    },
    displayPrice: {
      key: "displayPrice",
      label: "Price",
      render: (item: GearItem) => {
        const displayPrice =
          getItemDisplayPrice(item, {
            style: "short",
            padWholeAmounts: true,
          }) ?? PRICE_FALLBACK_TEXT;
        return <span className="font-medium">{displayPrice}</span>;
      },
    },
    frontFilterThreadSizeMm: {
      key: "frontFilterThreadSizeMm",
      label: "Filter thread",
      render: (item: GearItem) => {
        const display = formatFilterThreadDisplay(item);
        return (
          <span
            className={
              display === "Not specified" ? "text-muted-foreground" : ""
            }
          >
            {display}
          </span>
        );
      },
    },
    weightGrams: {
      key: "weightGrams",
      label: "Weight",
      render: (item: GearItem) =>
        renderSpecFieldValue({
          item,
          fieldKey: "weightGrams",
          emptyFallbackLabel: "Not specified",
        }),
    },
  } satisfies Record<CollectionTableColumnKey, ColumnConfig>;
}

function buildDisplayName(
  item: GearItem,
  brandName: string | null | undefined,
  region: GearRegion,
) {
  const resolved = GetGearDisplayName(
    {
      name: item.name,
      regionalAliases: item.regionalAliases ?? [],
    },
    { region },
  );
  const trimmed = stripBrandFromName(resolved, brandName);
  return trimmed || resolved;
}

function stripBrandFromName(name: string, brandName?: string | null) {
  const normalizedName = name?.trim();
  if (!normalizedName) return normalizedName;

  if (!brandName) return normalizedName;

  const normalizedBrand = brandName.trim();
  if (!normalizedBrand) return normalizedName;

  const pattern = new RegExp(
    `^${escapeRegExp(normalizedBrand)}(?:\\s+|[-–—:]\\s*)`,
    "i",
  );

  const stripped = normalizedName.replace(pattern, "").trim();
  return stripped || normalizedName;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatFilterThreadDisplay(item: GearItem): string {
  if (item.gearType !== "LENS") {
    return "";
  }

  const frontFilterSize =
    item.lensSpecs?.frontFilterThreadSizeMm ??
    item.fixedLensSpecs?.frontFilterThreadSizeMm ??
    null;

  const acceptsFilterTypes = Array.isArray(item.lensSpecs?.acceptsFilterTypes)
    ? item.lensSpecs?.acceptsFilterTypes
    : [];

  const hasFrontScrewOn = acceptsFilterTypes.includes("front-screw-on");
  const hasOtherFilterType = acceptsFilterTypes.some(
    (filterType) => filterType !== "front-screw-on",
  );

  if (frontFilterSize != null && Number.isFinite(Number(frontFilterSize))) {
    return `${Number(frontFilterSize)}mm`;
  }

  if (hasOtherFilterType) {
    return "Other";
  }

  if (hasFrontScrewOn) {
    return "Not specified";
  }

  return "Not specified";
}

function renderSpecFieldValue(params: {
  item: GearItem;
  fieldKey: string;
  emptyFallbackLabel?: string;
}) {
  const { item, fieldKey, emptyFallbackLabel = "—" } = params;
  const fieldDefinition = getSpecFieldDefByKey(fieldKey);
  if (!fieldDefinition) return <span className="text-muted-foreground">—</span>;

  if (fieldDefinition.condition && !fieldDefinition.condition(item)) {
    return <span className="text-muted-foreground">{emptyFallbackLabel}</span>;
  }

  const rawValue = fieldDefinition.getRawValue(item);
  const renderedValue = fieldDefinition.formatDisplay
    ? fieldDefinition.formatDisplay(rawValue, item, true)
    : (rawValue as React.ReactNode | undefined);

  if (renderedValue === undefined || renderedValue === null) {
    return <span className="text-muted-foreground">{emptyFallbackLabel}</span>;
  }

  return renderedValue;
}

export function CollectionTableModal(props: CollectionTableModalProps) {
  const {
    items,
    columnKeys = COLLECTION_TABLE_COLUMNS_DEFAULT,
    trigger,
    title = "View as table",
    description = "Inspect your collection items in a table.",
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const { region } = useCountry();
  const columnConfigMap = useMemo(() => buildColumnConfigMap(region), [region]);

  const columns = useMemo(() => {
    const uniqueKeys: CollectionTableColumnKey[] = [];
    for (const key of columnKeys) {
      if (!uniqueKeys.includes(key)) uniqueKeys.push(key);
    }
    return uniqueKeys
      .map((key) => columnConfigMap[key])
      .filter(Boolean) as ColumnConfig[];
  }, [columnKeys, columnConfigMap]);

  const modalTrigger = trigger ?? (
    <Button variant="outline" size="sm">
      View as table
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>{modalTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CollectionTableModal;
