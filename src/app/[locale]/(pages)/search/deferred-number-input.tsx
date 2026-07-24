"use client";

import { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";

type DeferredNumberInputProps = {
  id: string;
  value: string | null;
  onCommit: (value: string | null) => void;
  placeholder: string;
};

export function DeferredNumberInput({
  id,
  value,
  onCommit,
  placeholder,
}: DeferredNumberInputProps) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  return (
    <Input
      id={id}
      type="number"
      min="0.1"
      step="0.1"
      inputMode="decimal"
      autoComplete="off"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft || null)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      placeholder={placeholder}
    />
  );
}
