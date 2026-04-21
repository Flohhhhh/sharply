"use client";

import { Check,X } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import useSWR from "swr";
import { VideoSpecsSummary } from "~/app/[locale]/(pages)/gear/_components/video/video-summary";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card,CardContent } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Label } from "~/components/ui/label";
import { RadioGroup,RadioGroupItem } from "~/components/ui/radio-group";
import { formatDate } from "~/lib/format/date";
import {
  formatCardSlotDetails,
  formatPrecaptureSupport,
  formatPrice,
} from "~/lib/mapping";
import { formatMaxFpsPlain } from "~/lib/mapping/max-fps-map";
import { getMountLongNameById } from "~/lib/mapping/mounts-map";
import { sensorNameFromId,sensorNameFromSlug } from "~/lib/mapping/sensor-map";
import { humanizeKey } from "~/lib/utils";
import {
  normalizedToCameraVideoModes,
  type VideoModeNormalized,
} from "~/lib/video/mode-schema";
import { buildVideoDisplayBundle } from "~/lib/video/transform";
import {
  buildMergedPayloadForGroup,
  computeConflictsForGroup,
  computeNonConflictsForGroup,
  flattenProposalGroups,
  groupGearProposals,
  type GearProposal,
  type NonConflictEntry,
  type ProposalGroup,
  type ProposalGroupDto,
} from "./gear-proposals-list.helpers";

type PendingResponse = { groups: ProposalGroupDto[] };
type ResolvedResponse = {
  groups: ProposalGroupDto[];
  count?: number;
  days?: number;
};

export function GearProposalsList() {
  const locale = useLocale();
  const [proposals, setProposals] = useState<GearProposal[]>([]);
  const formatDisplayDate = (value: unknown) =>
    formatDate(value as string | Date | number | null | undefined, {
      locale,
      preset: "date-long",
    });

  const getVideoBundle = (modes?: VideoModeNormalized[] | null) => {
    if (!Array.isArray(modes) || modes.length === 0) return null;
    try {
      return buildVideoDisplayBundle(normalizedToCameraVideoModes(modes));
    } catch {
      return null;
    }
  };
  // Group-level selection state for conflict resolution radios
  const [selectedByGroup, setSelectedByGroup] = useState<
    Record<string, Record<string, string | null>>
  >({});
  const [includedByGroup, setIncludedByGroup] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [loadingByGearId, setLoadingByGearId] = useState<
    Record<string, "approve" | "reject" | null>
  >({});
  const [resolvedLoaded, setResolvedLoaded] = useState(false);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [resolvedEnabled, setResolvedEnabled] = useState(false);

  const {
    data: pendingData,
    error: pendingError,
    isLoading: pendingLoading,
    mutate: mutatePending,
  } = useSWR<PendingResponse>(
    "/api/admin/proposals/pending",
    async (url: string): Promise<PendingResponse> => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return (await res.json()) as PendingResponse;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const {
    data: resolvedData,
    error: resolvedErrorObj,
    isLoading: resolvedLoading,
    mutate: mutateResolved,
  } = useSWR<ResolvedResponse>(
    resolvedEnabled ? "/api/admin/proposals/resolved?days=7&limit=20" : null,
    async (url: string): Promise<ResolvedResponse> => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return (await res.json()) as ResolvedResponse;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );

  const pendingErrorMessage =
    pendingError && pendingError instanceof Error
      ? pendingError.message
      : pendingError
        ? "Failed to load pending proposals"
        : null;

  const resolvedError =
    resolvedErrorObj && resolvedErrorObj instanceof Error
      ? resolvedErrorObj.message
      : resolvedErrorObj
        ? "Failed to load resolved proposals"
        : null;

  useEffect(() => {
    if (!pendingData?.groups) return;
    const pendingFlat = flattenProposalGroups(pendingData.groups).filter(
      (p) => p.status === "PENDING",
    );
    setProposals((prev) => {
      const resolved = prev.filter((p) => p.status !== "PENDING");
      return [...pendingFlat, ...resolved];
    });
  }, [pendingData]);

  useEffect(() => {
    if (!resolvedData?.groups) return;
    const resolvedFlat = flattenProposalGroups(resolvedData.groups).filter(
      (p) => p.status !== "PENDING",
    );
    setResolvedCount(resolvedData.count ?? resolvedFlat.length);
    setProposals((prev) => {
      const pendingOnly = prev.filter((p) => p.status === "PENDING");
      const next = [...pendingOnly];
      const seen = new Map(next.map((p) => [p.id, p]));
      for (const res of resolvedFlat) {
        if (seen.has(res.id)) {
          const idx = next.findIndex((p) => p.id === res.id);
          if (idx >= 0) next[idx] = res;
        } else {
          next.push(res);
        }
      }
      return next;
    });
    setResolvedLoaded(true);
  }, [resolvedData]);

  // Initialize field selections (all selected by default) when proposals load
  // Build groups from initialProposals (for pending UI)
  const groups: ProposalGroup[] = useMemo(
    () => groupGearProposals(proposals),
    [proposals],
  );

  const formatValueForKey = (k: string, v: any): string => {
    const isEmpty = v === null || v === undefined || v === "";
    if (isEmpty) return "Empty";
    if (
      k === "msrpUsdCents" ||
      k === "msrpNowUsdCents" ||
      k === "msrpAtLaunchUsdCents"
    )
      return formatPrice(v as number);
    if (k === "releaseDate") return formatDisplayDate(v);
    if (k === "sensorFormatId") return sensorNameFromSlug(v as string);
    if (k === "mountId") return getMountLongNameById(v as string);
    if (k === "mountIds") {
      return Array.isArray(v)
        ? v.map((id) => getMountLongNameById(id as string)).join(", ")
        : getMountLongNameById(v as string);
    }
    if (k === "precaptureSupportLevel") {
      return formatPrecaptureSupport(v) ?? String(v);
    }
    if (k === "maxFpsByShutter") return formatMaxFpsPlain(v);
    return String(v);
  };
  const formatBeforeValueForKey = (k: string, v: any): string => {
    if (
      k === "msrpUsdCents" ||
      k === "msrpNowUsdCents" ||
      k === "msrpAtLaunchUsdCents"
    )
      return formatPrice(v as number);
    if (k === "releaseDate") return formatDisplayDate(v);
    if (k === "sensorFormatId") return sensorNameFromId(v as string);
    if (k === "mountId") return getMountLongNameById(v as string);
    if (k === "mountIds") {
      return Array.isArray(v)
        ? v.map((id) => getMountLongNameById(id as string)).join(", ")
        : getMountLongNameById(v as string);
    }
    if (k === "precaptureSupportLevel") {
      return formatPrecaptureSupport(v) ?? String(v ?? "Empty");
    }
    if (k === "maxFpsByShutter") return formatMaxFpsPlain(v);
    return String(v ?? "Empty");
  };

  // Ensure conflict selections initialized to null (no default)
  useEffect(() => {
    const next: Record<string, Record<string, string | null>> = {
      ...selectedByGroup,
    };
    const nextIncluded: Record<string, Record<string, boolean>> = {
      ...includedByGroup,
    };
    for (const g of groups) {
      const conflicts = computeConflictsForGroup(g);
      if (!next[g.gearId]) next[g.gearId] = {};
      const groupSel = next[g.gearId]!;
      for (const c of conflicts) {
        if (!(c.fieldKey in groupSel)) groupSel[c.fieldKey] = null;
      }
      // initialize non-conflicts as included by default
      const nonConflicts = computeNonConflictsForGroup(g);
      if (!nextIncluded[g.gearId]) nextIncluded[g.gearId] = {};
      const groupInc = nextIncluded[g.gearId]!;
      for (const n of nonConflicts) {
        if (!(n.fieldKey in groupInc)) groupInc[n.fieldKey] = true;
      }
    }
    setSelectedByGroup(next);
    setIncludedByGroup(nextIncluded);
  }, [groups]);

  const handleApproveGroup = async (group: ProposalGroup) => {
    try {
      setLoadingByGearId((prev) => ({ ...prev, [group.gearId]: "approve" }));
      const mergedPayload = buildMergedPayloadForGroup(
        group,
        selectedByGroup[group.gearId] || {},
        includedByGroup[group.gearId] || {},
      );
      // Choose an anchor proposal to approve (latest pending)
      const anchor = [...group.proposals]
        .filter((p) => p.status === "PENDING")
        .sort(
          (a, b) =>
            new Date(b.createdAt as any).getTime() -
            new Date(a.createdAt as any).getTime(),
        )[0];
      if (!anchor) return;
      const { actionApproveProposal } =
        await import("~/server/admin/proposals/actions");
      await actionApproveProposal(anchor.id, mergedPayload, {
        gearName: group.gearName ?? "Gear",
        gearSlug: group.gearSlug ?? group.gearId ?? "",
      });

      // Optimistically move all group's proposals to resolved locally
      setProposals((prev) =>
        prev.map((p) =>
          p.gearId === group.gearId && p.status === "PENDING"
            ? { ...p, status: "APPROVED" }
            : p,
        ),
      );
      void mutatePending();
    } catch (e) {
      console.error("Failed to approve group:", e);
    } finally {
      setLoadingByGearId((prev) => ({ ...prev, [group.gearId]: null }));
    }
  };

  const handleRejectGroup = async (group: ProposalGroup) => {
    const pendingProposals = getPendingProposals(group);
    if (pendingProposals.length === 0) return;

    try {
      setLoadingByGearId((prev) => ({ ...prev, [group.gearId]: "reject" }));
      const { actionRejectProposal } =
        await import("~/server/admin/proposals/actions");
      await Promise.all(
        pendingProposals.map((proposal) => actionRejectProposal(proposal.id)),
      );
      setProposals((prev) =>
        prev.map((proposal) =>
          proposal.gearId === group.gearId && proposal.status === "PENDING"
            ? { ...proposal, status: "REJECTED" }
            : proposal,
        ),
      );
      void mutatePending();
      if (resolvedLoaded) void mutateResolved();
    } catch (error) {
      console.error("Failed to reject group:", error);
    } finally {
      setLoadingByGearId((prev) => ({ ...prev, [group.gearId]: null }));
    }
  };

  const loadResolved = () => {
    if (!resolvedEnabled) {
      setResolvedEnabled(true);
      return;
    }
    void mutateResolved();
  };

  const resolved = proposals.filter((p) => p.status !== "PENDING");

  const showLoading = pendingLoading && proposals.length === 0;
  const showEmpty =
    !pendingLoading && !pendingErrorMessage && proposals.length === 0;

  const getPendingProposals = (group: ProposalGroup) =>
    group.proposals.filter((p) => p.status === "PENDING");

  const formatContributorName = (name: string | null | undefined) =>
    name?.trim() || "Unknown contributor";

  const getInitials = (name: string | null | undefined) =>
    formatContributorName(name)
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]!)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  // Split pending and resolved

  const renderResolvedCard = (proposal: GearProposal) => (
    <Card key={proposal.id}>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">{proposal.gearName}</div>
            <div className="text-muted-foreground text-xs">
              {proposal.status} by{" "}
              {formatContributorName(proposal.createdByName)} on{" "}
              {formatDisplayDate(proposal.createdAt)}
            </div>
          </div>
          {proposal.gearSlug ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/gear/${proposal.gearSlug}`}>View Gear</Link>
            </Button>
          ) : null}
        </div>
        {proposal.note?.trim() ? (
          <p className="text-muted-foreground text-sm">{proposal.note.trim()}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  // Grouped card for pending approval (one per gear item)
  const renderGroupCard = (group: ProposalGroup) => {
    const pendingProposals = getPendingProposals(group);
    const conflicts = computeConflictsForGroup(group);
    const nonConflicts = computeNonConflictsForGroup(group);
    const selections = selectedByGroup[group.gearId] || {};
    const hasUnresolved = conflicts.some((c) => selections[c.fieldKey] == null);
    const groupAction = loadingByGearId[group.gearId] ?? null;
    const contributors = Array.from(
      pendingProposals.reduce(
        (map, proposal) => {
          const existing = map.get(proposal.createdById);
          if (existing) {
            existing.count += 1;
            if (
              new Date(proposal.createdAt as any).getTime() >
              new Date(existing.latestCreatedAt as any).getTime()
            ) {
              existing.latestCreatedAt = proposal.createdAt;
            }
            if (proposal.note?.trim()) {
              existing.notes.push(proposal.note.trim());
            }
          } else {
            map.set(proposal.createdById, {
              id: proposal.createdById,
              name: proposal.createdByName,
              image: proposal.createdByImage,
              count: 1,
              latestCreatedAt: proposal.createdAt,
              notes: proposal.note?.trim() ? [proposal.note.trim()] : [],
            });
          }
          return map;
        },
        new Map<
          string,
          {
            id: string;
            name: string | null;
            image: string | null;
            count: number;
            latestCreatedAt: string | Date;
            notes: string[];
          }
        >(),
      ).values(),
    ).sort(
      (a, b) =>
        new Date(b.latestCreatedAt as any).getTime() -
        new Date(a.latestCreatedAt as any).getTime(),
    );
    return (
      <Card key={group.gearId}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  <Link
                    href={`/gear/${group.gearSlug}`}
                    className="hover:underline"
                  >
                    {group.gearName}
                  </Link>
                </h3>
                <p className="text-muted-foreground text-xs">
                  {pendingProposals.length} pending request(s)
                </p>
              </div>
            </div>

            <div className="border-input rounded border p-3">
              <div className="text-muted-foreground mb-3 text-xs font-medium">
                Authors
              </div>
              <div className="flex flex-wrap gap-3.5">
                {contributors.map((contributor) => (
                  <div
                    key={contributor.id}
                    className="bg-muted/35 border-input/70 flex min-w-[220px] items-center gap-3 rounded-2xl border px-3 py-3 shadow-sm"
                  >
                    <Avatar className="size-10 rounded-xl">
                      <AvatarImage
                        src={contributor.image ?? undefined}
                        alt={formatContributorName(contributor.name)}
                      />
                      <AvatarFallback className="rounded-xl text-sm font-semibold">
                        {getInitials(contributor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <div className="truncate text-sm font-semibold leading-none">
                        {formatContributorName(contributor.name)}
                      </div>
                      <div className="text-muted-foreground text-xs leading-tight">
                        {contributor.count} request
                        {contributor.count === 1 ? "" : "s"} ·{" "}
                        {formatDisplayDate(contributor.latestCreatedAt as any)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {contributors.some((contributor) => contributor.notes.length > 0) && (
                <div className="mt-3 space-y-2">
                  {contributors.flatMap((contributor) =>
                    contributor.notes.map((note, index) => (
                      <div
                        key={`${contributor.id}-${index}`}
                        className="bg-muted rounded p-2 text-xs"
                      >
                        <span className="font-medium">
                          {formatContributorName(contributor.name)}:
                        </span>{" "}
                        {note}
                      </div>
                    )),
                  )}
                </div>
              )}
            </div>

            {conflicts.length > 0 ? (
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
                  Conflicts – choose one per field
                </div>
                {conflicts.map((c) => (
                  <div
                    key={c.fieldKey}
                    className="border-input rounded border p-3"
                  >
                    <div className="text-muted-foreground mb-2 text-[11px] font-medium">
                      {c.fieldKey === "cameraCardSlots"
                        ? "Card Slots"
                        : humanizeKey(c.key || "")}
                    </div>
                    <RadioGroup
                      value={selections[c.fieldKey] ?? undefined}
                      onValueChange={(val) =>
                        setSelectedByGroup((prev) => ({
                          ...prev,
                          [group.gearId]: {
                            ...(prev[group.gearId] || {}),
                            [c.fieldKey]: val,
                          },
                        }))
                      }
                    >
                      {c.options.map((opt) => (
                        <Label
                          key={opt.proposalId}
                          className="items-start gap-3"
                        >
                          <RadioGroupItem value={opt.proposalId} />
                          <div className="grid w-full grid-cols-1 gap-1 sm:grid-cols-2">
                            <span className="text-muted-foreground text-xs">
                              By {opt.createdByName ?? "Unknown"} on{" "}
                              {formatDisplayDate(opt.createdAt as any)}
                            </span>
                            <span className="text-sm">
                              {c.fieldKey === "cameraCardSlots"
                                ? Array.isArray(opt.value)
                                  ? opt.value
                                      .map(
                                        (s: any, idx: number) =>
                                          `S${s?.slotIndex ?? idx + 1}: ${formatCardSlotDetails(s)}`,
                                      )
                                      .join("; ")
                                  : String(opt.value)
                                : formatValueForKey(c.key || "", opt.value)}
                            </span>
                          </div>
                        </Label>
                      ))}
                      <Label className="items-start gap-3">
                        <RadioGroupItem value="__SKIP__" />
                        <div className="text-xs">
                          Skip (do not apply this field)
                        </div>
                      </Label>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">
                No conflicts. Changes affect distinct fields and will be merged.
              </div>
            )}

            {nonConflicts.length > 0 && (
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
                  Additional changes (no conflicts)
                </div>
                {nonConflicts.map((n: NonConflictEntry) => {
                  const included =
                    includedByGroup[group.gearId]?.[n.fieldKey] ?? true;
                  if (n.fieldKey === "cameraCardSlots") {
                    const slots = Array.isArray(n.value) ? n.value : [];
                    return (
                      <div
                        key={n.fieldKey}
                        className="border-input rounded border p-3"
                      >
                        <div className="text-muted-foreground mb-1 text-[11px]">
                          Card Slots
                        </div>
                        <div className="text-muted-foreground mb-2 text-xs">
                          From {formatContributorName(n.provider.createdByName)}{" "}
                          on {formatDisplayDate(n.provider.createdAt as any)}
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="text-muted-foreground text-sm">
                            - Empty
                          </div>
                          <div className="text-sm">
                            +{" "}
                            {slots
                              .map(
                                (s: any, idx: number) =>
                                  `S${s?.slotIndex ?? idx + 1}: ${formatCardSlotDetails(s)}`,
                              )
                              .join("; ")}
                          </div>
                        </div>
                        <div className="flex items-center justify-end pt-2">
                          <label className="flex cursor-pointer items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={included}
                              onChange={() =>
                                setIncludedByGroup((prev) => ({
                                  ...prev,
                                  [group.gearId]: {
                                    ...(prev[group.gearId] || {}),
                                    [n.fieldKey]: !included,
                                  },
                                }))
                              }
                              className="h-3.5 w-3.5"
                            />
                            Apply this field
                          </label>
                        </div>
                      </div>
                    );
                  }
                  if (n.fieldKey === "videoModes") {
                    const bundle = getVideoBundle(
                      Array.isArray(n.value)
                        ? (n.value as VideoModeNormalized[])
                        : [],
                    );
                    return (
                      <div
                        key={n.fieldKey}
                        className="border-input rounded border p-3"
                      >
                        <div className="text-muted-foreground mb-2 text-[11px]">
                          Video Modes
                        </div>
                        <div className="text-muted-foreground mb-2 text-xs">
                          From {formatContributorName(n.provider.createdByName)}{" "}
                          on {formatDisplayDate(n.provider.createdAt as any)}
                        </div>
                        {bundle ? (
                          <VideoSpecsSummary
                            summaryLines={bundle.summaryLines}
                            matrix={bundle.matrix}
                            codecLabels={bundle.codecLabels}
                          />
                        ) : (
                          <div className="text-muted-foreground text-xs">
                            No video modes provided.
                          </div>
                        )}
                        <div className="flex items-center justify-end pt-2">
                          <label className="flex cursor-pointer items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={included}
                              onChange={() =>
                                setIncludedByGroup((prev) => ({
                                  ...prev,
                                  [group.gearId]: {
                                    ...(prev[group.gearId] || {}),
                                    [n.fieldKey]: !included,
                                  },
                                }))
                              }
                              className="h-3.5 w-3.5"
                            />
                            Apply this field
                          </label>
                        </div>
                      </div>
                    );
                  }
                  const [area, key] = n.fieldKey.split(".");
                  const provider = group.proposals.find(
                    (p) => p.id === n.provider.proposalId,
                  );
                  let beforeVal: any = null;
                  if (provider) {
                    if (area === "core")
                      beforeVal = provider.beforeCore?.[key as any];
                    if (area === "camera")
                      beforeVal = provider.beforeCamera?.[key as any];
                    if (area === "lens")
                      beforeVal = provider.beforeLens?.[key as any];
                    if (area === "fixedLens")
                      beforeVal = provider.beforeFixedLens?.[key as any];
                  }
                  const beforeIsEmpty =
                    beforeVal === null ||
                    beforeVal === undefined ||
                    beforeVal === "";
                  const beforeDisplay = beforeIsEmpty
                    ? "Empty"
                    : formatBeforeValueForKey(key!, beforeVal);
                  const afterDisplay = formatValueForKey(key!, n.value);
                  return (
                    <div
                      key={n.fieldKey}
                      className="border-input rounded border p-2"
                    >
                      <div className="text-muted-foreground mb-1 text-[11px]">
                        {humanizeKey(key!)}
                      </div>
                      <div className="text-muted-foreground mb-2 text-xs">
                        From {formatContributorName(n.provider.createdByName)} on{" "}
                        {formatDisplayDate(n.provider.createdAt as any)}
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <span
                          className={
                            beforeIsEmpty
                              ? "text-muted-foreground text-sm italic"
                              : "rounded bg-red-50 px-2 py-0.5 text-sm font-medium text-red-400 dark:bg-red-950/30"
                          }
                        >
                          - {beforeDisplay}
                        </span>
                        <span className="w-full rounded bg-emerald-50 px-2 py-0.5 text-sm font-medium text-emerald-600 dark:bg-emerald-950/30">
                          + {afterDisplay}
                        </span>
                      </div>
                      <div className="flex items-center justify-end pt-2">
                        <label className="flex cursor-pointer items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={included}
                            onChange={() =>
                              setIncludedByGroup((prev) => ({
                                ...prev,
                                [group.gearId]: {
                                  ...(prev[group.gearId] || {}),
                                  [n.fieldKey]: !included,
                                },
                              }))
                            }
                            className="h-3.5 w-3.5"
                          />
                          Apply this field
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectGroup(group)}
                loading={groupAction === "reject"}
                disabled={groupAction !== null}
              >
                <X className="mr-2 h-4 w-4" />
                {pendingProposals.length === 1
                  ? "Reject Request"
                  : "Reject Requests"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleApproveGroup(group)}
                loading={groupAction === "approve"}
                disabled={
                  groupAction !== null || hasUnresolved
                }
              >
                <Check className="mr-2 h-4 w-4" /> Approve Selected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-5">
      {pendingErrorMessage && (
        <Card>
          <CardContent className="text-destructive py-3 text-sm">
            Failed to load pending proposals: {pendingErrorMessage}
          </CardContent>
        </Card>
      )}
      {showLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading proposals...</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {groups
          .filter((g) => g.proposals.some((p) => p.status === "PENDING"))
          .map((g) => renderGroupCard(g))}
        {showEmpty && (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              No pending proposals.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={loadResolved}
            loading={resolvedLoading}
            disabled={resolvedLoading}
          >
            {resolvedLoaded
              ? `Resolved (last 7 days${resolved.length ? ` · ${resolved.length}` : ""})`
              : `Load resolved (last 7 days${resolvedCount ? ` · ${resolvedCount}` : ""})`}
          </Button>
          {resolvedError && (
            <span className="text-destructive text-xs">{resolvedError}</span>
          )}
        </div>

        {resolvedLoaded && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="text-sm font-medium underline">
              {resolved.length} resolved
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[480px] space-y-3 overflow-y-auto p-3 pr-4">
                    {resolved.map((p) => renderResolvedCard(p))}
                    {resolved.length === 0 && (
                      <Card>
                        <CardContent className="text-muted-foreground py-6 text-center text-sm">
                          No resolved proposals in the last 7 days.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
