"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";

type Granularity = "day" | "month" | "year";

interface DateInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  granularity?: Granularity; // default: "day". Controls typing/display behavior only
}

export function DateInput({
  label,
  value,
  onChange,
  placeholder,
  granularity = "day",
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
      if (granularity === "year") return [y].filter(Boolean).join("");
      if (granularity === "month") return [y, m].filter(Boolean).join("/");
      return [y, m, d].filter(Boolean).join("/");
    },
    [granularity],
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
  // Example: after typing "2025/0" in day mode -> overlay shows "2025/0_/DD".
  const overlayChars = useMemo(() => {
    const d = display ?? "";
    const digitsOnly = d.replace(/\D/g, "");
    const isMonth = granularity === "month";
    const isYear = granularity === "year";

    const yearCount = Math.min(4, digitsOnly.length);
    const monthCount = isYear
      ? 0
      : Math.max(0, Math.min(2, digitsOnly.length - 4));
    const dayCount =
      isYear || isMonth ? 0 : Math.max(0, Math.min(2, digitsOnly.length - 6));

    const result: { char: string; visible: boolean }[] = [];

    // Construct pattern per granularity
    const pattern = isYear ? "YYYY" : isMonth ? "YYYY/MM" : "YYYY/MM/DD";

    for (let i = 0, yIdx = 0, mIdx = 0, dIdx = 0; i < pattern.length; i++) {
      const ch = pattern[i];
      if (ch === "/") {
        const hasSlashHere = d.length > i && d[i] === "/";
        result.push({ char: "/", visible: !hasSlashHere });
        continue;
      }
      if (ch === "Y") {
        if (yIdx < yearCount && d.length > i) {
          result.push({ char: d[i] ?? " ", visible: false });
        } else {
          result.push({ char: yearCount > 0 ? "_" : "Y", visible: true });
        }
        yIdx++;
        continue;
      }
      if (ch === "M") {
        if (mIdx < monthCount && d.length > i) {
          result.push({ char: d[i] ?? " ", visible: false });
        } else {
          result.push({ char: monthCount > 0 ? "_" : "M", visible: true });
        }
        mIdx++;
        continue;
      }
      // ch === 'D'
      if (dIdx < dayCount && d.length > i) {
        result.push({ char: d[i] ?? " ", visible: false });
      } else {
        result.push({ char: dayCount > 0 ? "_" : "D", visible: true });
      }
      dIdx++;
    }
    return result;
  }, [display, granularity]);

  // Only show the overlay when user has started typing but not completed
  const overlayLength =
    granularity === "year" ? 4 : granularity === "month" ? 7 : 10;
  const showOverlay = display.length > 0 && display.length < overlayLength;

  // When typing, accept only digits, format per granularity, and emit
  // normalized value (YYYY-MM-DD) only when complete and valid
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digits = raw.replace(/\D/g, "").slice(0, 8);

      const y = digits.slice(0, 4);
      const m = digits.slice(4, 6);
      const d = digits.slice(6, 8);
      const nextDisplay =
        granularity === "year"
          ? [y].filter(Boolean).join("")
          : granularity === "month"
            ? [y, m].filter(Boolean).join("/")
            : [y, m, d].filter(Boolean).join("/");
      setDisplay(nextDisplay);

      if (digits.length === 0) {
        // Clearing input
        onChange("");
        return;
      }

      const needed =
        granularity === "year" ? 4 : granularity === "month" ? 6 : 8;
      if (digits.length >= needed) {
        const year = Number(y);
        let month = Number(m);
        let day = Number(d);
        // Auto-correct zero month/day to the first valid value
        if (month === 0) month = 1;
        if (day === 0) day = 1;
        // Clamp based on granularity
        if (granularity === "year") {
          month = 1;
          day = 1;
        } else if (granularity === "month") {
          day = 1;
        }

        const utc = new Date(Date.UTC(year, month - 1, day));
        const isValid =
          utc.getUTCFullYear() === year &&
          utc.getUTCMonth() === month - 1 &&
          utc.getUTCDate() === day;
        if (isValid) {
          const normalized = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          // If we corrected values or clamped for granularity, reflect it
          const correctedDisplay =
            granularity === "year"
              ? `${String(year).padStart(4, "0")}`
              : granularity === "month"
                ? `${String(year).padStart(4, "0")}/${String(month).padStart(2, "0")}`
                : `${String(year).padStart(4, "0")}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
          if (correctedDisplay !== nextDisplay) setDisplay(correctedDisplay);
          onChange(normalized);
        }
      }
    },
    [onChange, granularity],
  );

  const handleCalendarSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChange("");
        setDisplay("");
        return;
      }
      const year = date.getFullYear();
      const month = granularity === "year" ? 1 : date.getMonth() + 1;
      const day = granularity === "day" ? date.getDate() : 1;
      const y = String(year).padStart(4, "0");
      const m = String(month).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const normalized = `${y}-${m}-${d}`;
      onChange(normalized);
      const nextDisplay =
        granularity === "year"
          ? y
          : granularity === "month"
            ? `${y}/${m}`
            : `${y}/${m}/${d}`;
      setDisplay(nextDisplay);
      setOpen(false);
    },
    [onChange, granularity],
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
          placeholder={
            placeholder ||
            (granularity === "year"
              ? "YYYY"
              : granularity === "month"
                ? "YYYY/MM"
                : "YYYY/MM/DD")
          }
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
            {granularity === "day" && (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
              />
            )}
            {granularity === "month" && (
              <MonthPickerContent
                selected={selectedDate}
                onPick={(y, m) => handleCalendarSelect(new Date(y, m - 1, 1))}
              />
            )}
            {granularity === "year" && (
              <YearPickerContent
                selected={selectedDate}
                onPick={(y) => handleCalendarSelect(new Date(y, 0, 1))}
              />
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function MonthPickerContent({
  selected,
  onPick,
}: {
  selected?: Date;
  onPick: (year: number, month: number) => void; // month 1-12
}) {
  const initialYear = selected?.getFullYear() ?? new Date().getFullYear();
  const [year, setYear] = useState<number>(initialYear);
  const selectedMonth = selected ? selected.getMonth() + 1 : null;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="w-[260px] p-2">
      <div className="flex items-center justify-between px-1 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setYear((y) => y - 1)}
          aria-label="Previous year"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">{year}</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setYear((y) => y + 1)}
          aria-label="Next year"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1">
        {months.map((label, idx) => {
          const m = idx + 1;
          const isSelected =
            selectedMonth === m && (selected?.getFullYear() ?? 0) === year;
          return (
            <Button
              key={m}
              type="button"
              variant={isSelected ? "secondary" : "ghost"}
              className="h-8"
              onClick={() => onPick(year, m)}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function YearPickerContent({
  selected,
  onPick,
}: {
  selected?: Date;
  onPick: (year: number) => void;
}) {
  const currentYear = selected?.getFullYear() ?? new Date().getFullYear();
  const pageBase = Math.floor(currentYear / 20) * 20;
  const [startYear, setStartYear] = useState<number>(pageBase);

  const years = Array.from({ length: 20 }, (_, i) => startYear + i);
  const selYear = selected?.getFullYear() ?? null;

  return (
    <div className="w-[260px] p-2">
      <div className="flex items-center justify-between px-1 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStartYear((y) => y - 20)}
          aria-label="Previous 20 years"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {startYear}–{startYear + 19}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStartYear((y) => y + 20)}
          aria-label="Next 20 years"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-1 p-1">
        {years.map((y) => (
          <Button
            key={y}
            type="button"
            variant={selYear === y ? "secondary" : "ghost"}
            className="h-8"
            onClick={() => onPick(y)}
          >
            {y}
          </Button>
        ))}
      </div>
    </div>
  );
}
