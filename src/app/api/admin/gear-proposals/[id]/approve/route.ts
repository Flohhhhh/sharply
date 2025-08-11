import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { gearEdits, gear, cameraSpecs, lensSpecs } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    // TODO: Add proper admin role check
    if (!session?.user) {
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

    // Start a transaction
    await db.transaction(async (tx) => {
      // Update the proposal status to APPROVED
      await tx
        .update(gearEdits)
        .set({ status: "APPROVED" })
        .where(eq(gearEdits.id, proposalId));

      // Apply the changes to the gear
      if (
        proposalData.payload &&
        typeof proposalData.payload === "object" &&
        "core" in proposalData.payload
      ) {
        const payload = proposalData.payload as {
          core?: any;
          camera?: any;
          lens?: any;
        };
        if (payload.core) {
          await tx
            .update(gear)
            .set(payload.core)
            .where(eq(gear.id, proposalData.gearId));
        }

        // Apply camera specs if they exist
        if (payload.camera) {
          await tx
            .update(cameraSpecs)
            .set(payload.camera)
            .where(eq(cameraSpecs.gearId, proposalData.gearId));
        }

        // Apply lens specs if they exist
        if (payload.lens) {
          await tx
            .update(lensSpecs)
            .set(payload.lens)
            .where(eq(lensSpecs.gearId, proposalData.gearId));
        }
      }

      // Set all other pending proposals for the same gear to MERGED
      await tx
        .update(gearEdits)
        .set({ status: "MERGED" })
        .where(
          and(
            eq(gearEdits.gearId, proposalData.gearId),
            eq(gearEdits.status, "PENDING"),
            eq(gearEdits.id, proposalId),
          ),
        );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to approve proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
