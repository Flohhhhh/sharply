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
  };
  beforeCore?: Record<string, any>;
  beforeCamera?: Record<string, any>;
  beforeLens?: Record<string, any>;
  note?: string;
  createdAt: string | Date;
}

// Simplified test data - just individual proposals
const TEST_DATA: GearProposal[] = [
  {
    id: "1",
    gearId: "1",
    gearName: "Nikon Z 400mm f/4.5 VR S",
    gearSlug: "nikon-z-400mm-f45-vr-s",
    createdById: "user1",
    createdByName: "John Smith",
    status: "PENDING",
    payload: {
      core: {
        msrpUsdCents: 649900,
        releaseDate: "2024-01-15T00:00:00Z",
      },
      lens: {
        focalLengthMinMm: 400,
        focalLengthMaxMm: 400,
        hasStabilization: true,
      },
    },
    note: "Updated pricing and confirmed stabilization feature",
    createdAt: "2024-01-20T10:30:00Z",
  },
  {
    id: "2",
    gearId: "1",
    gearName: "Nikon Z 400mm f/4.5 VR S",
    gearSlug: "nikon-z-400mm-f45-vr-s",
    createdById: "user2",
    createdByName: "Sarah Johnson",
    status: "PENDING",
    payload: {
      lens: {
        focalLengthMinMm: 400,
        focalLengthMaxMm: 400,
        hasStabilization: true,
        extra: {
          filterSize: "95mm",
          weight: "1160g",
        },
      },
    },
    note: "Added filter size and weight specifications",
    createdAt: "2024-01-21T14:15:00Z",
  },
  {
    id: "3",
    gearId: "2",
    gearName: "Sony FE 24-70mm f/2.8 GM II",
    gearSlug: "sony-fe-24-70mm-f28-gm-ii",
    createdById: "user3",
    createdByName: "Mike Chen",
    status: "PENDING",
    payload: {
      core: {
        msrpUsdCents: 219800,
      },
      lens: {
        focalLengthMinMm: 24,
        focalLengthMaxMm: 70,
        hasStabilization: false,
        extra: {
          filterSize: "82mm",
          weight: "695g",
          apertureBlades: 11,
        },
      },
    },
    note: "Corrected pricing and added detailed lens specifications",
    createdAt: "2024-01-22T09:45:00Z",
  },
  {
    id: "4",
    gearId: "3",
    gearName: "Canon RF 70-200mm f/2.8L IS USM",
    gearSlug: "canon-rf-70-200mm-f28l-is-usm",
    createdById: "user4",
    createdByName: "Emily Davis",
    status: "APPROVED",
    payload: {
      core: {
        msrpUsdCents: 269900,
      },
      lens: {
        focalLengthMinMm: 70,
        focalLengthMaxMm: 200,
        hasStabilization: true,
      },
    },
    note: "Updated pricing and confirmed focal length range",
    createdAt: "2024-01-18T16:20:00Z",
  },
  {
    id: "5",
    gearId: "4",
    gearName: "Fujifilm XF 56mm f/1.2 R WR",
    gearSlug: "fujifilm-xf-56mm-f12-r-wr",
    createdById: "user5",
    createdByName: "Alex Thompson",
    status: "PENDING",
    payload: {
      lens: {
        focalLengthMinMm: 56,
        focalLengthMaxMm: 56,
        hasStabilization: false,
        extra: {
          filterSize: "62mm",
          weight: "445g",
          apertureBlades: 9,
        },
      },
    },
    note: "Added detailed lens specifications and weight",
    createdAt: "2024-01-23T11:30:00Z",
  },
];

export function GearProposalsList() {
  const [proposals, setProposals] = useState<GearProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedByProposal, setSelectedByProposal] = useState<
    Record<string, Record<string, boolean>>
  >({});

  useEffect(() => {
    fetchProposals().catch(console.error);
  }, []);

  const fetchProposals = async () => {
    try {
      const { fetchGearProposals } = await import(
        "~/server/admin/proposals/service"
      );
      const grouped = await fetchGearProposals();
      // Flatten groups into a list of proposals for this simple list view
      const flat: GearProposal[] = grouped.flatMap((g) =>
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
          beforeCore: p.beforeCore,
          beforeCamera: p.beforeCamera,
          beforeLens: p.beforeLens,
          note: (p.note as string | undefined) ?? undefined,
          createdAt: p.createdAt as string | Date,
        })),
      );
      setProposals(flat);
    } catch (e) {
      console.error("Failed to fetch proposals:", e);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

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
      // For demo purposes, simulate API call
      console.log(`${action}ing proposal ${proposalId}`);

      // Update local state to simulate the action
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

      // In production, you would call the actual API
      // const response = await fetch(`/api/admin/gear-proposals/${proposalId}/${action}`, {
      //   method: "POST",
      // });

      // if (response.ok) {
      //   await fetchProposals();
      // }
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
    } as {
      core?: Record<string, any>;
      camera?: Record<string, any>;
      lens?: Record<string, any>;
    };
  };

  const handleApprove = async (proposal: GearProposal) => {
    try {
      const filteredPayload = buildSelectedPayload(proposal);
      console.log("filteredPayload", filteredPayload);
      // Call API with filtered payload
      const res = await fetch(
        `/api/admin/gear-proposals/${proposal.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: filteredPayload }),
        },
      );
      if (res.ok) {
        // Reflect status and filtered payload locally
        setProposals((prev) =>
          prev.map((p) =>
            p.id === proposal.id
              ? { ...p, status: "APPROVED", payload: filteredPayload }
              : p,
          ),
        );
      } else {
        console.error("Approve failed", await res.text());
      }
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

  if (loading) {
    return <div className="py-8 text-center">Loading proposals...</div>;
  }

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
