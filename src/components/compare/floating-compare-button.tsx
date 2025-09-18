"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { X, ArrowRight, Shuffle, Trash, Scale } from "lucide-react";
import { useCompare } from "~/lib/hooks/useCompare";

export function FloatingCompareButton() {
  const { items, remove, clear, href, isFull } = useCompare();

  function openCommandPalette() {
    try {
      document.dispatchEvent(new CustomEvent("sharply:open-command-palette"));
    } catch {}
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex max-w-full flex-col gap-2"
      style={
        process.env.NODE_ENV !== "production"
          ? { left: "calc(1rem + 56px)" }
          : undefined
      }
    >
      <div
        className={
          `rounded-xl ` +
          (items.length === 0
            ? ""
            : "bg-background/95 supports-[backdrop-filter]:bg-background/60 border shadow-lg backdrop-blur")
        }
      >
        <div
          className={`flex items-center gap-2 ${items.length === 0 ? "p-0" : "p-2"}`}
        >
          {items.length === 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openCommandPalette}
                icon={<Scale className="h-4 w-4" />}
              >
                <span className="sr-only">Open compare</span>
              </Button>
            </div>
          )}

          {items.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Clear button on the left, icon-only, outlined */}
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="shrink-0"
                aria-label="Clear compare"
              >
                <Trash className="size-2" />
              </Button> */}

              {items.map((it) => (
                <div
                  key={it.slug}
                  className="flex h-full items-center gap-1 rounded-lg border px-2 py-2 text-xs"
                >
                  <span className="max-w-[120px] truncate">
                    {it.name ?? it.slug}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(it.slug)}
                    className="opacity-70 hover:opacity-100"
                    aria-label={`Remove ${it.name ?? it.slug}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <div className="ml-1 flex items-center gap-2">
                <Link href={href}>
                  <Button
                    size="sm"
                    disabled={!isFull}
                    onClick={() => {
                      // Clear queue upon starting comparison
                      try {
                        clear();
                      } catch {}
                    }}
                  >
                    Compare <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
