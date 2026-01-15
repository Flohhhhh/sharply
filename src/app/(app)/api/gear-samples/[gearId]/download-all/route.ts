import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { fetchSamplesByGearId } from "~/server/gear-samples/service";
import { fetchGearMetadataById } from "~/server/gear/data";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ gearId: string }> },
) {
  try {
    const { gearId } = await context.params;

    const [samples, gear] = await Promise.all([
      fetchSamplesByGearId(gearId),
      fetchGearMetadataById(gearId),
    ]);

    if (samples.length === 0) {
      return NextResponse.json({ error: "No samples found" }, { status: 404 });
    }

    // Create zip archive
    const zip = new JSZip();

    // Fetch all files and add to zip
    await Promise.all(
      samples.map(async (sample) => {
        try {
          const response = await fetch(sample.fileUrl);
          if (!response.ok) {
            console.error(`Failed to fetch ${sample.fileName}: ${response.statusText}`);
            return;
          }
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          zip.file(sample.fileName, buffer);
        } catch (error) {
          console.error(`Error fetching ${sample.fileName}:`, error);
        }
      }),
    );

    const zipBlob = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBlob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${gear.slug}-samples.zip"`,
      },
    });
  } catch (error) {
    console.error("Zip download error:", error);
    return NextResponse.json(
      { error: "Zip creation failed" },
      { status: 500 },
    );
  }
}
