import { NextResponse } from "next/server";
import { getSessionOrThrow } from "~/server/auth";
import { deleteExifTrackedReading } from "~/server/exif-tracking/service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ readingId: string }> },
) {
  try {
    const { user } = await getSessionOrThrow();
    const { readingId } = await params;

    const result = await deleteExifTrackedReading({
      userId: user.id,
      readingId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete EXIF tracking history.";

    return NextResponse.json(
      {
        ok: false,
        message,
        deletedReadingId: null,
        trackedCamera: null,
        matchedGear: null,
      },
      { status },
    );
  }
}
