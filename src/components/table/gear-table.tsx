"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { createGearTableColumns } from "./gear-table-columns";
import { resolveGearTableScope } from "./gear-table-adapter";
import type { GearTableRow, GearTableScope } from "./gear-table-types";
import type { SortingState } from "@tanstack/react-table";

export function GearTable({
  rows,
  scope,
  initialSorting,
}: {
  rows: GearTableRow[];
  scope?: GearTableScope;
  initialSorting?: SortingState;
}) {
  const t = useTranslations("gearTable");
  const construction = useTranslations("underConstructionPage");
  const resolvedScope = scope ?? resolveGearTableScope(rows);
  const columns = useMemo(
    () =>
      createGearTableColumns(resolvedScope, {
        name: t("columns.name"),
        brand: t("columns.brand"),
        mount: t("columns.mount"),
        year: t("columns.year"),
        weight: t("columns.weight"),
        price: t("columns.price"),
        focalLength: t("columns.focalLength"),
        aperture: t("columns.aperture"),
        type: t("columns.type"),
        prime: t("prime"),
        zoom: t("zoom"),
        camera: t("camera"),
        lens: t("lens"),
        underConstruction: construction("statusUnderConstruction"),
        underConstructionTooltip: construction("searchIndicatorTooltip"),
        sortAscending: (values) => t("sortAscending", values),
        sortDescending: (values) => t("sortDescending", values),
      }),
    [construction, resolvedScope, t],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyContent={t("noResults")}
      initialSorting={initialSorting}
    />
  );
}
