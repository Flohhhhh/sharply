"use client";
import React, { useMemo } from "react";
import {
  useField,
  SelectInput,
  FieldLabel,
  FieldDescription,
} from "@payloadcms/ui";
import { BRANDS } from "~/lib/generated";
import { orderBrandsWithPriority } from "~/lib/brands";

const BrandSelect: React.FC<{
  name?: string;
  label?: string;
  description?: string;
  path?: string;
  field?: { name?: string; label?: string; admin?: { description?: string } };
}> = (props) => {
  const effectivePath =
    props.path ?? props.field?.name ?? props.name ?? "brand";
  const effectiveLabel = props.field?.label ?? props.label ?? "Brand";
  const effectiveDescription =
    props.field?.admin?.description ?? props.description;

  const { value, setValue } = useField<string>({ path: effectivePath });

  const options = useMemo(
    () =>
      orderBrandsWithPriority(
        BRANDS.map((b) => ({
          label: b.name,
          value: b.slug,
          name: b.name,
        })),
      ).map(({ label, value }) => ({ label, value })),
    [],
  );

  const placeholder = "Select a brand…";

  // Disable client-side option filtering so all options remain visible; the SelectInput already handles search
  const filterOption = () => true;

  return (
    <div className="sharply-field flex flex-col gap-2 py-2">
      <FieldLabel label={effectiveLabel} path={effectivePath} />
      <SelectInput
        name={`${effectivePath}-select`}
        path={effectivePath}
        options={options}
        value={value ?? ""}
        placeholder={placeholder}
        isClearable
        filterOption={filterOption}
        onChange={(selected: any) => {
          const next = Array.isArray(selected) ? selected[0] : selected;
          setValue(String(next?.value ?? ""));
        }}
      />
      {effectiveDescription && (
        <FieldDescription
          description={effectiveDescription}
          path={effectivePath}
        />
      )}
    </div>
  );
};

export default BrandSelect;
