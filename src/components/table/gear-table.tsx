"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { createGearTableColumns } from "./gear-table-columns";
import { resolveGearTableScope } from "./gear-table-adapter";
import type { GearTableRow, GearTableScope } from "./gear-table-types";

export function GearTable({
  rows,
  scope,
}: {
  rows: GearTableRow[];
  scope?: GearTableScope;
}) {
  const t = useTranslations("gearTable");
  const resolvedScope = scope ?? resolveGearTableScope(rows);
  const columns = useMemo(
    () =>
      createGearTableColumns(resolvedScope, {
        name: t("columns.name"),
        brand: t("columns.brand"),
        mount: t("columns.mount"),
        sensorFormat: t("columns.sensorFormat"),
        megapixels: t("columns.megapixels"),
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
        sortAscending: (values) => t("sortAscending", values),
        sortDescending: (values) => t("sortDescending", values),
      }),
    [resolvedScope, t],
  );

  return (
    <DataTable columns={columns} data={rows} emptyContent={t("noResults")} />
  );
}
