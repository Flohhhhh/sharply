import { NextResponse } from "next/server";
import { getSessionOrThrow } from "~/server/auth";
import { fetchTrackedCameraHistory } from "~/server/exif-tracking/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackedCameraId: string }> },
) {
  try {
    const { user } = await getSessionOrThrow();
    const { trackedCameraId } = await params;

    const history = await fetchTrackedCameraHistory({
      userId: user.id,
      trackedCameraId,
    });

    return NextResponse.json(history);
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
        : "Failed to load EXIF tracking history.";

    return NextResponse.json(
      {
        ok: false,
        trackedCamera: null,
        readings: [],
        message,
      },
      { status },
    );
  }
}
