"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";

type CompareLoadingOverlayContextValue = {
  show: () => void;
  hide: () => void;
};

const CompareLoadingOverlayContext =
  createContext<CompareLoadingOverlayContextValue | null>(null);

export function CompareLoadingOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      show,
      hide,
    }),
    [show, hide],
  );

  const searchKey = searchParams?.toString() ?? "";

  useEffect(() => {
    setVisible(false);
  }, [pathname, searchKey]);

  return (
    <CompareLoadingOverlayContext.Provider value={value}>
      {children}
      {visible ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="flex flex-col items-center gap-3">
            <Loader className="size-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading comparison…</p>
          </div>
        </div>
      ) : null}
    </CompareLoadingOverlayContext.Provider>
  );
}

export function useCompareLoadingOverlay() {
  const ctx = useContext(CompareLoadingOverlayContext);
  if (!ctx) {
    throw new Error(
      "useCompareLoadingOverlay must be used within CompareLoadingOverlayProvider",
    );
  }
  return ctx;
}

