"use client";

import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "./routing";

export function useLocalePathnames() {
  const rawPathname = usePathname() || "/";

  return {
    rawPathname,
    pathname: stripLocalePrefix(rawPathname).pathname,
  };
}
