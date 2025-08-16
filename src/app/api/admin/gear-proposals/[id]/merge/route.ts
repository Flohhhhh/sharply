import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { gearEdits, auditLogs } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    // Role check: require EDITOR or ADMIN
    if (
      !session?.user ||
      !["ADMIN", "EDITOR"].includes((session.user as any).role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: proposalId } = await params;

    // Get the proposal
    const proposal = await db
      .select()
      .from(gearEdits)
      .where(eq(gearEdits.id, proposalId))
      .limit(1);

    if (proposal.length === 0) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    const proposalData = proposal[0]!;

    if (proposalData.status !== "PENDING") {
      return NextResponse.json(
        { error: "Proposal is not pending" },
        { status: 400 },
      );
    }

    // Update the proposal status to MERGED
    await db
      .update(gearEdits)
      .set({ status: "MERGED" })
      .where(eq(gearEdits.id, proposalId));

    // Audit: merged
    try {
      await db.insert(auditLogs).values({
        action: "GEAR_EDIT_MERGE",
        actorUserId: session.user.id,
        gearEditId: proposalId,
        gearId: proposalData.gearId,
      });
    } catch (e) {
      console.warn("[merge POST] audit log failed", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to merge proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
