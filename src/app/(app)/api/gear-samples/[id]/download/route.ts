import { NextRequest, NextResponse } from "next/server";
import {
  getSampleFileById,
  trackSampleDownload,
} from "~/server/gear-samples/service";
import { auth } from "~/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const file = await getSampleFileById(id);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get user session if available (optional for downloads)
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    // Increment download count
    await trackSampleDownload(id, userId);

    // Redirect to UploadThing URL
    return NextResponse.redirect(file.fileUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 },
    );
  }
}
