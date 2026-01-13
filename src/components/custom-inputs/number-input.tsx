"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "~/components/ui/label";
import type { ReactNode } from "react";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

// Input group-based layout; no absolute-positioned suffix/prefix slots needed

export interface NumberInputProps {
  id: string;
  label: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  /** @deprecated Prefix is now always inline. */
  prefixInline?: boolean;
  /** Optional leading icon, left aligned inside the control */
  icon?: ReactNode;
  tooltip?: ReactNode;
  disabled?: boolean;
}

export const NumberInput = ({
  id,
  label,
  value,
  onChange,
  step,
  min,
  max,
  className = "",
  suffix,
  prefix,
  icon,
  tooltip,
  disabled,
}: NumberInputProps) => {
  const decimalsAllowed =
    typeof step === "number" ? !Number.isInteger(step) : true;

  const [text, setText] = useState<string>(value == null ? "" : String(value));
  const [useNumberType, setUseNumberType] = useState<boolean>(false);

  const regex = useMemo(
    () => ({
      partial: decimalsAllowed ? /^\d*(?:\.\d*)?$/ : /^\d*$/,
      final: decimalsAllowed ? /^\d+(?:\.\d+)?$/ : /^\d+$/,
    }),
    [decimalsAllowed],
  );

  const lastExternalRef = useRef<string>(value == null ? "" : String(value));
  useEffect(() => {
    const external = value == null ? "" : String(value);
    const externalChanged = lastExternalRef.current !== external;
    // Only sync from external when our current text is a finalized number,
    // or when the external value actually changed and our input is empty.
    if (regex.final.test(text)) {
      if (external !== text) {
        setText(external);
      }
    } else if (externalChanged && text === "") {
      setText(external);
    }
    lastExternalRef.current = external;
  }, [value, text, regex.final]);

  // Prefer type="number" on mobile to trigger numeric keyboard
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
      setUseNumberType(isMobile);
    }
  }, []);

  const isValid = (proposed: string) => {
    if (proposed === "") return true;
    return regex.partial.test(proposed);
  };

  const grouped = Boolean(prefix || suffix);

  const commonInputProps = {
    id,
    type: useNumberType ? "number" : "text",
    inputMode: decimalsAllowed ? "decimal" : "numeric",
    pattern: decimalsAllowed ? "\\d+(?:\\.\\d*)?" : "\\d*",
    value: text,
    disabled,
    onBeforeInput: (e: React.FormEvent<HTMLInputElement>) => {
      const ne: any = (e as any).nativeEvent;
      const inputType: string | undefined = ne?.inputType;
      if (inputType?.startsWith("delete")) return;
      const data: string = ne?.data ?? "";
      const el = e.currentTarget as HTMLInputElement;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const proposed = el.value.slice(0, start) + data + el.value.slice(end);
      if (!isValid(proposed)) {
        e.preventDefault();
      }
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      if (e.ctrlKey || e.metaKey) return;
      const allowed = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "Shift",
      ];
      if (allowed.includes(key)) return;
      if (key >= "0" && key <= "9") return;
      if (key === "." || (key as any) === "Decimal") {
        if (!decimalsAllowed) {
          e.preventDefault();
          return;
        }
        const cur = (e.currentTarget as HTMLInputElement).value || "";
        if (cur.includes(".")) {
          e.preventDefault();
        }
        return;
      }
      e.preventDefault();
    },
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      const paste = e.clipboardData.getData("text");
      const el = e.currentTarget as HTMLInputElement;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const proposed = el.value.slice(0, start) + paste + el.value.slice(end);
      if (!isValid(proposed)) {
        e.preventDefault();
      }
    },
    onDrop: (e: React.DragEvent<HTMLInputElement>) => e.preventDefault(),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value.trim();
      if (!isValid(next)) return;
      setText(next);
      if (next === "") {
        onChange(null);
      } else if (regex.final.test(next)) {
        onChange(Number(next));
      }
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value.trim();
      if (raw === "") {
        onChange(null);
        setText("");
        return;
      }
      let num = Number(raw);
      if (Number.isNaN(num)) {
        e.currentTarget.value = (value ?? "").toString();
        return;
      }
      if (typeof min === "number" && num < min) num = min;
      if (typeof max === "number" && num > max) num = max;
      if (!decimalsAllowed) num = Math.trunc(num);
      onChange(num);
      setText(String(num));
    },
  } as const;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const inputClassSolo =
    "placeholder:text-muted-foreground flex-1 bg-transparent p-0 text-right outline-none focus-visible:outline-none disabled:cursor-not-allowed";
  const inputClassGrouped =
    "placeholder:text-muted-foreground bg-transparent p-0 text-left outline-none focus-visible:outline-none disabled:cursor-not-allowed w-auto";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="More info"
                className="focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-2"
              >
                <InfoIcon className="text-muted-foreground h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <div
        className={`border-input bg-background ring-offset-background focus-within:ring-ring flex h-10 w-full items-center gap-2 rounded-md border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2 ${disabled ? "opacity-50" : ""} cursor-text`}
        onMouseDown={(e) => {
          if (disabled) return;
          const target = e.target as HTMLElement;
          if (target.tagName === "INPUT") return;
          e.preventDefault();
          const el = inputRef.current;
          if (el) {
            el.focus({ preventScroll: true });
            const len = el.value.length;
            try {
              el.setSelectionRange(len, len);
            } catch {}
          }
        }}
      >
        {icon ? (
          <span className="text-muted-foreground flex h-4 w-4 shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        ) : null}
        {grouped ? (
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-baseline gap-1">
              {prefix ? (
                <span className="text-muted-foreground whitespace-nowrap">
                  {prefix}
                </span>
              ) : null}
              <input
                ref={inputRef}
                {...commonInputProps}
                className={inputClassGrouped}
                style={{ width: `${Math.max(1, (text || "").length)}ch` }}
              />
            </div>
            {suffix ? (
              <span className="text-muted-foreground whitespace-nowrap">
                {suffix}
              </span>
            ) : null}
          </div>
        ) : (
          <input
            ref={inputRef}
            {...commonInputProps}
            className={inputClassSolo}
          />
        )}
      </div>
    </div>
  );
};

export default NumberInput;
