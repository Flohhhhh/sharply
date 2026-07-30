"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";
import { BrandSelect } from "~/components/custom-inputs/brand-select";
import { MountSelect } from "~/components/custom-inputs/mount-select";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { getMountById } from "~/lib/mapping/mounts-map";
import { actionUpdatePreferredFilters } from "~/server/users/actions";

type PreferredFiltersFormProps = {
  defaultBrandId: string | null;
  defaultMountId: string | null;
};

export function getNextPreferredMountId(params: {
  currentMountId: string | null;
  nextBrandId: string | null;
}) {
  const { currentMountId, nextBrandId } = params;
  if (!nextBrandId || !currentMountId) return null;

  const currentMount = getMountById(currentMountId);
  return currentMount?.brand_id === nextBrandId ? currentMountId : null;
}

export function PreferredFiltersForm({
  defaultBrandId,
  defaultMountId,
}: PreferredFiltersFormProps) {
  const t = useTranslations("profileSettings");
  const [preferredBrandId, setPreferredBrandId] = useState(defaultBrandId ?? "");
  const [preferredMountId, setPreferredMountId] = useState(defaultMountId ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasBrand = preferredBrandId.length > 0;

  const handleBrandChange = (nextBrandId: string) => {
    setPreferredBrandId(nextBrandId);
    setPreferredMountId(
      getNextPreferredMountId({
        currentMountId: preferredMountId || null,
        nextBrandId: nextBrandId || null,
      }) ?? "",
    );
    setError(null);
    setSuccess(false);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);
        setSuccess(false);

        const result = await actionUpdatePreferredFilters({
          preferredBrandId: preferredBrandId || null,
          preferredMountId: preferredBrandId ? preferredMountId || null : null,
        });

        setPreferredBrandId(result.preferredBrandId ?? "");
        setPreferredMountId(result.preferredMountId ?? "");
        setSuccess(true);
      } catch {
        setError(t("preferredFiltersUpdateFailed"));
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="preferred-brand">{t("preferredBrand")}</Label>
        <BrandSelect
          value={preferredBrandId}
          onChange={handleBrandChange}
          placeholder={t("preferredBrandPlaceholder")}
          clearLabel={t("clearPreference")}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred-mount">{t("preferredMount")}</Label>
        <MountSelect
          value={preferredMountId || null}
          onChange={(value) => {
            setPreferredMountId(
              typeof value === "string" ? value : (value[0] ?? ""),
            );
            setError(null);
            setSuccess(false);
          }}
          placeholder={t("preferredMountPlaceholder")}
          filterBrand={preferredBrandId || null}
          disabled={!hasBrand}
          allowClear
          clearLabel={t("clearPreference")}
          className="w-full"
          label={t("preferredMount")}
          showLabel={false}
        />
        <p className="text-muted-foreground text-xs">
          {hasBrand
            ? t("preferredFiltersHelp")
            : t("preferredMountDisabledHelp")}
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {success ? (
        <p className="text-green-600 dark:text-green-400 text-sm">
          {t("preferredFiltersUpdated")}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {t("saveChanges")}
      </Button>
    </form>
  );
}
