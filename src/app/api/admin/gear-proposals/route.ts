import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { gearEdits, gear, users } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // TODO: Add proper admin role check
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all gear edits with related data
    const proposals = await db
      .select({
        id: gearEdits.id,
        gearId: gearEdits.gearId,
        gearName: gear.name,
        gearSlug: gear.slug,
        createdById: gearEdits.createdById,
        createdByName: users.name,
        status: gearEdits.status,
        payload: gearEdits.payload,
        note: gearEdits.note,
        createdAt: gearEdits.createdAt,
      })
      .from(gearEdits)
      .innerJoin(gear, eq(gearEdits.gearId, gear.id))
      .innerJoin(users, eq(gearEdits.createdById, users.id))
      .orderBy(desc(gearEdits.createdAt));

    // Group proposals by gear
    const groupedProposals = proposals.reduce(
      (acc, proposal) => {
        const existingGroup = acc.find(
          (group) => group.gearId === proposal.gearId,
        );

        if (existingGroup) {
          existingGroup.proposals.push(proposal);
        } else {
          acc.push({
            gearId: proposal.gearId,
            gearName: proposal.gearName,
            gearSlug: proposal.gearSlug,
            proposals: [proposal],
          });
        }

        return acc;
      },
      [] as Array<{
        gearId: string;
        gearName: string;
        gearSlug: string;
        proposals: typeof proposals;
      }>,
    );

    // Sort groups by most recent proposal
    groupedProposals.sort((a, b) => {
      const aLatest = Math.max(
        ...a.proposals.map((p) => new Date(p.createdAt).getTime()),
      );
      const bLatest = Math.max(
        ...b.proposals.map((p) => new Date(p.createdAt).getTime()),
      );
      return bLatest - aLatest;
    });

    return NextResponse.json(groupedProposals);
  } catch (error) {
    console.error("Failed to fetch gear proposals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
