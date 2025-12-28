"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Check, X } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { humanizeKey, formatHumanDate } from "~/lib/utils";
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
import { VideoSpecsSummary } from "~/app/(app)/(pages)/gear/_components/video/video-summary";
import {
  normalizedToCameraVideoModes,
  type VideoModeNormalized,
} from "~/lib/video/mode-schema";
import { buildVideoDisplayBundle } from "~/lib/video/transform";

interface GearProposal {
  id: string;
  gearId: string;
  gearName: string;
  gearSlug: string;
  createdById: string;
  createdByName: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "MERGED";
  payload: {
    core?: Record<string, any>;
    camera?: Record<string, any>;
    lens?: Record<string, any>;
    fixedLens?: Record<string, any>;
    cameraCardSlots?: Array<{
      slotIndex: number;
      supportedFormFactors: string[];
      supportedBuses: string[];
      supportedSpeedClasses?: string[];
    }>;
    videoModes?: VideoModeNormalized[];
  };
  beforeCore?: Record<string, any>;
  beforeCamera?: Record<string, any>;
  beforeLens?: Record<string, any>;
  beforeFixedLens?: Record<string, any>;
  note?: string | null;
  createdAt: string | Date;
}

type ProposalGroupDto = {
  gearId: string;
  gearName: string;
  gearSlug: string;
  proposals: Array<{
    id: string;
    gearId: string;
    createdById: string;
    createdByName: string | null;
    status: string;
    payload: unknown;
    beforeCore?: Record<string, unknown>;
    beforeCamera?: Record<string, unknown>;
    beforeLens?: Record<string, unknown>;
    beforeFixedLens?: Record<string, unknown>;
    note?: string | null;
    createdAt: string | Date;
  }>;
};

type PendingResponse = { groups: ProposalGroupDto[] };
type ResolvedResponse = {
  groups: ProposalGroupDto[];
  count?: number;
  days?: number;
};

export function GearProposalsList() {
  const [proposals, setProposals] = useState<GearProposal[]>([]);

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

  const flattenGroups = (groups: ProposalGroupDto[]): GearProposal[] =>
    groups.flatMap((g) =>
      g.proposals.map((p) => ({
        id: p.id,
        gearId: p.gearId,
        gearName: g.gearName,
        gearSlug: g.gearSlug,
        createdById: p.createdById,
        createdByName: p.createdByName,
        status:
          p.status === "PENDING" ||
          p.status === "APPROVED" ||
          p.status === "REJECTED" ||
          p.status === "MERGED"
            ? (p.status as any)
            : ("APPROVED" as const),
        payload:
          (p.payload as {
            core?: Record<string, any>;
            camera?: Record<string, any>;
            lens?: Record<string, any>;
            fixedLens?: Record<string, any>;
            cameraCardSlots?: Array<{
              slotIndex: number;
              supportedFormFactors: string[];
              supportedBuses: string[];
              supportedSpeedClasses?: string[];
            }>;
            videoModes?: VideoModeNormalized[];
          }) || {},
        beforeCore: p.beforeCore as Record<string, any> | undefined,
        beforeCamera: p.beforeCamera as Record<string, any> | undefined,
        beforeLens: p.beforeLens as Record<string, any> | undefined,
        beforeFixedLens: p.beforeFixedLens as Record<string, any> | undefined,
        note: p.note,
        createdAt: p.createdAt,
      })),
    );

  useEffect(() => {
    if (!pendingData?.groups) return;
    const pendingFlat = flattenGroups(pendingData.groups).filter(
      (p) => p.status === "PENDING",
    );
    setProposals((prev) => {
      const resolved = prev.filter((p) => p.status !== "PENDING");
      return [...pendingFlat, ...resolved];
    });
  }, [pendingData]);

  useEffect(() => {
    if (!resolvedData?.groups) return;
    const resolvedFlat = flattenGroups(resolvedData.groups).filter(
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
    setSelectedByProposal((prev) => {
      const next = { ...prev };
      for (const p of proposals) {
        if (!next[p.id]) {
          const coreKeys = Object.keys(p.payload.core ?? {});
          const cameraKeys = Object.keys(p.payload.camera ?? {});
          const lensKeys = Object.keys(p.payload.lens ?? {});
          const fixedLensKeys = Object.keys((p.payload as any).fixedLens ?? {});
          const allKeys = [
            ...coreKeys,
            ...cameraKeys,
            ...lensKeys,
            ...fixedLensKeys,
          ];
          const initial: Record<string, boolean> = {};
          for (const k of allKeys) initial[k] = true;
          next[p.id] = initial;
        }
      }
      return next;
    });
  }, [proposals]);

  // Build groups from initialProposals (for pending UI)
  type Group = {
    gearId: string;
    gearName: string;
    gearSlug: string;
    proposals: GearProposal[];
  };
  const groups: Group[] = useMemo(() => {
    const grouped = Array.from(
      proposals.reduce((map, proposal) => {
        const existing = map.get(proposal.gearId);
        if (existing) {
          existing.proposals.push(proposal);
        } else {
          map.set(proposal.gearId, {
            gearId: proposal.gearId,
            gearName: proposal.gearName,
            gearSlug: proposal.gearSlug,
            proposals: [proposal],
          });
        }
        return map;
      }, new Map<string, Group>()),
    )
      .map(([, group]) => ({
        ...group,
        proposals: group.proposals
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt as any).getTime() -
              new Date(a.createdAt as any).getTime(),
          ),
      }))
      .sort((a, b) => {
        const aLatest = Math.max(
          ...a.proposals.map((p) => new Date(p.createdAt as any).getTime()),
        );
        const bLatest = Math.max(
          ...b.proposals.map((p) => new Date(p.createdAt as any).getTime()),
        );
        return bLatest - aLatest;
      });
    return grouped;
  }, [proposals]);

  // Helpers for conflict detection and formatting
  const serialize = (v: unknown): string => {
    try {
      return JSON.stringify(v, Object.keys(v as any).sort());
    } catch {
      return String(v);
    }
  };

  const formatValueForKey = (k: string, v: any): string => {
    const isEmpty = v === null || v === undefined || v === "";
    if (isEmpty) return "Empty";
    if (
      k === "msrpUsdCents" ||
      k === "msrpNowUsdCents" ||
      k === "msrpAtLaunchUsdCents"
    )
      return formatPrice(v as number);
    if (k === "releaseDate") return formatHumanDate(v);
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
    if (k === "releaseDate") return formatHumanDate(v);
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

  type ConflictEntry = {
    fieldKey: string; // e.g. core.name or cameraCardSlots
    area:
      | "core"
      | "camera"
      | "analogCamera"
      | "lens"
      | "fixedLens"
      | "cameraCardSlots"
      | "videoModes";
    key?: string; // inner key when area != cameraCardSlots
    options: Array<{
      proposalId: string;
      createdByName: string | null;
      createdAt: string | Date;
      value: any;
    }>;
  };
  type NonConflictEntry = {
    fieldKey: string;
    area:
      | "core"
      | "camera"
      | "analogCamera"
      | "lens"
      | "fixedLens"
      | "cameraCardSlots"
      | "videoModes";
    key?: string;
    provider: {
      proposalId: string;
      createdByName: string | null;
      createdAt: string | Date;
    };
    value: any;
  };
  const computeNonConflictsForGroup = (group: Group): NonConflictEntry[] => {
    const map = new Map<
      string,
      {
        area: NonConflictEntry["area"];
        key?: string;
        items: ConflictEntry["options"];
      }
    >();
    for (const p of group.proposals.filter((x) => x.status === "PENDING")) {
      const add = (
        area: NonConflictEntry["area"],
        obj?: Record<string, any>,
      ) => {
        if (!obj) return;
        Object.entries(obj).forEach(([k, v]) => {
          const fieldKey = `${area}.${k}`;
          const rec = map.get(fieldKey) ?? { area, key: k, items: [] };
          rec.items.push({
            proposalId: p.id,
            createdByName: p.createdByName ?? null,
            createdAt: p.createdAt,
            value: v,
          });
          map.set(fieldKey, rec);
        });
      };
      add("core", p.payload.core);
      add("camera", p.payload.camera);
      add("analogCamera", (p.payload as any).analogCamera);
      add("lens", p.payload.lens);
      add("fixedLens", (p.payload as any).fixedLens);
      add("fixedLens", (p.payload as any).fixedLens);
      if (Array.isArray(p.payload.cameraCardSlots)) {
        const fieldKey = "cameraCardSlots";
        const rec:
          | {
              area: NonConflictEntry["area"];
              key?: string;
              items: ConflictEntry["options"];
            }
          | undefined = map.get(fieldKey);
        const nextRec = rec ?? {
          area: "cameraCardSlots",
          items: [] as ConflictEntry["options"],
        };
        nextRec.items.push({
          proposalId: p.id,
          createdByName: p.createdByName ?? null,
          createdAt: p.createdAt,
          value: p.payload.cameraCardSlots,
        });
        map.set(fieldKey, nextRec);
      }
      if (Array.isArray((p.payload as any).videoModes)) {
        const fieldKey = "videoModes";
        const rec = map.get(fieldKey) ?? {
          area: "videoModes" as NonConflictEntry["area"],
          items: [] as ConflictEntry["options"],
        };
        rec.items.push({
          proposalId: p.id,
          createdByName: p.createdByName ?? null,
          createdAt: p.createdAt,
          value: (p.payload as any).videoModes,
        });
        map.set(fieldKey, rec);
      }
    }
    const results: NonConflictEntry[] = [];
    for (const [fieldKey, rec] of map.entries()) {
      const uniqueValueKeySet = new Set<string>();
      let representative: ConflictEntry["options"][number] | null = null;
      for (const opt of rec.items) {
        const key = serialize(opt.value);
        uniqueValueKeySet.add(key);
        if (!representative) representative = opt;
      }
      if (rec.items.length >= 1 && uniqueValueKeySet.size === 1) {
        const opt = representative!;
        results.push({
          fieldKey,
          area: rec.area as any,
          key: rec.key,
          provider: {
            proposalId: opt.proposalId,
            createdByName: opt.createdByName ?? null,
            createdAt: opt.createdAt,
          },
          value: opt.value,
        });
      }
    }
    return results;
  };

  const computeConflictsForGroup = (group: Group): ConflictEntry[] => {
    const map = new Map<
      string,
      {
        area: ConflictEntry["area"];
        key?: string;
        items: ConflictEntry["options"];
      }
    >();

    for (const p of group.proposals.filter((x) => x.status === "PENDING")) {
      const add = (
        area: ConflictEntry["area"],
        obj?: Record<string, unknown>,
      ) => {
        if (!obj) return;
        Object.entries(obj).forEach(([k, v]) => {
          const fieldKey = `${area}.${k}`;
          const rec = map.get(fieldKey) ?? {
            area,
            key: k,
            items: [],
          };
          rec.items.push({
            proposalId: p.id,
            createdByName: p.createdByName ?? null,
            createdAt: p.createdAt,
            value: v as unknown,
          });
          map.set(fieldKey, rec);
        });
      };
      add("core", p.payload.core);
      add("camera", p.payload.camera);
      add("lens", p.payload.lens);
      if (Array.isArray(p.payload.cameraCardSlots)) {
        const fieldKey = "cameraCardSlots";
        const rec = map.get(fieldKey) ?? { area: "cameraCardSlots", items: [] };
        rec.items.push({
          proposalId: p.id,
          createdByName: p.createdByName ?? null,
          createdAt: p.createdAt,
          value: p.payload.cameraCardSlots,
        });
        map.set(fieldKey, rec as any);
      }
      if (Array.isArray((p.payload as any).videoModes)) {
        const fieldKey = "videoModes";
        const rec = map.get(fieldKey) ?? {
          area: "videoModes" as ConflictEntry["area"],
          items: [],
        };
        rec.items.push({
          proposalId: p.id,
          createdByName: p.createdByName ?? null,
          createdAt: p.createdAt,
          value: (p.payload as any).videoModes,
        });
        map.set(fieldKey, rec as any);
      }
    }

    const conflicts: ConflictEntry[] = [];
    for (const [fieldKey, rec] of map.entries()) {
      const uniques = new Map<string, ConflictEntry["options"][number]>();
      for (const opt of rec.items) {
        const key = serialize(opt.value);
        if (!uniques.has(key)) uniques.set(key, opt);
      }
      if (rec.items.length > 1 && uniques.size > 1) {
        conflicts.push({
          fieldKey,
          area: rec.area as any,
          key: rec.key,
          options: rec.items,
        });
      }
    }
    return conflicts;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const handleAction = async (
    proposalId: string,
    action: "approve" | "reject",
  ) => {
    try {
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
    } catch (error) {
      console.error(`Failed to ${action} proposal:`, error);
    }
  };

  const buildSelectedPayload = (proposal: GearProposal) => {
    const selected = selectedByProposal[proposal.id] || {};
    const pick = (
      obj: Record<string, any> | undefined,
    ): Record<string, any> | undefined => {
      if (!obj) return undefined;
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (selected[k]) out[k] = v;
      }
      return Object.keys(out).length ? out : undefined;
    };
    return {
      core: pick(proposal.payload.core),
      camera: pick(proposal.payload.camera),
      lens: pick(proposal.payload.lens),
      fixedLens: pick((proposal.payload as any).fixedLens),
      cameraCardSlots: Array.isArray(proposal.payload.cameraCardSlots)
        ? proposal.payload.cameraCardSlots
        : undefined,
    } as {
      core?: Record<string, any>;
      camera?: Record<string, any>;
      lens?: Record<string, any>;
      fixedLens?: Record<string, any>;
      cameraCardSlots?: unknown;
    };
  };

  const handleApprove = async (proposal: GearProposal) => {
    try {
      const filteredPayload = buildSelectedPayload(proposal);

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
            lens: (filteredPayload as any)?.lens ?? p.payload.lens,
            fixedLens:
              (filteredPayload as any)?.fixedLens ?? p.payload.fixedLens,
            cameraCardSlots: Array.isArray(
              (filteredPayload as any)?.cameraCardSlots,
            )
              ? ((filteredPayload as any)
                  .cameraCardSlots as GearProposal["payload"]["cameraCardSlots"])
              : p.payload.cameraCardSlots,
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

  // Build merged payload for a group from selections
  const buildMergedPayloadForGroup = (group: Group) => {
    const conflicts = computeConflictsForGroup(group);
    const nonConflicts = computeNonConflictsForGroup(group);
    const selectedMap = selectedByGroup[group.gearId] || {};
    const includedMap = includedByGroup[group.gearId] || {};

    // Collect field providers: fieldKey -> proposalId
    const providerByField = new Map<string, string>();
    // Conflicts: use selection (skip if selected skip)
    for (const c of conflicts) {
      const sel = selectedMap[c.fieldKey];
      if (sel && sel !== "__SKIP__") providerByField.set(c.fieldKey, sel);
    }
    // Non-conflicts: include only if included
    for (const n of nonConflicts) {
      const included = includedMap[n.fieldKey];
      if (included !== false && !providerByField.has(n.fieldKey)) {
        providerByField.set(n.fieldKey, n.provider.proposalId);
      }
    }

    // Build nested payload
    const out: {
      core?: Record<string, any>;
      camera?: Record<string, any>;
      lens?: Record<string, any>;
      fixedLens?: Record<string, any>;
      cameraCardSlots?: any;
      videoModes?: VideoModeNormalized[];
    } = {};

    const getProposalById = (id: string) =>
      group.proposals.find((p) => p.id === id)!;

    for (const [fieldKey, providerId] of providerByField.entries()) {
      if (fieldKey === "cameraCardSlots") {
        const p = getProposalById(providerId);
        if (p && Array.isArray(p.payload.cameraCardSlots)) {
          out.cameraCardSlots = p.payload.cameraCardSlots;
        }
        continue;
      }
      if (fieldKey === "videoModes") {
        const p = getProposalById(providerId);
        if (p && Array.isArray(p.payload.videoModes)) {
          out.videoModes = p.payload.videoModes;
        }
        continue;
      }
      const parts = fieldKey.split(".");
      const area = parts[0] as "core" | "camera" | "lens" | "fixedLens";
      const key = parts[1] as string | undefined;
      if (!key) continue;
      const p = getProposalById(providerId);
      if (!p) continue;
      const src = (p.payload as any)[area] || {};
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        (out as any)[area] = (out as any)[area] || {};
        (out as any)[area][key] = src[key];
      }
    }
    return out;
  };

  const handleApproveGroup = async (group: Group) => {
    try {
      setLoadingByGearId((prev) => ({ ...prev, [group.gearId]: true }));
      const mergedPayload = buildMergedPayloadForGroup(group);
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
      setLoadingByGearId((prev) => ({ ...prev, [group.gearId]: false }));
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

  // Split pending and resolved

  // Grouped card for pending approval (one per gear item)
  const renderGroupCard = (group: Group) => {
    const conflicts = computeConflictsForGroup(group);
    const nonConflicts = computeNonConflictsForGroup(group);
    const selections = selectedByGroup[group.gearId] || {};
    const hasUnresolved = conflicts.some((c) => selections[c.fieldKey] == null);
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
                  {group.proposals.filter((p) => p.status === "PENDING").length}{" "}
                  pending request(s)
                </p>
              </div>
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
                              {formatHumanDate(opt.createdAt as any)}
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

            <div className="flex items-center justify-end">
              <Button
                size="sm"
                onClick={() => handleApproveGroup(group)}
                loading={Boolean(loadingByGearId[group.gearId])}
                disabled={
                  Boolean(loadingByGearId[group.gearId]) || hasUnresolved
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
    const beforeMerged = {
      ...(proposal.beforeCore || {}),
      ...(proposal.beforeCamera || {}),
      ...(proposal.beforeLens || {}),
      ...(proposal.beforeFixedLens || {}),
    };
    const afterMerged = {
      ...(proposal.payload.core || {}),
      ...(proposal.payload.camera || {}),
      ...(proposal.payload.lens || {}),
      ...(proposal.payload.fixedLens || {}),
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
      if (k === "releaseDate") return formatHumanDate(v);
      if (k === "sensorFormatId") return sensorNameFromSlug(v as string);
      if (k === "mountId") return getMountLongNameById(v as string);
      if (k === "mountIds") {
        return Array.isArray(v)
          ? v.map((id) => getMountLongNameById(id as string)).join(", ")
          : getMountLongNameById(v as string);
      }
      return String(v);
    };
    const formatBeforeValue = (k: string, v: any): string => {
      if (
        k === "msrpUsdCents" ||
        k === "msrpNowUsdCents" ||
        k === "msrpAtLaunchUsdCents"
      )
        return formatPrice(v as number);
      if (k === "releaseDate") return formatHumanDate(v);
      if (k === "sensorFormatId") return sensorNameFromId(v as string);
      if (k === "mountId") return getMountLongNameById(v as string);
      if (k === "mountIds") {
        return Array.isArray(v)
          ? v.map((id) => getMountLongNameById(id as string)).join(", ")
          : getMountLongNameById(v as string);
      }
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
                  {formatHumanDate(proposal.createdAt as any)}
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
    const beforeMerged = {
      ...(proposal.beforeCore || {}),
      ...(proposal.beforeCamera || {}),
      ...(proposal.beforeLens || {}),
      ...(proposal.beforeFixedLens || {}),
    };
    const afterMerged = {
      ...(proposal.payload.core || {}),
      ...(proposal.payload.camera || {}),
      ...(proposal.payload.lens || {}),
      ...(proposal.payload.fixedLens || {}),
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
      if (k === "releaseDate") return formatHumanDate(v as any);
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
      if (k === "releaseDate") return formatHumanDate(v as any);
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
                  {formatHumanDate(proposal.createdAt as any)}
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
