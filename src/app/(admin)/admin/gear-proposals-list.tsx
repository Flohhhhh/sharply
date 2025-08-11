"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Check, X } from "lucide-react";

interface GearProposal {
  id: string;
  gearId: string;
  gearName: string;
  gearSlug: string;
  createdById: string;
  createdByName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  payload: {
    core?: Record<string, any>;
    camera?: Record<string, any>;
    lens?: Record<string, any>;
  };
  note?: string;
  createdAt: string;
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

  useEffect(() => {
    // Simulate loading and then show test data
    const timer = setTimeout(() => {
      setProposals(TEST_DATA);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch("/api/admin/gear-proposals");
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
      // Fallback to test data if API fails
      setProposals(TEST_DATA);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <Card key={proposal.id}>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header with gear info and status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{proposal.gearName}</h3>
                  <p className="text-muted-foreground text-sm">
                    Proposed by {proposal.createdByName}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(proposal.status)}
                  <div className="text-muted-foreground text-sm">
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Note if present */}
              {proposal.note && (
                <div className="border-input bg-muted rounded border p-3 text-sm">
                  <span className="font-medium">Note:</span> {proposal.note}
                </div>
              )}

              {/* Proposed Changes */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Proposed Changes:</h4>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  {proposal.payload.core && (
                    <div className="border-input bg-muted rounded border p-3">
                      <div className="mb-2 font-medium">Core Specs</div>
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(proposal.payload.core, null, 2)}
                      </pre>
                    </div>
                  )}
                  {proposal.payload.camera && (
                    <div className="border-input bg-muted rounded border p-3">
                      <div className="mb-2 font-medium">Camera Specs</div>
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(proposal.payload.camera, null, 2)}
                      </pre>
                    </div>
                  )}
                  {proposal.payload.lens && (
                    <div className="border-input bg-muted rounded border p-3">
                      <div className="mb-2 font-medium">Lens Specs</div>
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(proposal.payload.lens, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {proposal.status === "PENDING" && (
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(proposal.id, "reject")}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(proposal.id, "approve")}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
