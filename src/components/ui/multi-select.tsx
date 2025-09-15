"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import * as PopoverBase from "~/components/ui/popover";
import * as PopoverInDialog from "~/components/ui/popover-in-dialog";
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
  inDialog?: boolean;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  maxSelected,
  className,
  searchPlaceholder = "Search...",
  inDialog,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [detectedInDialog, setDetectedInDialog] = React.useState(false);

  React.useEffect(() => {
    if (containerRef.current) {
      const isInsideDialog = !!containerRef.current.closest(
        '[data-slot="dialog-content"]',
      );
      setDetectedInDialog(isInsideDialog);
    }
  }, []);

  const useDialog = React.useMemo(
    () => (typeof inDialog === "boolean" ? inDialog : detectedInDialog),
    [inDialog, detectedInDialog],
  );

  const P = useDialog ? PopoverInDialog : PopoverBase;

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
    const isNone = id.toLowerCase() === "none";

    // If selecting the special "none" option, make it exclusive
    if (isNone) {
      const first = value[0];
      const currentlyOnlyNone =
        value.length === 1 &&
        typeof first === "string" &&
        first.toLowerCase() === "none";
      if (currentlyOnlyNone) {
        // toggle off "none"
        onChange([]);
      } else {
        // select only "none" and clear all others
        onChange([id]);
      }
      return;
    }

    // For any non-"none" option, ensure "none" is cleared
    const withoutNone = value.filter((v) => v.toLowerCase() !== "none");

    if (withoutNone.includes(id)) {
      onChange(withoutNone.filter((v) => v !== id));
    } else {
      if (maxSelected && withoutNone.length >= maxSelected) return;
      onChange([...withoutNone, id]);
    }
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <P.Popover open={open} onOpenChange={setOpen}>
        <P.PopoverTrigger asChild>
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
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {s.name}
                    <span
                      className="pointer-events-auto inline-flex h-3 w-3 items-center justify-center"
                      role="button"
                      aria-label={`Remove ${s.name}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(s.id);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(s.id);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(s.id);
                      }}
                    >
                      <X className="h-3 w-3 opacity-70" />
                    </span>
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
        </P.PopoverTrigger>
        <P.PopoverContent className="w-[--radix-popover-trigger-width] p-2">
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
        </P.PopoverContent>
      </P.Popover>
    </div>
  );
}

export default MultiSelect;
