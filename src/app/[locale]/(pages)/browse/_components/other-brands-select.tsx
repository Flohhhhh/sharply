"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { splitBrandsWithPriority } from "~/lib/brands";

type Brand = { id: string; name: string; slug: string };

export function OtherBrandsSelect({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const { hoisted, remaining } = useMemo(
    () => splitBrandsWithPriority(brands),
    [brands],
  );
  const showDivider = hoisted.length > 0 && remaining.length > 0;

  return (
    <div className="flex w-full justify-center sm:w-fit">
      <Select onValueChange={(slug) => router.push(`/browse/${slug}`)}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Other brands" />
        </SelectTrigger>
        <SelectContent>
          {hoisted.map((brand) => (
            <SelectItem key={brand.id} value={brand.slug}>
              {brand.name}
            </SelectItem>
          ))}
          {showDivider ? <SelectSeparator /> : null}
          {remaining.map((brand) => (
            <SelectItem key={brand.id} value={brand.slug}>
              {brand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
