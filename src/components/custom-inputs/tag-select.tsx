"use client";

import { useMemo } from "react";
import { MultiSelect } from "~/components/ui/multi-select";

export type TagSelectOption = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

export function buildTagSelectOptions(tags: readonly TagSelectOption[]) {
  return tags.map((tag) => ({ id: tag.slug, name: tag.name }));
}

type TagSelectProps = {
  value: string[];
  onChange: (slugs: string[]) => void;
  tags: readonly TagSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  getRemoveLabel?: (tagName: string) => string;
  className?: string;
  disabled?: boolean;
  inDialog?: boolean;
  ariaLabel: string;
};

export function TagSelect({
  value,
  onChange,
  tags,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  getRemoveLabel,
  className,
  disabled,
  inDialog,
  ariaLabel,
}: TagSelectProps) {
  const options = useMemo(() => buildTagSelectOptions(tags), [tags]);

  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      getRemoveLabel={getRemoveLabel}
      className={className}
      disabled={disabled}
      inDialog={inDialog}
      ariaLabel={ariaLabel}
    />
  );
}
