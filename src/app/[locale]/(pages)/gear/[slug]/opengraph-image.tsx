import { ImageResponse } from "next/og";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { resolveRegionFromCountryCode } from "~/lib/gear/region";
import { fetchGearBySlug } from "~/server/gear/service";

export const runtime = "nodejs";
export const revalidate = 3600;
export const dynamicParams = true;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const OG_BACKGROUND = "#18181b";
const OG_PADDING = "32px";

type GearOgImageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function renderFallbackImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: OG_BACKGROUND,
      }}
    />,
    size,
  );
}

async function resolveOgImageSource(thumbnailUrl: string) {
  try {
    const response = await fetch(thumbnailUrl);

    if (!response.ok) {
      return null;
    }

    const sourceBuffer = Buffer.from(await response.arrayBuffer());
    const { default: sharp } = await import("sharp");
    const pngBuffer = await sharp(sourceBuffer).png().toBuffer();

    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function GearOgImage({ params }: GearOgImageProps) {
  const { slug } = await params;
  const viewerRegion = resolveRegionFromCountryCode(null);
  const gear = await fetchGearBySlug(slug).catch(() => null);

  if (!gear?.thumbnailUrl) {
    return renderFallbackImage();
  }

  const displayName = GetGearDisplayName(
    {
      name: gear.name,
      regionalAliases: gear.regionalAliases ?? [],
    },
    { region: viewerRegion },
  );
  const imageSource = await resolveOgImageSource(gear.thumbnailUrl);

  if (!imageSource) {
    return renderFallbackImage();
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: OG_BACKGROUND,
        padding: OG_PADDING,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={imageSource}
          alt={displayName}
          width={1136}
          height={566}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>,
    size,
  );
}
