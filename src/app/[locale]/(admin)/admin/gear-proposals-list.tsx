"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import useSWR from "swr";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Check, X } from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { humanizeKey } from "~/lib/utils";
import {
  formatPrice,
  formatCardSlotDetails,
  formatPrecaptureSupport,
} from "~/lib/mapping";
import { formatMaxFpsPlain } from "~/lib/mapping/max-fps-map";
import { sensorNameFromSlug, sensorNameFromId } from "~/lib/mapping/sensor-map";
import { getMountLongNameById } from "~/lib/mapping/mounts-map";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { VideoSpecsSummary } from "~/app/[locale]/(pages)/gear/_components/video/video-summary";
import {
  normalizedToCameraVideoModes,
  type VideoModeNormalized,
} from "~/lib/video/mode-schema";
import { buildVideoDisplayBundle } from "~/lib/video/transform";
import {
  buildInitialSelectedByProposal,
  buildMergedPayloadForGroup,
  buildSelectedPayload,
  computeConflictsForGroup,
  computeNonConflictsForGroup,
  flattenProposalGroups,
  groupGearProposals,
  mergeProposalDiffsForDisplay,
  type GearProposal,
  type NonConflictEntry,
  type ProposalGroup,
  type ProposalGroupDto,
} from "./gear-proposals-list.helpers";
import { formatDate } from "~/lib/format/date";

type PendingResponse = { groups: ProposalGroupDto[] };
type ResolvedResponse = {
  groups: ProposalGroupDto[];
  count?: number;
  days?: number;
};

const formatStorageValue = (value: unknown): string => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return String(value);
  if (num >= 1000) {
    const tb = num / 1000;
    const formattedTb = Number.isInteger(tb) ? tb.toFixed(0) : tb.toFixed(1);
    return `${formattedTb} TB`;
  }
  const formattedGb = Number.isInteger(num) ? num.toFixed(0) : num.toFixed(1);
  return `${formattedGb} GB`;
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
  const [selectedByProposal, setSelectedByProposal] = useState<
    Record<string, Record<string, boolean>>
  >({});
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
  const [loadingByProposalId, setLoadingByProposalId] = useState<
    Record<string, boolean>
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
  useEffect(() => {
    if (proposals.length === 0) return;
    setSelectedByProposal((prev) => buildInitialSelectedByProposal(proposals, prev));
  }, [proposals]);

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

  const handleAction = async (
    proposalId: string,
    action: "approve" | "reject",
  ) => {
    try {
      setLoadingByProposalId((prev) => ({ ...prev, [proposalId]: true }));
      const { actionApproveProposal, actionRejectProposal } =
        await import("~/server/admin/proposals/actions");

      if (action === "approve") {
        const current = proposals.find((p) => p.id === proposalId);
        await actionApproveProposal(proposalId, undefined, {
          gearName: current?.gearName ?? "Gear",
          gearSlug: current?.gearSlug ?? current?.gearId ?? "",
        });
      } else {
        await actionRejectProposal(proposalId);
      }

      // Update local state to reflect the action
      setProposals((prev) => {
        return prev.map((proposal) => {
          if (proposal.id === proposalId) {
            return {
              ...proposal,
              status: action === "approve" ? "APPROVED" : "REJECTED",
            };
          }
          return proposal;
        });
      });
      void mutatePending();
      if (resolvedLoaded) void mutateResolved();
    } catch (error) {
      console.error(`Failed to ${action} proposal:`, error);
    } finally {
      setLoadingByProposalId((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleApprove = async (proposal: GearProposal) => {
    try {
      const filteredPayload = buildSelectedPayload(
        proposal,
        selectedByProposal[proposal.id] || {},
      );

      const { actionApproveProposal } =
        await import("~/server/admin/proposals/actions");
      await actionApproveProposal(proposal.id, filteredPayload, {
        gearName: proposal.gearName ?? "Gear",
        gearSlug: proposal.gearSlug ?? proposal.gearId ?? "",
      });

      // Reflect status and filtered payload locally
      setProposals((prev): GearProposal[] =>
        prev.map((p) => {
          if (p.id !== proposal.id) return p;
          const nextPayload = {
            core: (filteredPayload as any)?.core ?? p.payload.core,
            camera: (filteredPayload as any)?.camera ?? p.payload.camera,
            analogCamera:
              (filteredPayload as any)?.analogCamera ?? p.payload.analogCamera,
            lens: (filteredPayload as any)?.lens ?? p.payload.lens,
            fixedLens:
              (filteredPayload as any)?.fixedLens ?? p.payload.fixedLens,
            cameraCardSlots: Array.isArray(
              (filteredPayload as any)?.cameraCardSlots,
            )
              ? ((filteredPayload as any)
                  .cameraCardSlots as GearProposal["payload"]["cameraCardSlots"])
              : p.payload.cameraCardSlots,
            videoModes: Array.isArray((filteredPayload as any)?.videoModes)
              ? ((filteredPayload as any)
                  .videoModes as GearProposal["payload"]["videoModes"])
              : p.payload.videoModes,
          };
          return {
            ...p,
            status: "APPROVED",
            payload: nextPayload,
          } as GearProposal;
        }),
      );
      void mutatePending();
    } catch (error) {
      console.error("Failed to approve proposal:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "secondary" | "default" | "destructive"> = {
      PENDING: "secondary",
      APPROVED: "default",
      MERGED: "default",
      REJECTED: "destructive",
    };

    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

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

  const pending = proposals.filter((p) => p.status === "PENDING");
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

  const renderCard = (proposal: GearProposal) => {
    const { beforeMerged, afterMerged: mergedAfter } =
      mergeProposalDiffsForDisplay(proposal);
    const afterMerged = {
      ...mergedAfter,
      ...(Array.isArray(proposal.payload.cameraCardSlots)
        ? { cameraCardSlots: proposal.payload.cameraCardSlots }
        : {}),
    };
    const formatValue = (k: string, v: any): string => {
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
      if (k === "internalStorageGb") return formatStorageValue(v);
      return String(v);
    };
    const formatBeforeValue = (k: string, v: any): string => {
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
      if (k === "internalStorageGb") return formatStorageValue(v);
      return String(v);
    };
    const renderFieldDiffs = (
      before: Record<string, any>,
      after: Record<string, any>,
    ) => {
      const keys = Array.from(
        new Set([...Object.keys(before), ...Object.keys(after)]),
      );
      return (
        <div className="grid grid-cols-1 gap-2">
          {keys.map((k) => {
            const b = before[k];
            const a = after[k];
            if (k === "cameraCardSlots") {
              const toNormalizedSlot = (s: unknown) => {
                const obj =
                  s && typeof s === "object"
                    ? (s as {
                        slotIndex?: unknown;
                        supportedFormFactors?: unknown;
                        supportedBuses?: unknown;
                        supportedSpeedClasses?: unknown;
                      })
                    : ({} as {
                        slotIndex?: unknown;
                        supportedFormFactors?: unknown;
                        supportedBuses?: unknown;
                        supportedSpeedClasses?: unknown;
                      });
                const slotIndexRaw = obj.slotIndex;
                const indexNum =
                  typeof slotIndexRaw === "number"
                    ? slotIndexRaw
                    : Number(slotIndexRaw ?? 0);
                const toStringArray = (v: unknown): string[] =>
                  Array.isArray(v)
                    ? (v as unknown[]).filter(
                        (x): x is string => typeof x === "string",
                      )
                    : [];
                return {
                  slotIndex:
                    Number.isFinite(indexNum) && indexNum > 0
                      ? Math.trunc(indexNum)
                      : null,
                  supportedFormFactors: toStringArray(obj.supportedFormFactors),
                  supportedBuses: toStringArray(obj.supportedBuses),
                  supportedSpeedClasses: toStringArray(
                    obj.supportedSpeedClasses,
                  ),
                };
              };
              const slots = Array.isArray(a) ? a.map(toNormalizedSlot) : [];
              const beforeSlots = Array.isArray(b)
                ? b.map(toNormalizedSlot)
                : [];
              const selected = selectedByProposal[proposal.id]?.[k] ?? true;
              const toggle = () => {
                setSelectedByProposal((prev) => ({
                  ...prev,
                  [proposal.id]: {
                    ...(prev[proposal.id] || {}),
                    [k]: !selected,
                  },
                }));
              };
              return (
                <button
                  key={k}
                  type="button"
                  onClick={toggle}
                  className={`border-input hover:bg-muted/30 flex w-full items-start justify-between rounded border p-2 text-left transition ${selected ? "" : "opacity-60"}`}
                >
                  <div className="mr-2 w-full">
                    <div className="text-muted-foreground mb-1 text-[11px]">
                      Card Slots
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="text-muted-foreground text-sm">
                        -{" "}
                        {beforeSlots.length
                          ? beforeSlots
                              .map(
                                (s, idx) =>
                                  `S${s.slotIndex ?? idx + 1}: ${formatCardSlotDetails(s)}`,
                              )
                              .join("; ")
                          : "Empty"}
                      </div>
                      <div className="text-sm">
                        +{" "}
                        {slots
                          .map(
                            (s, idx) =>
                              `S${s.slotIndex ?? idx + 1}: ${formatCardSlotDetails(s)}`,
                          )
                          .join("; ")}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggle();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 h-4 w-4"
                  />
                </button>
              );
            }
            const beforeIsEmpty = b === null || b === undefined || b === "";
            const beforeDisplay = beforeIsEmpty
              ? "Empty"
              : formatBeforeValue(k, b);
            const afterDisplay = formatValue(k, a);
            const selected = selectedByProposal[proposal.id]?.[k] ?? true;
            const toggle = () => {
              setSelectedByProposal((prev) => ({
                ...prev,
                [proposal.id]: {
                  ...(prev[proposal.id] || {}),
                  [k]: !selected,
                },
              }));
            };
            return (
              <button
                key={k}
                type="button"
                onClick={toggle}
                className={`border-input hover:bg-muted/30 flex w-full items-start justify-between rounded border p-2 text-left transition ${selected ? "" : "opacity-60"}`}
              >
                <div className="mr-2 w-full">
                  <div className="text-muted-foreground mb-1 text-[11px]">
                    {humanizeKey(k)}
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
                </div>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggle();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 h-4 w-4"
                />
              </button>
            );
          })}
        </div>
      );
    };
    return (
      <Card key={proposal.id}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  <Link
                    href={`/gear/${proposal.gearSlug}`}
                    className="hover:underline"
                  >
                    {proposal.gearName}
                  </Link>
                </h3>
                <p className="text-muted-foreground text-xs">
                  Proposed by {proposal.createdByName}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(proposal.status)}
                <div className="text-muted-foreground text-xs">
                  {formatDisplayDate(proposal.createdAt as any)}
                </div>
              </div>
            </div>

            {proposal.note && (
              <div className="border-input bg-muted rounded border p-2 text-xs">
                <span className="font-medium">Note:</span> {proposal.note}
              </div>
            )}

            {renderFieldDiffs(beforeMerged, afterMerged)}

            {Array.isArray(proposal.payload.videoModes) &&
              proposal.payload.videoModes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs font-medium uppercase">
                    Video Modes
                  </div>
                  {(() => {
                    const bundle = getVideoBundle(proposal.payload.videoModes);
                    if (!bundle) {
                      return (
                        <div className="text-muted-foreground text-xs">
                          No video summary available.
                        </div>
                      );
                    }
                    return (
                      <VideoSpecsSummary
                        summaryLines={bundle.summaryLines}
                        matrix={bundle.matrix}
                        codecLabels={bundle.codecLabels}
                      />
                    );
                  })()}
                </div>
              )}

            {proposal.status === "PENDING" && (
              <div className="flex items-center justify-end space-x-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(proposal.id, "reject")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject All Changes
                </Button>
                <Button size="sm" onClick={() => handleApprove(proposal)}>
                  <Check className="mr-2 h-4 w-4" />
                  Apply Selected Changes
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResolvedCard = (proposal: GearProposal) => {
    const { beforeMerged, afterMerged } = mergeProposalDiffsForDisplay(proposal);
    const formatValue = (k: string, v: any): string => {
      const isEmpty = v === null || v === undefined || v === "";
      if (isEmpty) return "Empty";
      if (
        k === "msrpUsdCents" ||
        k === "msrpNowUsdCents" ||
        k === "msrpAtLaunchUsdCents"
      )
        return formatPrice(v as number);
      if (k === "releaseDate") return formatDisplayDate(v as any);
      if (k === "sensorFormatId") return sensorNameFromSlug(v as string);
      if (k === "mountId") return getMountLongNameById(v as string);
      if (k === "mountIds") {
        return Array.isArray(v)
          ? v.map((id) => getMountLongNameById(id as string)).join(", ")
          : getMountLongNameById(v as string);
      }
      if (k === "maxFpsByShutter") return formatMaxFpsPlain(v);
      return String(v);
    };
    const formatBeforeValue = (k: string, v: any): string => {
      if (k === "msrpUsdCents") return formatPrice(v as number);
      if (k === "releaseDate") return formatDisplayDate(v as any);
      if (k === "sensorFormatId") return sensorNameFromId(v as string);
      if (k === "mountId") return getMountLongNameById(v as string);
      if (k === "mountIds") {
        return Array.isArray(v)
          ? v.map((id) => getMountLongNameById(id as string)).join(", ")
          : getMountLongNameById(v as string);
      }
      if (k === "maxFpsByShutter") return formatMaxFpsPlain(v);
      return String(v);
    };
    const renderStaticDiffs = (
      before: Record<string, any>,
      after: Record<string, any>,
    ) => {
      const keys = Array.from(
        new Set([...Object.keys(before), ...Object.keys(after)]),
      );
      return (
        <div className="grid grid-cols-1 gap-2">
          {keys.map((k) => {
            const b = before[k];
            const a = after[k];
            const beforeIsEmpty = b === null || b === undefined || b === "";
            const beforeDisplay = beforeIsEmpty
              ? "Empty"
              : formatBeforeValue(k, b);
            const afterDisplay = formatValue(k, a);
            return (
              <div key={k} className="border-input rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[11px]">
                  {humanizeKey(k)}
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
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <Card key={proposal.id}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  <Link
                    href={`/gear/${proposal.gearSlug}`}
                    className="hover:underline"
                  >
                    {proposal.gearName}
                  </Link>
                </h3>
                <p className="text-muted-foreground text-xs">
                  Proposed by {proposal.createdByName}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(proposal.status)}
                <div className="text-muted-foreground text-xs">
                  {formatDisplayDate(proposal.createdAt as any)}
                </div>
              </div>
            </div>

            {proposal.note && (
              <div className="border-input bg-muted rounded border p-2 text-xs">
                <span className="font-medium">Note:</span> {proposal.note}
              </div>
            )}

            {renderStaticDiffs(beforeMerged, afterMerged)}
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
