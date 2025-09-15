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
  tooltip?: ReactNode;
  disabled?: boolean;
}

export const NumberInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
  className = "",
  suffix,
  prefix,
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
      <div className="relative">
        <input
          id={id}
          type={useNumberType ? "number" : "text"}
          inputMode={decimalsAllowed ? "decimal" : "numeric"}
          pattern={decimalsAllowed ? "\\d+(?:\\.\\d*)?" : "\\d*"}
          value={text}
          disabled={disabled}
          style={{
            ...(prefix ? { paddingLeft: "2.75rem" } : {}),
            ...(suffix ? { paddingRight: "2.25rem" } : {}),
          }}
          placeholder={placeholder}
          onBeforeInput={(e) => {
            const ne: any = e.nativeEvent as any;
            const inputType: string | undefined = ne?.inputType;
            if (inputType?.startsWith("delete")) return;
            const data: string = ne?.data ?? "";
            if (!/^[0-9.]$/.test(data)) {
              e.preventDefault();
              return;
            }
            const el = e.currentTarget as HTMLInputElement;
            const start = el.selectionStart ?? el.value.length;
            const end = el.selectionEnd ?? start;
            const proposed =
              el.value.slice(0, start) + data + el.value.slice(end);
            if (!isValid(proposed)) {
              e.preventDefault();
            }
          }}
          onKeyDown={(e) => {
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
            if (key === "." || key === "Decimal") {
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
          }}
          onPaste={(e) => {
            const paste = e.clipboardData.getData("text");
            const el = e.currentTarget as HTMLInputElement;
            const start = el.selectionStart ?? el.value.length;
            const end = el.selectionEnd ?? start;
            const proposed =
              el.value.slice(0, start) + paste + el.value.slice(end);
            if (!isValid(proposed)) {
              e.preventDefault();
            }
          }}
          onDrop={(e) => e.preventDefault()}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (!isValid(next)) return;
            setText(next);
            if (next === "") {
              onChange(null);
            } else if (regex.final.test(next)) {
              onChange(Number(next));
            }
          }}
          onBlur={(e) => {
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
          }}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        {prefix ? (
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm">
            {prefix}
          </div>
        ) : null}
        {suffix ? (
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm">
            {suffix}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default NumberInput;
