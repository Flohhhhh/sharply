"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";

interface DateInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DateInput({
  label,
  value,
  onChange,
  placeholder,
}: DateInputProps) {
  // Local display state in format: "YYYY/MM/DD" (slashes)
  const [display, setDisplay] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const id = useMemo(() => label.toLowerCase().replace(/\s+/g, "-"), [label]);

  // Convert incoming value (e.g., "YYYY-MM-DD" or ISO) to display format
  const toDisplay = useCallback(
    (incoming: string | null | undefined): string => {
      if (!incoming) return "";
      const digits = String(incoming).replace(/\D/g, "").slice(0, 8);
      const y = digits.slice(0, 4);
      const m = digits.slice(4, 6);
      const d = digits.slice(6, 8);
      return [y, m, d].filter(Boolean).join("/");
    },
    [],
  );

  // Keep local display in sync with external value
  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value, toDisplay]);

  // Derive a Date for the calendar from the controlled value
  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    const digits = String(value).replace(/\D/g, "").slice(0, 8);
    if (digits.length !== 8) return undefined;
    const y = Number(digits.slice(0, 4));
    const m = Number(digits.slice(4, 6));
    const d = Number(digits.slice(6, 8));
    // Use local date to avoid TZ shifting on day granularity
    return new Date(y, m - 1, d);
  }, [value]);

  // Build an overlay mask that shows a dynamic placeholder while typing.
  // Example: after typing "2025/0" -> overlay shows "2025/0_/DD".
  const overlayChars = useMemo(() => {
    const d = display ?? "";
    const digitsOnly = d.replace(/\D/g, "");
    const yearCount = Math.min(4, digitsOnly.length);
    const monthCount = Math.max(0, Math.min(2, digitsOnly.length - 4));
    const dayCount = Math.max(0, Math.min(2, digitsOnly.length - 6));

    const result: { char: string; visible: boolean }[] = [];
    // Positions: 0..3 Y, 4 '/', 5..6 M, 7 '/', 8..9 D
    for (let i = 0; i < 10; i++) {
      if (i === 4 || i === 7) {
        // Show slash when input doesn't have it yet at that index
        const hasSlashHere = d.length > i && d[i] === "/";
        result.push({ char: "/", visible: !hasSlashHere });
        continue;
      }

      if (i < 4) {
        // Year positions
        if (i < yearCount && d.length > i) {
          result.push({ char: d[i] ?? " ", visible: false });
        } else {
          result.push({ char: yearCount > 0 ? "_" : "Y", visible: true });
        }
        continue;
      }

      if (i > 4 && i < 7) {
        // Month positions (5,6)
        const monthIndex = i - 5;
        if (monthIndex < monthCount && d.length > i) {
          result.push({ char: d[i] ?? " ", visible: false });
        } else {
          result.push({ char: monthCount > 0 ? "_" : "M", visible: true });
        }
        continue;
      }

      // Day positions (8,9)
      const dayIndex = i - 8;
      if (dayIndex < dayCount && d.length > i) {
        result.push({ char: d[i] ?? " ", visible: false });
      } else {
        result.push({ char: dayCount > 0 ? "_" : "D", visible: true });
      }
    }
    return result;
  }, [display]);

  // Only show the overlay when user has started typing but not completed
  const showOverlay = display.length > 0 && display.length < 10;

  // When typing, accept only digits, format as YYYY/MM/DD, and emit
  // normalized value (YYYY-MM-DD) only when complete and valid
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digits = raw.replace(/\D/g, "").slice(0, 8);

      const y = digits.slice(0, 4);
      const m = digits.slice(4, 6);
      const d = digits.slice(6, 8);
      const nextDisplay = [y, m, d].filter(Boolean).join("/");
      setDisplay(nextDisplay);

      if (digits.length === 0) {
        // Clearing input
        onChange("");
        return;
      }

      if (digits.length === 8) {
        const year = Number(y);
        let month = Number(m);
        let day = Number(d);
        // Auto-correct zero month/day to the first valid value
        if (month === 0) month = 1;
        if (day === 0) day = 1;

        const utc = new Date(Date.UTC(year, month - 1, day));
        const isValid =
          utc.getUTCFullYear() === year &&
          utc.getUTCMonth() === month - 1 &&
          utc.getUTCDate() === day;
        if (isValid) {
          const normalized = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          // If we corrected 00 to 01, reflect it in the visible input immediately
          const correctedDisplay = `${String(year).padStart(4, "0")}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
          if (correctedDisplay !== nextDisplay) setDisplay(correctedDisplay);
          onChange(normalized);
        }
      }
    },
    [onChange],
  );

  const handleCalendarSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChange("");
        setDisplay("");
        return;
      }
      const y = String(date.getFullYear()).padStart(4, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const normalized = `${y}-${m}-${d}`;
      onChange(normalized);
      setDisplay(`${y}/${m}/${d}`);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          value={display}
          onChange={handleChange}
          placeholder={placeholder || "YYYY/MM/DD"}
          className="pr-10 font-mono"
        />

        {/* Dynamic placeholder overlay; hidden when empty to avoid doubling native placeholder */}
        {showOverlay && (
          <div
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center px-3 font-mono text-sm select-none"
          >
            <div>
              {overlayChars.map((part, idx) => (
                <span key={idx} className={part.visible ? "" : "invisible"}>
                  {part.char}
                </span>
              ))}
            </div>
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Open calendar"
              className="absolute top-1/2 right-2 -translate-y-1/2"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
