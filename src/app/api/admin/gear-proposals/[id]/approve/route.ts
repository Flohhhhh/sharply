import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { normalizeProposalPayloadForDb } from "~/server/db/normalizers";
import {
  gearEdits,
  gear,
  cameraSpecs,
  lensSpecs,
  auditLogs,
} from "~/server/db/schema";
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

    // Parse optional filtered payload from admin UI
    let filteredPayload: { core?: any; camera?: any; lens?: any } | undefined;
    try {
      const json = await request.json().catch(() => undefined);
      if (json && typeof json === "object" && "payload" in json) {
        filteredPayload = (json as any).payload;
      }
    } catch {}

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
      // Determine final payload (filtered if provided) and normalize to DB types
      const source = filteredPayload ?? proposalData.payload;
      const normalized = normalizeProposalPayloadForDb(source as any);

      // Update the proposal status to APPROVED and persist only the applied changes
      await tx
        .update(gearEdits)
        .set({ status: "APPROVED", payload: normalized || {} })
        .where(eq(gearEdits.id, proposalId));

      // Audit: approved
      await tx.insert(auditLogs).values({
        action: "GEAR_EDIT_APPROVE",
        actorUserId: session.user.id,
        gearId: proposalData.gearId,
        gearEditId: proposalId,
      });

      // Apply the changes to the gear
      if (normalized && typeof normalized === "object") {
        const payload = normalized as { core?: any; camera?: any; lens?: any };
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

      // Audit: merged others (self-noted)
      await tx.insert(auditLogs).values({
        action: "GEAR_EDIT_MERGE",
        actorUserId: session.user.id,
        gearId: proposalData.gearId,
        gearEditId: proposalId,
      });
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
