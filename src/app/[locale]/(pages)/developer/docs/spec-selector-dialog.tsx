"use client";

import { ListTree } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

type SpecCategory = {
  id: string;
  label: string;
  fields: Array<{
    id: string;
    label: string;
    searchTerms: string[];
  }>;
};

export function SpecSelectorDialog({
  categories,
}: {
  categories: SpecCategory[];
}) {
  const t = useTranslations("developerApi.docs");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="mt-6">
          <ListTree data-icon="inline-start" />
          {t("specDictionaryTitle")}
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[min(42rem,calc(100dvh-2rem))] sm:max-w-3xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{t("specDictionaryTitle")}</DialogTitle>
          <DialogDescription>
            {t("specDictionaryDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-8">
            {categories.map((category) => (
              <section key={category.id}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <code className="text-primary font-mono text-sm font-medium">
                    {category.id}
                  </code>
                  <span className="text-muted-foreground text-sm">
                    {category.label}
                  </span>
                </div>
                <ul
                  className="mt-3 flex flex-col gap-2"
                  aria-label={category.label}
                >
                  {category.fields.map((field) => (
                    <li
                      key={field.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                    >
                      <code className="font-mono text-sm font-medium break-all">
                        {field.id}
                      </code>
                      <span className="text-muted-foreground text-sm">
                        {field.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
