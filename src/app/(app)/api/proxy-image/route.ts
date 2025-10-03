import { NextRequest } from "next/server";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return new Response("Missing src", { status: 400 });
  }

  try {
    const url = new URL(src);
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
      return new Response("Invalid protocol", { status: 400 });
    }

    const upstream = await fetch(url.toString(), {
      cache: "force-cache",
      redirect: "follow",
    });

    if (!upstream.ok) {
      return new Response("Upstream error", { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Bad src", { status: 400 });
  }
}
