"use client";

import { useTranslations } from "next-intl";
import { useEffect,useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { SEARCH_OPEN_EVENT } from "./search-events";
import { SearchModalScene } from "./search-modal-scene";

export function CommandPalette() {
  const t = useTranslations("search");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener(SEARCH_OPEN_EVENT, handler);
    return () => document.removeEventListener(SEARCH_OPEN_EVENT, handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        disableAnimation
        className="top-[calc(env(safe-area-inset-top)+0.75rem)] max-w-[min(44rem,calc(100%-1.5rem))] translate-y-0 gap-0 overflow-visible border-none bg-transparent p-0 shadow-none duration-100 sm:top-[27vh] sm:max-w-[44rem]"
      >
        <DialogTitle className="sr-only">{t("dialogTitle")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("dialogDescription")}
        </DialogDescription>
        <SearchModalScene open={open} onOpenChange={setOpen} />
      </DialogContent>
    </Dialog>
  );
}
