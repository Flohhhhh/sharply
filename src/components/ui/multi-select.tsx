"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";

export type MultiSelectOption = { id: string; name: string };

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  maxSelected?: number;
  className?: string;
  searchPlaceholder?: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  maxSelected,
  className,
  searchPlaceholder = "Search...",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = React.useMemo(
    () => options.filter((o) => value.includes(o.id)),
    [options, value],
  );
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q),
    );
  }, [options, query]);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (maxSelected && value.length >= maxSelected) return;
      onChange([...value, id]);
    }
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-9 w-full items-start justify-between"
          >
            <div className="flex min-h-5 flex-1 flex-wrap items-center gap-1">
              {selected.length > 0 ? (
                selected.map((s) => (
                  <span
                    key={s.id}
                    className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {s.name}
                    <X
                      className="h-3 w-3 cursor-pointer opacity-70"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(s.id);
                      }}
                    />
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">
                  {placeholder}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-2">
          <div className="mb-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="max-h-56 space-y-1 overflow-auto">
            {filtered.map((opt) => {
              const isSelected = value.includes(opt.id);
              const disabled =
                !!maxSelected && !isSelected && value.length >= maxSelected;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => toggle(opt.id)}
                  disabled={disabled}
                  className={cn(
                    "hover:bg-accent flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm",
                    disabled && "opacity-50",
                  )}
                >
                  <span>{opt.name}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-muted-foreground px-2 py-1 text-sm">
                No results
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default MultiSelect;
