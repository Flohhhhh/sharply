"use client";
import React from "react";
import Link from "next/link";
import type { Chart } from "@/lib/recommendations/types";

export function BrandBrowser({ charts }: { charts: Chart[] }) {
  const brands = React.useMemo(
    () => Array.from(new Set(charts.map((c) => c.brand))).sort(),
    [charts],
  );
  const [selectedBrand, setSelectedBrand] = React.useState<string | null>(null);

  const brandCharts = React.useMemo(
    () => charts.filter((c) => c.brand === selectedBrand),
    [charts, selectedBrand],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {brands.map((brand) => {
          const label = brand.slice(0, 1).toUpperCase() + brand.slice(1);
          const isActive = selectedBrand === brand;
          return (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrand(brand)}
              className={
                isActive
                  ? "bg-primary text-primary-foreground border-primary inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
                  : "bg-card hover:bg-accent inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              }
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        })}
        {selectedBrand && (
          <button
            type="button"
            onClick={() => setSelectedBrand(null)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center rounded-md px-2 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {selectedBrand ? (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            {selectedBrand.slice(0, 1).toUpperCase() + selectedBrand.slice(1)}
          </h3>
          <ul className="divide-border divide-y">
            {brandCharts.map((c) => (
              <li key={`${c.brand}/${c.slug}`} className="py-3">
                <Link
                  href={`/recommended-lenses/${c.brand}/${c.slug}`}
                  className="text-primary hover:underline"
                >
                  {c.title}
                </Link>
                <div className="text-muted-foreground text-xs">
                  Updated {new Date(c.updatedAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Choose a brand to see available charts.
        </p>
      )}
    </div>
  );
}
