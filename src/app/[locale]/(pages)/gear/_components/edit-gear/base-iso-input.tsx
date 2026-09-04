"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import IsoInput from "~/components/custom-inputs/iso-input";
import { normalizeBaseIsoValues } from "~/lib/format/iso";

export const MAX_BASE_ISO_ENTRIES = 3;

type BaseIsoInputProps = {
  value: number[] | null | undefined;
  onChange: (value: number[] | null) => void;
  label: string;
  addLabel: string;
  removeLabel: string;
  helpText: string;
  invalidMessage: string;
  disabled?: boolean;
  labelAdornment?: ReactNode;
};

function toRows(value: number[] | null | undefined): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function BaseIsoInput({
  value,
  onChange,
  label,
  addLabel,
  removeLabel,
  helpText,
  invalidMessage,
  disabled = false,
  labelAdornment,
}: BaseIsoInputProps) {
  const [rows, setRows] = useState(() => toRows(value));

  useEffect(() => setRows(toRows(value)), [value]);

  const commit = (nextRows: string[]) => {
    setRows(nextRows);
    const parsed = nextRows.map((row) => Number(row));
    const valid = parsed.every(
      (entry, index) =>
        nextRows[index]?.trim() !== "" &&
        Number.isInteger(entry) &&
        entry > 0,
    );
    if (!valid) return;
    onChange(
      parsed.length === 0 ? null : normalizeBaseIsoValues(parsed),
    );
  };

  return (
    <div
      id="baseIso"
      data-force-ring-container
      className="space-y-2 rounded-md border p-3"
    >
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {labelAdornment}
      </div>
      <p className="text-muted-foreground text-sm">{helpText}</p>
      {rows.map((row, index) => {
        const invalid = row.trim() === "";
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <IsoInput
                ariaLabel={`${label} ${index + 1}`}
                disabled={disabled}
                hideLabel
                id={`baseIso-${index}`}
                label={`${label} ${index + 1}`}
                placeholder={label}
                required
                value={row === "" ? undefined : Number(row)}
                onChange={(nextValue) => {
                  const nextRows = [...rows];
                  nextRows[index] = nextValue?.toString() ?? "";
                  commit(nextRows);
                }}
              />
              <Button
                aria-label={`${removeLabel} ${index + 1}`}
                disabled={disabled}
                onClick={() => commit(rows.filter((_, i) => i !== index))}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden />
              </Button>
            </div>
            {invalid ? (
              <p className="text-destructive text-sm" role="alert">
                {invalidMessage}
              </p>
            ) : null}
          </div>
        );
      })}
      <Button
        disabled={disabled || rows.length >= MAX_BASE_ISO_ENTRIES}
        onClick={() => setRows([...rows, ""])}
        type="button"
        variant="outline"
      >
        <Plus aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}
