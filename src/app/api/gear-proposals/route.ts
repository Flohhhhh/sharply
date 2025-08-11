import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { gearEdits } from "~/server/db/schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gearId, payload, note } = body;

    // Basic validation
    if (!gearId || !payload) {
      return NextResponse.json(
        { error: "Missing required fields: gearId and payload" },
        { status: 400 },
      );
    }

    // Validate payload structure (basic check)
    if (typeof payload !== "object" || payload === null) {
      return NextResponse.json(
        { error: "Payload must be a valid JSON object" },
        { status: 400 },
      );
    }

    // Create the gear proposal
    const proposal = await db
      .insert(gearEdits)
      .values({
        gearId,
        createdById: session.user.id,
        payload,
        note: note || null,
        status: "PENDING",
      })
      .returning();

    return NextResponse.json(
      {
        message: "Gear proposal created successfully",
        proposal: proposal[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create gear proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
