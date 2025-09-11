"use client";

import { useCallback } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";

export interface MultiTextInputProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  addButtonLabel?: string;
}

export function MultiTextInput({
  id,
  label,
  values,
  onChange,
  placeholder = "",
  className = "",
  addButtonLabel = "Add",
}: MultiTextInputProps) {
  const updateAt = useCallback(
    (index: number, nextValue: string) => {
      const next = [...values];
      next[index] = nextValue;
      onChange(next);
    },
    [values, onChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      const next = values.filter((_, i) => i !== index);
      onChange(next);
    },
    [values, onChange],
  );

  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (index < 0 || index >= values.length) return;
      if (target < 0 || target >= values.length) return;
      const next = [...values];
      const a = next[index];
      const b = next[target];
      if (a === undefined || b === undefined) return;
      next[index] = b;
      next[target] = a;
      onChange(next);
    },
    [values, onChange],
  );

  const addNew = useCallback(() => {
    onChange([...(values ?? []), ""]);
  }, [values, onChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="space-y-2">
        {(values?.length ? values : [""]).map((val, idx, rows) => {
          const inputId = `${id}-${idx}`;
          const isFirst = idx === 0;
          const isLast = idx === rows.length - 1;
          return (
            <div key={inputId} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Move up"
                  onClick={() => move(idx, -1)}
                  disabled={isFirst}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Move down"
                  onClick={() => move(idx, 1)}
                  disabled={isLast}
                >
                  <ArrowDown className="size-4" />
                </Button>
              </div>
              <Input
                id={inputId}
                value={val}
                placeholder={placeholder}
                onChange={(e) => updateAt(idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() => removeAt(idx)}
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={addNew}
            icon={<Plus className="size-4" />}
          >
            {addButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MultiTextInput;
