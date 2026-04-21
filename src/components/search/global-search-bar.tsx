"use client";

import { Search as SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect,useState } from "react";
import { Kbd } from "~/components/ui/kbd";
import { cn } from "~/lib/utils";
import { dispatchOpenSearchSurface } from "./search-events";

type GlobalSearchBarProps = {
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeVariants = {
  sm: {
    trigger: "h-8 rounded-lg text-sm pr-2",
    icon: "size-3",
    hint: "hidden sm:inline-flex",
  },
  md: {
    trigger: "h-11 rounded-xl text-sm pr-2",
    icon: "size-4",
    hint: "inline-flex",
  },
  lg: {
    trigger: "h-16 rounded-2xl text-base pr-4",
    icon: "size-5",
    hint: "inline-flex",
  },
} as const;

export function GlobalSearchBar({
  placeholder,
  className,
  size = "md",
}: GlobalSearchBarProps) {
  const t = useTranslations("search");
  const sizes = sizeVariants[size];
  const [isMac, setIsMac] = useState(true);
  const resolvedPlaceholder = placeholder ?? t("inputPlaceholder");

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  return (
    <button
      type="button"
      onClick={dispatchOpenSearchSurface}
      className={cn(
        "border-border bg-accent/20 cursor-text text-muted-foreground hover:text-foreground flex w-full items-center gap-3 border pl-3 pr-4 shadow-lg backdrop-blur-sm transition-[border-color,box-shadow,background-color,color]",
        "focus-visible:ring-primary/15 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-4",
        sizes.trigger,
        className,
      )}
      aria-label={t("searchAction")}
      aria-haspopup="dialog"
    >
      <SearchIcon className={cn("shrink-0", sizes.icon)} />
      <span className="min-w-0 flex-1 truncate text-left">
        {resolvedPlaceholder}
      </span>
      <span className={cn("shrink-0", sizes.hint)}>
        {isMac ? (
          <Kbd>
            <span className="mr-1 text-lg leading-none">⌘</span>
            <span className="text-sm leading-none">K</span>
          </Kbd>
        ) : (
          <Kbd>Ctrl K</Kbd>
        )}
      </span>
    </button>
  );
}
