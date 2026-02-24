import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { deleteOwnReview, flagReview } from "~/server/gear/service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await flagReview(id);

    if (result.ok) {
      return NextResponse.json(
        { ok: true, type: "FLAG_CREATED", message: "Flag submitted." },
        { status: 201 },
      );
    }

    switch (result.type) {
      case "FLAG_ALREADY_OPEN":
        return NextResponse.json(
          { ok: false, type: "FLAG_ALREADY_OPEN", message: result.message },
          { status: 409 },
        );
      case "OWN_REVIEW":
        return NextResponse.json(
          { ok: false, type: "OWN_REVIEW", message: result.message },
          { status: 400 },
        );
      case "NOT_FLAGGABLE":
        return NextResponse.json(
          { ok: false, type: "NOT_FLAGGABLE", message: result.message },
          { status: 400 },
        );
      case "NOT_FOUND":
        return NextResponse.json(
          { ok: false, type: "NOT_FOUND", message: result.message },
          { status: 404 },
        );
      default:
        return NextResponse.json(
          { ok: false, type: "UNKNOWN", message: "Unexpected flag response." },
          { status: 500 },
        );
    }
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? Number((error as { status?: number }).status ?? 500)
        : 500;
    if (status === 401) {
      return NextResponse.json(
        { ok: false, type: "UNAUTHORIZED", message: "Unauthorized." },
        { status: 401 },
      );
    }
    console.error("Error flagging review:", error);
    return NextResponse.json(
      { ok: false, type: "INTERNAL_ERROR", message: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await deleteOwnReview(id);

    if (result.ok) {
      return NextResponse.json({ ok: true, type: "DELETED" }, { status: 200 });
    }

    switch (result.type) {
      case "FORBIDDEN":
        return NextResponse.json(
          { ok: false, type: "FORBIDDEN", message: result.message },
          { status: 403 },
        );
      case "NOT_FOUND":
        return NextResponse.json(
          { ok: false, type: "NOT_FOUND", message: result.message },
          { status: 404 },
        );
      default:
        return NextResponse.json(
          {
            ok: false,
            type: "UNKNOWN",
            message: "Unexpected delete response.",
          },
          { status: 500 },
        );
    }
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? Number((error as { status?: number }).status ?? 500)
        : 500;
    if (status === 401) {
      return NextResponse.json(
        { ok: false, type: "UNAUTHORIZED", message: "Unauthorized." },
        { status: 401 },
      );
    }
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { ok: false, type: "INTERNAL_ERROR", message: "Internal server error." },
      { status: 500 },
    );
  }
}
