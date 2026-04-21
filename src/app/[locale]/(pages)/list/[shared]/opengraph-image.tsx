import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchPublicSharedListByParam } from "~/server/user-lists/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const ARCHIVO_500_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/archivo@latest/latin-500-normal.woff";
const ARCHIVO_700_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/archivo@latest/latin-700-normal.woff";

const GRADIENT_PALETTES = [
  ["rgba(252, 231, 243, 0.68)", "rgba(219, 234, 254, 0.36)"],
  ["rgba(254, 240, 138, 0.58)", "rgba(191, 219, 254, 0.34)"],
  ["rgba(224, 231, 255, 0.62)", "rgba(254, 205, 211, 0.36)"],
  ["rgba(220, 252, 231, 0.58)", "rgba(216, 180, 254, 0.34)"],
  ["rgba(255, 228, 230, 0.62)", "rgba(186, 230, 253, 0.34)"],
  ["rgba(254, 243, 199, 0.58)", "rgba(221, 214, 254, 0.34)"],
] as const;

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: number) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function getTitleSize(title: string) {
  if (title.length <= 24) return 112;
  if (title.length <= 44) return 94;
  if (title.length <= 72) return 78;
  return 64;
}

let archivoFontPromise: Promise<{
  medium: ArrayBuffer;
  bold: ArrayBuffer;
} | null> | null = null;
let patternWavesDataUrlPromise: Promise<string | null> | null = null;

async function getArchivoFonts() {
  if (!archivoFontPromise) {
    archivoFontPromise = (async () => {
      try {
        const [mediumResponse, boldResponse] = await Promise.all([
          fetch(ARCHIVO_500_FONT_URL),
          fetch(ARCHIVO_700_FONT_URL),
        ]);

        if (!mediumResponse.ok || !boldResponse.ok) {
          throw new Error("Unable to fetch Archivo font files");
        }

        const [medium, bold] = await Promise.all([
          mediumResponse.arrayBuffer(),
          boldResponse.arrayBuffer(),
        ]);

        return { medium, bold };
      } catch {
        return null;
      }
    })();
  }

  return archivoFontPromise;
}

async function getPatternWavesDataUrl() {
  if (!patternWavesDataUrlPromise) {
    patternWavesDataUrlPromise = (async () => {
      try {
        const rawSvg = await readFile(
          join(process.cwd(), "public", "pattern-waves.svg"),
          "utf8",
        );

        // Satori/resvg expects an intrinsic SVG viewport for data URL images.
        const svgOpenTagMatch = rawSvg.match(/<svg\b[^>]*>/i);
        if (!svgOpenTagMatch?.[0]) return null;

        const originalOpenTag = svgOpenTagMatch[0];
        const normalizedOpenTag = originalOpenTag
          .replace(/\swidth=(["']).*?\1/gi, "")
          .replace(/\sheight=(["']).*?\1/gi, "")
          .replace(/\sviewBox=(["']).*?\1/gi, "")
          .replace(
            /\s*>$/,
            ' width="1200" height="630" viewBox="0 0 1200 630">',
          );
        const normalizedSvg = rawSvg.replace(
          originalOpenTag,
          normalizedOpenTag,
        );

        return `data:image/svg+xml;base64,${Buffer.from(normalizedSvg).toString("base64")}`;
      } catch {
        return null;
      }
    })();
  }

  return patternWavesDataUrlPromise;
}

type OgImageProps = {
  params: Promise<{ shared: string }>;
};

export default async function OgImage({ params }: OgImageProps) {
  const { shared } = await params;
  const payload = await fetchPublicSharedListByParam(shared).catch(() => null);

  if (!payload) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#0f172a",
          fontSize: 56,
          fontWeight: 700,
        }}
      >
        Sharply
      </div>,
      size,
    );
  }

  const ownerName =
    payload.owner.name || payload.owner.handle || "Sharply member";
  const seed = hashString(`${shared}:${payload.list.name}:${ownerName}`);
  const rng = createRng(seed);
  const gradientPalette =
    GRADIENT_PALETTES[Math.floor(rng() * GRADIENT_PALETTES.length)] ??
    GRADIENT_PALETTES[0];
  const titleSize = getTitleSize(payload.list.name);
  const footerText = `${ownerName}'s list on sharplyphoto.com`;
  const archivoFonts = await getArchivoFonts();
  const patternWavesDataUrl = await getPatternWavesDataUrl();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#ffffff",
        color: "#0f172a",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Archivo, Arial, sans-serif",
      }}
    >
      {patternWavesDataUrl ? (
        <img
          src={patternWavesDataUrl}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            left: "0px",
            top: "0px",
            right: "0px",
            bottom: "0px",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.75,
          }}
        />
      ) : null}

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "44px 56px",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Sharply
          </div>
        </div>

        <div
          style={{
            width: "100%",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: "980px",
              textAlign: "center",
              fontSize: titleSize,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              textWrap: "balance",
              color: "#0b1220",
            }}
          >
            {payload.list.name}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 34,
              fontWeight: 500,
              opacity: 0.78,
              textAlign: "center",
              textWrap: "balance",
              maxWidth: "1000px",
            }}
          >
            {footerText}
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: archivoFonts
        ? [
            {
              name: "Archivo",
              data: archivoFonts.medium,
              weight: 500,
              style: "normal",
            },
            {
              name: "Archivo",
              data: archivoFonts.bold,
              weight: 700,
              style: "normal",
            },
          ]
        : undefined,
    },
  );
}
