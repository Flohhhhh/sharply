import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionOrThrow } from "~/server/auth";
import { saveExifTrackingCandidate } from "~/server/exif-tracking/service";

const saveExifTrackingSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { user } = await getSessionOrThrow();
    const json = await request.json();
    const { token } = saveExifTrackingSchema.parse(json);

    const result = await saveExifTrackingCandidate({
      userId: user.id,
      token,
    });

    return NextResponse.json(result);
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : error instanceof z.ZodError
          ? 400
          : 500;

    const message =
      error instanceof z.ZodError
        ? "Invalid EXIF tracking payload."
        : error instanceof Error
          ? error.message
          : "Failed to save EXIF tracking history.";

    return NextResponse.json(
      {
        ok: false,
        message,
        tracking: null,
      },
      { status },
    );
  }
}
