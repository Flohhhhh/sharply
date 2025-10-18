"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type Brand = { id: string; name: string; slug: string };

export function OtherBrandsSelect({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  return (
    <div className="flex justify-center">
      <Select onValueChange={(slug) => router.push(`/browse/${slug}`)}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Other brands" />
        </SelectTrigger>
        <SelectContent>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.slug}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
