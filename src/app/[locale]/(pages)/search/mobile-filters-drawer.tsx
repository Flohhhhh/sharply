"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { FiltersSidebar } from "./filters-sidebar";

export function MobileFiltersDrawer() {
  const t = useTranslations("search");

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<SlidersHorizontal className="size-4" />}
        >
          {t("filters")}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{t("filters")}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("filters")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <FiltersSidebar
            variant="drawer"
            idPrefix="mobile-"
            showTitle={false}
          />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button">{t("close")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
