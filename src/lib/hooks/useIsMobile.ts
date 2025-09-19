"use client";

import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      setIsMobile(/Android|iPhone|iPad|iPod/i.test(ua));
    }
  }, []);
  return isMobile;
}
