"use client";

import { Loader2, PauseCircle, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { LensOpticsBackfillProposal } from "~/lib/admin/lens-optics-backfill";
import { actionApplyLensOpticsBackfill } from "~/server/admin/gear/actions";

type OpticsBackfillCandidate = {
  id: string;
  slug: string;
  name: string;
  publicationState: string;
  proposal: LensOpticsBackfillProposal;
};

type OpticsBackfillResponse = {
  eligibleCount: number;
  actionableCount: number;
  skippedCount: number;
  items: OpticsBackfillCandidate[];
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
const MIN_LIMIT = 25;
const MAX_LIMIT = 50;

function parseLimit(rawValue: string) {
  const parsed = Number.parseInt(rawValue.trim(), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parsed));
}

function formatFocal(min: number | null, max: number | null) {
  if (min == null && max == null) return "—";
  if (min != null && max != null && min !== max) return `${min}-${max}mm`;
  return `${min ?? max}mm`;
}

function formatAperture(wide: number | null, tele: number | null) {
  if (wide == null) return "—";
  if (tele != null && tele !== wide) return `f/${wide}-${tele}`;
  return `f/${wide}`;
}

function formatPrime(isPrime: boolean | null) {
  if (isPrime == null) return "—";
  return isPrime ? "prime" : "zoom";
}

function formatProposedSummary(proposal: LensOpticsBackfillProposal) {
  const parts: string[] = [];
  if (proposal.fills.includes("focalLength")) {
    parts.push(
      formatFocal(
        proposal.after.focalLengthMinMm,
        proposal.after.focalLengthMaxMm,
      ),
    );
  }
  if (proposal.fills.includes("isPrime")) {
    parts.push(formatPrime(proposal.after.isPrime));
  }
  if (
    proposal.fills.includes("maxApertureWide") ||
    proposal.fills.includes("maxApertureTele")
  ) {
    parts.push(
      formatAperture(
        proposal.after.maxApertureWide,
        proposal.after.maxApertureTele,
      ),
    );
  }
  return parts.join(" · ") || "—";
}

function formatCurrentSummary(proposal: LensOpticsBackfillProposal) {
  return [
    formatFocal(
      proposal.current.focalLengthMinMm,
      proposal.current.focalLengthMaxMm,
    ),
    formatPrime(proposal.current.isPrime),
    formatAperture(
      proposal.current.maxApertureWide,
      proposal.current.maxApertureTele,
    ),
  ].join(" · ");
}

export function GearOpticsBackfillTool() {
  const t = useTranslations("adminTools.gearOpticsBackfill");
  const [limitValue, setLimitValue] = useState(String(DEFAULT_LIMIT));
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [actionableCount, setActionableCount] = useState(0);
  const [skippedOnScan, setSkippedOnScan] = useState(0);
  const [items, setItems] = useState<OpticsBackfillCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const selectedLimit = parseLimit(limitValue);
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  async function fetchCandidates() {
    const searchParams = new URLSearchParams({
      limit: String(selectedLimit),
    });
    const response = await fetch(
      `/api/admin/gear/optics-backfill?${searchParams.toString()}`,
      { cache: "no-store" },
    );
    const payload = (await response.json()) as OpticsBackfillResponse & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? t("errors.scanFailed"));
    }

    setEligibleCount(payload.eligibleCount);
    setActionableCount(payload.actionableCount);
    setSkippedOnScan(payload.skippedCount);
    setItems(payload.items);
    setSelectedIds(new Set(payload.items.map((item) => item.id)));
    return payload;
  }

  async function handleScan() {
    try {
      setIsScanning(true);
      setLastError(null);
      setStats({ processed: 0, succeeded: 0, failed: 0, skipped: 0 });
      await fetchCandidates();
    } catch (error) {
      setLastError(
        error instanceof Error ? error.message : t("errors.scanFailed"),
      );
    } finally {
      setIsScanning(false);
    }
  }

  async function applyGearIds(gearIds: string[]) {
    try {
      setIsRunning(true);
      setLastError(null);
      setCurrentSlug(null);
      stopRequestedRef.current = false;
      setStopRequested(false);
      const nextStats: RunStats = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      };
      setStats({ ...nextStats });

      const remaining = [...items];

      for (const gearId of gearIds) {
        const item = items.find((candidate) => candidate.id === gearId);
        setCurrentSlug(item?.slug ?? gearId);

        if (stopRequestedRef.current) {
          nextStats.skipped += gearIds.length - nextStats.processed;
          setStats({ ...nextStats });
          break;
        }

        try {
          await actionApplyLensOpticsBackfill({ gearId });
          nextStats.succeeded += 1;
          const index = remaining.findIndex((row) => row.id === gearId);
          if (index >= 0) remaining.splice(index, 1);
        } catch (error) {
          nextStats.failed += 1;
          setLastError(
            error instanceof Error ? error.message : t("errors.applyFailed"),
          );
        }

        nextStats.processed += 1;
        setStats({ ...nextStats });
      }

      setItems(remaining);
      setSelectedIds(new Set(remaining.map((item) => item.id)));
      setActionableCount(remaining.length);
    } catch (error) {
      setLastError(
        error instanceof Error ? error.message : t("errors.applyFailed"),
      );
    } finally {
      setCurrentSlug(null);
      setIsRunning(false);
      setStopRequested(false);
      stopRequestedRef.current = false;
    }
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(items.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function toggleOne(gearId: string, checked: boolean) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(gearId);
      else next.delete(gearId);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:max-w-xs">
          <Label htmlFor="gear-optics-backfill-limit">{t("limitLabel")}</Label>
          <Input
            id="gear-optics-backfill-limit"
            type="number"
            min={MIN_LIMIT}
            max={MAX_LIMIT}
            step={1}
            value={limitValue}
            onChange={(event) => setLimitValue(event.target.value)}
            disabled={isRunning}
          />
          <p className="text-muted-foreground text-xs">
            {t("limitHint", {
              min: String(MIN_LIMIT),
              max: String(MAX_LIMIT),
            })}
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
            onClick={() => void handleScan()}
          >
            {t("scan")}
          </Button>
          <Button
            type="button"
            disabled={
              isScanning || isRunning || selectedIds.size === 0 || items.length === 0
            }
            onClick={() => void applyGearIds([...selectedIds])}
          >
            {t("applySelected")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isScanning || isRunning || items.length === 0}
            onClick={() => void applyGearIds(items.map((item) => item.id))}
          >
            {t("applyAll")}
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
            <span className="font-medium">{t("stats.actionable")}:</span>{" "}
            {actionableCount}
          </div>
          <div>
            <span className="font-medium">{t("stats.skippedScan")}:</span>{" "}
            {skippedOnScan}
          </div>
          <div>
            <span className="font-medium">{t("stats.limit")}:</span>{" "}
            {selectedLimit}
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
            <span className="font-medium">{t("stats.failed")}:</span>{" "}
            {stats.failed}
          </div>
          <div>
            <span className="font-medium">{t("stats.skipped")}:</span>{" "}
            {stats.skipped}
          </div>
          <div className="sm:col-span-2">
            <span className="font-medium">{t("stats.current")}:</span>{" "}
            {currentSlug ?? t("idle")}
          </div>
        </div>

        {lastError ? (
          <p className="text-sm text-red-600">{lastError}</p>
        ) : null}

        {items.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(value) => toggleAll(value === true)}
                      disabled={isRunning}
                      aria-label={t("selectAll")}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t("columns.name")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t("columns.missing")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t("columns.current")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t("columns.proposed")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t("columns.fills")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b align-top">
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={(value) =>
                          toggleOne(item.id, value === true)
                        }
                        disabled={isRunning}
                        aria-label={item.name}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/gear/${item.slug}`}
                        className="hover:underline"
                        target="_blank"
                      >
                        {item.name}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        {item.publicationState}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {item.proposal.missing.join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {formatCurrentSummary(item.proposal)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {formatProposedSummary(item.proposal)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {item.proposal.fills.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        )}
      </CardContent>
    </Card>
  );
}
