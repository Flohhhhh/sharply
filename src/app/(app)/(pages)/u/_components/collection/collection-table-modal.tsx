"use client";

import { useEffect, useMemo, useState } from "react";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";
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
import { actionToggleOwnership } from "~/server/gear/actions";

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
    title = "Manage collection",
    description = "Inspect and manage your collection items.",
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const { region } = useCountry();
  const columnConfigMap = useMemo(() => buildColumnConfigMap(region), [region]);
  const [itemsState, setItemsState] = useState<GearItem[]>(items);
  const [removingGearItemIds, setRemovingGearItemIds] = useState<Set<string>>(
    new Set(),
  );

  // Keep local state aligned with the latest server-provided items when opening
  // the modal (and also when the prop changes due to a parent rerender).
  useEffect(() => {
    if (!isOpen) return;
    setItemsState(items);
  }, [isOpen, items]);

  const addRemovingId = (gearItemId: string) => {
    setRemovingGearItemIds((previousIds) => {
      const nextIds = new Set(previousIds);
      nextIds.add(gearItemId);
      return nextIds;
    });
  };

  const removeRemovingId = (gearItemId: string) => {
    setRemovingGearItemIds((previousIds) => {
      const nextIds = new Set(previousIds);
      nextIds.delete(gearItemId);
      return nextIds;
    });
  };

  const getToastDisplayName = (item: GearItem) => {
    const brandName = getBrandNameById(item.brandId);
    return buildDisplayName(item, brandName, region);
  };

  const handleUndo = async (item: GearItem) => {
    addRemovingId(item.id);
    const itemDisplayName = getToastDisplayName(item);

    const undoPromise = actionToggleOwnership(item.slug, "add");
    toast.promise(undoPromise, {
      loading: `Adding ${itemDisplayName}...`,
      success: `Added ${itemDisplayName}`,
      error: `Failed to restore ${itemDisplayName}`,
    });

    try {
      await undoPromise;
      setItemsState((previousItems) => {
        if (previousItems.some((existingItem) => existingItem.id === item.id)) {
          return previousItems;
        }
        return [...previousItems, item];
      });
    } finally {
      removeRemovingId(item.id);
    }
  };

  const handleRemove = async (item: GearItem) => {
    addRemovingId(item.id);
    const itemDisplayName = getToastDisplayName(item);

    const removePromise = actionToggleOwnership(item.slug, "remove");
    toast.promise(removePromise, {
      loading: `Removing ${itemDisplayName}...`,
      success: () => ({
        message: "Removed successfully",
        description: `${itemDisplayName} was removed from your collection`,
        duration: 12000,
        action: {
          label: "Undo",
          onClick: () => void handleUndo(item),
        },
      }),
      error: `Failed to remove ${itemDisplayName}`,
    });

    try {
      await removePromise;
      setItemsState((previousItems) =>
        previousItems.filter((existingItem) => existingItem.id !== item.id),
      );
    } finally {
      removeRemovingId(item.id);
    }
  };

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
      Manage collection
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
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsState.map((item) => (
                <TableRow key={item.id} className="group">
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleRemove(item)}
                      disabled={removingGearItemIds.has(item.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
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
