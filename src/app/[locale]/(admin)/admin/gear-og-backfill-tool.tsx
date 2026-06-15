"use client";

import { Loader2,PauseCircle,RefreshCw,ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef,useState } from "react";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createGearOgImageFileFromSource } from "~/lib/gear/og-image";
import { actionSetGearOgImage } from "~/server/admin/gear/actions";

type GearOgBackfillCandidate = {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string;
  ogImageUrl: string | null;
};

type GearOgBackfillResponse = {
  eligibleCount: number;
  includeExisting: boolean;
  items: GearOgBackfillCandidate[];
  limit: number;
  returnedCount: number;
};

type RunStats = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parseLimit(rawValue: string) {
  const parsed = Number.parseInt(rawValue.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

export function GearOgBackfillTool() {
  const t = useTranslations("adminTools.gearOgBackfill");
  const [limitValue, setLimitValue] = useState(String(DEFAULT_LIMIT));
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [returnedCount, setReturnedCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [stats, setStats] = useState<RunStats>({
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  });
  const stopRequestedRef = useRef(false);
  const [stopRequested, setStopRequested] = useState(false);
  const { uploadFiles } = genUploader<OurFileRouter>();

  const selectedLimit = parseLimit(limitValue);

  async function uploadGearImageFile(file: File) {
    const res = await uploadFiles("gearImageUploader", {
      files: [file],
    });
    const uploads = Array.isArray(res) ? res : [];
    const upload = uploads[0];
    const url = upload?.serverData?.fileUrl ?? upload?.url ?? "";
    if (!url) {
      throw new Error(t("errors.uploadFailed"));
    }

    return url;
  }

  async function fetchCandidates(includeExisting: boolean) {
    const searchParams = new URLSearchParams({
      limit: String(selectedLimit),
      mode: includeExisting ? "all" : "missing",
    });
    const response = await fetch(`/api/admin/gear/og-backfill?${searchParams.toString()}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as GearOgBackfillResponse & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? t("errors.scanFailed"));
    }

    setEligibleCount(payload.eligibleCount);
    setReturnedCount(payload.returnedCount);
    return payload;
  }

  async function handleScan(includeExisting: boolean) {
    try {
      setIsScanning(true);
      setLastError(null);
      await fetchCandidates(includeExisting);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : t("errors.scanFailed"));
    } finally {
      setIsScanning(false);
    }
  }

  async function handleRun(includeExisting: boolean) {
    try {
      setIsRunning(true);
      setLastError(null);
      setCurrentSlug(null);
      stopRequestedRef.current = false;
      setStopRequested(false);
      setStats({
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      });

      const payload = await fetchCandidates(includeExisting);
      const nextStats: RunStats = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      };

      for (const item of payload.items) {
        setCurrentSlug(item.slug);

        if (!item.thumbnailUrl) {
          nextStats.processed += 1;
          nextStats.skipped += 1;
          setStats({ ...nextStats });
          if (stopRequestedRef.current) break;
          continue;
        }

        try {
          const ogImageFile = await createGearOgImageFileFromSource({
            source: item.thumbnailUrl,
            fileNameStem: `${item.slug}-og`,
          });
          const ogImageUrl = await uploadGearImageFile(ogImageFile);
          await actionSetGearOgImage({
            gearId: item.id,
            ogImageUrl,
          });
          nextStats.succeeded += 1;
        } catch (error) {
          nextStats.failed += 1;
          setLastError(
            error instanceof Error ? error.message : t("errors.generateFailed"),
          );
        }

        nextStats.processed += 1;
        setStats({ ...nextStats });

        if (stopRequestedRef.current) break;
      }
    } catch (error) {
      setLastError(
        error instanceof Error ? error.message : t("errors.generateFailed"),
      );
    } finally {
      setCurrentSlug(null);
      setIsRunning(false);
      setStopRequested(false);
      stopRequestedRef.current = false;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:max-w-xs">
          <Label htmlFor="gear-og-backfill-limit">{t("limitLabel")}</Label>
          <Input
            id="gear-og-backfill-limit"
            type="number"
            min={1}
            max={MAX_LIMIT}
            step={1}
            value={limitValue}
            onChange={(event) => setLimitValue(event.target.value)}
            disabled={isRunning}
          />
          <p className="text-muted-foreground text-xs">
            {t("limitHint", { defaultValue: String(DEFAULT_LIMIT), max: String(MAX_LIMIT) })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            icon={
              isScanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ScanSearch className="size-4" />
              )
            }
            disabled={isScanning || isRunning}
            onClick={() => void handleScan(false)}
          >
            {t("scanMissing")}
          </Button>
          <Button
            type="button"
            icon={
              isRunning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )
            }
            disabled={isScanning || isRunning}
            onClick={() => void handleRun(false)}
          >
            {t("generateMissing")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isScanning || isRunning}
            onClick={() => void handleRun(true)}
          >
            {t("regenerateExisting")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            icon={<PauseCircle className="size-4" />}
            disabled={!isRunning || stopRequested}
            onClick={() => {
              stopRequestedRef.current = true;
              setStopRequested(true);
            }}
          >
            {stopRequested ? t("stopRequested") : t("stopAfterCurrent")}
          </Button>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <span className="font-medium">{t("stats.eligible")}:</span>{" "}
            {eligibleCount ?? "—"}
          </div>
          <div>
            <span className="font-medium">{t("stats.limit")}:</span> {selectedLimit}
          </div>
          <div>
            <span className="font-medium">{t("stats.loaded")}:</span> {returnedCount}
          </div>
          <div>
            <span className="font-medium">{t("stats.processed")}:</span>{" "}
            {stats.processed}
          </div>
          <div>
            <span className="font-medium">{t("stats.succeeded")}:</span>{" "}
            {stats.succeeded}
          </div>
          <div>
            <span className="font-medium">{t("stats.failed")}:</span> {stats.failed}
          </div>
          <div>
            <span className="font-medium">{t("stats.skipped")}:</span> {stats.skipped}
          </div>
          <div className="sm:col-span-2">
            <span className="font-medium">{t("stats.current")}:</span>{" "}
            {currentSlug ?? t("idle")}
          </div>
        </div>

        {lastError ? (
          <p className="text-sm text-red-600">{lastError}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
