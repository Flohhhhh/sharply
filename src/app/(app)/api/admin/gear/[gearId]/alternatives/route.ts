import { NextRequest, NextResponse } from "next/server";
import {
  fetchGearAlternatives,
  addGearAlternative,
  removeGearAlternative,
  updateGearAlternative,
} from "~/server/admin/gear-alternatives/service";
import { z } from "zod";

const addAlternativeSchema = z.object({
  alternativeGearId: z.string().min(1),
  isDirectCompetitor: z.boolean(),
});

const removeAlternativeSchema = z.object({
  alternativeGearId: z.string().min(1),
});

const updateAlternativeSchema = z.object({
  alternativeGearId: z.string().min(1),
  isDirectCompetitor: z.boolean(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gearId: string }> },
) {
  try {
    const { gearId } = await params;
    const alternatives = await fetchGearAlternatives(gearId);
    return NextResponse.json({ alternatives });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: (error as { status: number }).status },
      );
    }
    console.error("Error fetching gear alternatives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gearId: string }> },
) {
  try {
    const { gearId } = await params;
    const body = await request.json();
    const validatedBody = addAlternativeSchema.parse(body);

    await addGearAlternative({
      gearId,
      alternativeGearId: validatedBody.alternativeGearId,
      isDirectCompetitor: validatedBody.isDirectCompetitor,
    });

    return NextResponse.json(
      { message: "Alternative added successfully" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    if (error && typeof error === "object" && "status" in error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: (error as { status: number }).status },
      );
    }
    console.error("Error adding gear alternative:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gearId: string }> },
) {
  try {
    const { gearId } = await params;
    const body = await request.json();
    const validatedBody = removeAlternativeSchema.parse(body);

    await removeGearAlternative({
      gearId,
      alternativeGearId: validatedBody.alternativeGearId,
    });

    return NextResponse.json(
      { message: "Alternative removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    if (error && typeof error === "object" && "status" in error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: (error as { status: number }).status },
      );
    }
    console.error("Error removing gear alternative:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gearId: string }> },
) {
  try {
    const { gearId } = await params;
    const body = await request.json();
    const validatedBody = updateAlternativeSchema.parse(body);

    await updateGearAlternative({
      gearId,
      alternativeGearId: validatedBody.alternativeGearId,
      isDirectCompetitor: validatedBody.isDirectCompetitor,
    });

    return NextResponse.json(
      { message: "Alternative updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    if (error && typeof error === "object" && "status" in error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: (error as { status: number }).status },
      );
    }
    console.error("Error updating gear alternative:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
