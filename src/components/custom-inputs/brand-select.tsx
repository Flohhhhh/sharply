"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { BRANDS } from "~/lib/constants";
import { splitBrandsWithPriority } from "~/lib/brands";
import { XIcon } from "lucide-react";

type BrandOption = {
  id: string;
  name: string;
  slug: string;
};

type BrandSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  brands?: BrandOption[];
  valueKey?: "id" | "slug";
  allowClear?: boolean;
  clearLabel?: string;
  className?: string;
};

export function BrandSelect({
  value,
  onChange,
  disabled,
  placeholder = "Select a brand",
  brands,
  valueKey = "id",
  allowClear = true,
  clearLabel = "Clear selection",
  className,
}: BrandSelectProps): React.JSX.Element {
  const clearValue = "__brand_clear__";
  const selectValue = value ?? "";

  // Hoist popular brands while keeping the rest alphabetized for quick selection.
  const { hoisted, remaining } = React.useMemo(
    () =>
      splitBrandsWithPriority(
        (brands ?? BRANDS).map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
        })),
      ),
    [brands],
  );

  const shouldShowDivider = hoisted.length > 0 && remaining.length > 0;
  const getBrandValue = (brand: BrandOption) =>
    valueKey === "slug" ? brand.slug : brand.id;

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => {
        if (allowClear && next === clearValue) {
          onChange("");
          return;
        }
        onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClear ? (
          <SelectItem
            value={clearValue}
            className="text-muted-foreground flex items-center justify-between gap-2"
          >
            <XIcon className="size-4" />
            {clearLabel}
          </SelectItem>
        ) : null}
        {allowClear && (hoisted.length > 0 || remaining.length > 0) ? (
          <SelectSeparator />
        ) : null}
        {hoisted.map((brand) => (
          <SelectItem key={getBrandValue(brand)} value={getBrandValue(brand)}>
            {brand.name}
          </SelectItem>
        ))}
        {shouldShowDivider ? <SelectSeparator /> : null}
        {remaining.map((brand) => (
          <SelectItem key={getBrandValue(brand)} value={getBrandValue(brand)}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
