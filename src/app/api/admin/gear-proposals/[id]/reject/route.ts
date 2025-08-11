import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { gearEdits } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // TODO: Add proper admin role check
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposalId = params.id;

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

    const proposalData = proposal[0];

    if (proposalData.status !== "PENDING") {
      return NextResponse.json(
        { error: "Proposal is not pending" },
        { status: 400 },
      );
    }

    // Update the proposal status to REJECTED
    await db
      .update(gearEdits)
      .set({ status: "REJECTED" })
      .where(eq(gearEdits.id, proposalId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reject proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
