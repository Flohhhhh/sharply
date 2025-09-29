import * as React from "react";

import { cn } from "~/lib/utils";
import { Textarea } from "./textarea";

interface TextareaWithCounterProps extends React.ComponentProps<"textarea"> {
  containerClassName?: string;
  counterClassName?: string;
}

function TextareaWithCounter({
  id,
  className,
  containerClassName,
  counterClassName,
  maxLength,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaWithCounterProps) {
  const [charCount, setCharCount] = React.useState<number>(() => {
    if (typeof value === "string") return value.length;
    if (typeof defaultValue === "string") return defaultValue.length;
    return 0;
  });

  React.useEffect(() => {
    if (typeof value === "string") setCharCount(value.length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
  };

  const counterId = (id ?? "textarea") + "-char-count";

  return (
    <div className={cn("relative", containerClassName)}>
      <Textarea
        id={id}
        className={cn(
          // Ensure room for the counter when shown
          maxLength ? "pr-12 pb-6" : undefined,
          className,
        )}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        maxLength={maxLength}
        aria-describedby={maxLength ? counterId : undefined}
        {...props}
      />
      {typeof maxLength === "number" && (
        <div
          id={counterId}
          className={cn(
            "text-muted-foreground pointer-events-none absolute right-3 bottom-2 text-xs select-none",
            counterClassName,
          )}
          aria-live="polite"
        >
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
}

export { TextareaWithCounter };
