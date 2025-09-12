"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { humanizeKey, formatHumanDate } from "~/lib/utils";
import { formatPrice } from "~/lib/mapping";
import { sensorNameFromSlug, sensorNameFromId } from "~/lib/mapping/sensor-map";
import { getMountLongNameById } from "~/lib/mapping/mounts-map";

interface GearProposal {
  id: string;
  gearId: string;
  gearName: string;
  gearSlug: string;
  createdById: string;
  createdByName: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  payload: {
    core?: Record<string, any>;
    camera?: Record<string, any>;
    lens?: Record<string, any>;
    cameraCardSlots?: Array<{
      slotIndex: number;
      supportedFormFactors: string[];
      supportedBuses: string[];
      supportedSpeedClasses?: string[];
    }>;
  };
  beforeCore?: Record<string, any>;
  beforeCamera?: Record<string, any>;
  beforeLens?: Record<string, any>;
  note?: string | null;
  createdAt: string | Date;
}

interface GearProposalsListProps {
  initialProposals: Array<{
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
      note?: string | null;
      createdAt: string | Date;
    }>;
  }>;
}

export function GearProposalsList({
  initialProposals,
}: GearProposalsListProps) {
  const [proposals, setProposals] = useState<GearProposal[]>(() => {
    // Flatten groups into a list of proposals for this simple list view
    return initialProposals.flatMap((g) =>
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
          p.status === "REJECTED"
            ? p.status
            : "APPROVED",
        payload:
          (p.payload as {
            core?: Record<string, any>;
            camera?: Record<string, any>;
            lens?: Record<string, any>;
          }) || {},
        beforeCore: p.beforeCore as Record<string, any> | undefined,
        beforeCamera: p.beforeCamera as Record<string, any> | undefined,
        beforeLens: p.beforeLens as Record<string, any> | undefined,
        note: p.note,
        createdAt: p.createdAt,
      })),
    );
  });
  const [selectedByProposal, setSelectedByProposal] = useState<
    Record<string, Record<string, boolean>>
  >({});

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
          const allKeys = [...coreKeys, ...cameraKeys, ...lensKeys];
          const initial: Record<string, boolean> = {};
          for (const k of allKeys) initial[k] = true;
          next[p.id] = initial;
        }
      }
      return next;
    });
  }, [proposals]);

  const handleAction = async (
    proposalId: string,
    action: "approve" | "reject",
  ) => {
    try {
      const { actionApproveProposal, actionRejectProposal } = await import(
        "~/server/admin/proposals/actions"
      );

      if (action === "approve") {
        await actionApproveProposal(proposalId);
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
      cameraCardSlots: Array.isArray(proposal.payload.cameraCardSlots)
        ? proposal.payload.cameraCardSlots
        : undefined,
    } as {
      core?: Record<string, any>;
      camera?: Record<string, any>;
      lens?: Record<string, any>;
      cameraCardSlots?: unknown;
    };
  };

  const handleApprove = async (proposal: GearProposal) => {
    try {
      const filteredPayload = buildSelectedPayload(proposal);
      console.log("filteredPayload", filteredPayload);

      const { actionApproveProposal } = await import(
        "~/server/admin/proposals/actions"
      );
      await actionApproveProposal(proposal.id, filteredPayload);

      // Reflect status and filtered payload locally
      setProposals((prev): GearProposal[] =>
        prev.map((p) => {
          if (p.id !== proposal.id) return p;
          const nextPayload = {
            core: (filteredPayload as any)?.core ?? p.payload.core,
            camera: (filteredPayload as any)?.camera ?? p.payload.camera,
            lens: (filteredPayload as any)?.lens ?? p.payload.lens,
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
    } catch (error) {
      console.error("Failed to approve proposal:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "secondary" | "default" | "destructive"> = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
    };

    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No gear edit proposals found.</p>
        </CardContent>
      </Card>
    );
  }

  // Split pending and resolved
  const pending = proposals.filter((p) => p.status === "PENDING");
  const resolved = proposals.filter((p) => p.status !== "PENDING");

  const renderCard = (proposal: GearProposal) => {
    const beforeMerged = {
      ...(proposal.beforeCore || {}),
      ...(proposal.beforeCamera || {}),
      ...(proposal.beforeLens || {}),
    };
    const afterMerged = {
      ...(proposal.payload.core || {}),
      ...(proposal.payload.camera || {}),
      ...(proposal.payload.lens || {}),
      ...(Array.isArray(proposal.payload.cameraCardSlots)
        ? { cameraCardSlots: proposal.payload.cameraCardSlots }
        : {}),
    };
    const formatValue = (k: string, v: any): string => {
      if (k === "msrpUsdCents") return formatPrice(v as number);
      if (k === "releaseDate") return formatHumanDate(v);
      if (k === "sensorFormatId") return sensorNameFromSlug(v as string);
      if (k === "mountId") return getMountLongNameById(v as string);
      return String(v);
    };
    const formatBeforeValue = (k: string, v: any): string => {
      if (k === "msrpUsdCents") return formatPrice(v as number);
      if (k === "releaseDate") return formatHumanDate(v);
      if (k === "sensorFormatId") return sensorNameFromId(v as string);
      if (k === "mountId") return getMountLongNameById(v as string);
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
              const slots = Array.isArray(a) ? (a as any[]) : [];
              const beforeSlots = Array.isArray(b) ? (b as any[]) : [];
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
                                (s) =>
                                  `S${s.slotIndex}: ${(s.supportedFormFactors || []).join(", ")} | ${(s.supportedBuses || []).join(", ")}${(s.supportedSpeedClasses || []).length ? ` | ${s.supportedSpeedClasses.join(", ")}` : ""}`,
                              )
                              .join("; ")
                          : "Empty"}
                      </div>
                      <div className="text-sm">
                        +{" "}
                        {slots
                          .map(
                            (s) =>
                              `S${s.slotIndex}: ${(s.supportedFormFactors || []).join(", ")} | ${(s.supportedBuses || []).join(", ")}${(s.supportedSpeedClasses || []).length ? ` | ${s.supportedSpeedClasses.join(", ")}` : ""}`,
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
                  {new Date(proposal.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {proposal.note && (
              <div className="border-input bg-muted rounded border p-2 text-xs">
                <span className="font-medium">Note:</span> {proposal.note}
              </div>
            )}

            {renderFieldDiffs(beforeMerged, afterMerged)}

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
    };
    const afterMerged = {
      ...(proposal.payload.core || {}),
      ...(proposal.payload.camera || {}),
      ...(proposal.payload.lens || {}),
    };
    const formatValue = (k: string, v: any): string => {
      if (k === "msrpUsdCents") return formatPrice(v as number);
      if (k === "releaseDate") return formatHumanDate(v as any);
      if (k === "sensorFormatId") return sensorNameFromSlug(v as string);
      if (k === "mountId") return getMountLongNameById(v as string);
      return String(v);
    };
    const formatBeforeValue = (k: string, v: any): string => {
      if (k === "msrpUsdCents") return formatPrice(v as number);
      if (k === "releaseDate") return formatHumanDate(v as any);
      if (k === "sensorFormatId") return sensorNameFromId(v as string);
      if (k === "mountId") return getMountLongNameById(v as string);
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
                  {new Date(proposal.createdAt).toLocaleDateString()}
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
      <div className="space-y-3">
        {pending.map((p) => renderCard(p))}
        {pending.length === 0 && (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              No pending proposals.
            </CardContent>
          </Card>
        )}
      </div>

      <Collapsible>
        <CollapsibleTrigger className="text-sm font-medium underline">
          {resolved.length} resolved
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          {resolved.map((p) => renderResolvedCard(p))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
