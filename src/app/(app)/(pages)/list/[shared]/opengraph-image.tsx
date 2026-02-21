import { ImageResponse } from "next/og";
import { fetchPublicSharedListByParam } from "~/server/user-lists/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{ shared: string }>;
};

export default async function OgImage({ params }: OgImageProps) {
  const { shared } = await params;
  const payload = await fetchPublicSharedListByParam(shared).catch(() => null);

  if (!payload) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111827",
            color: "white",
            fontSize: 56,
            fontWeight: 700,
          }}
        >
          Sharply
        </div>
      ),
      size,
    );
  }

  const ownerName = payload.owner.name || payload.owner.handle || "Sharply member";
  const initials = ownerName.slice(0, 2).toUpperCase();
  const ogItems = payload.items.slice(0, 6);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, rgb(15, 23, 42) 0%, rgb(2, 6, 23) 100%)",
          color: "white",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: 72,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: "-2px",
              maxWidth: "1000px",
            }}
          >
            {payload.list.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {payload.owner.image ? (
              <img
                src={payload.owner.image}
                alt={ownerName}
                width={54}
                height={54}
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "9999px",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.35)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.35)",
                }}
              >
                {initials}
              </div>
            )}
            <div style={{ fontSize: 28, opacity: 0.9 }}>{ownerName}</div>
          </div>
        </div>

        <div
          style={{
            marginTop: "32px",
            display: "flex",
            flexWrap: "wrap",
            columnGap: "16px",
            rowGap: "16px",
            width: "100%",
            zIndex: 1,
            position: "relative",
          }}
        >
          {ogItems.map((item) => (
            <div
              key={item.id}
              style={{
                width: "calc((100% - 32px) / 3)",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                height: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {item.gear.thumbnailUrl ? (
                <img
                  src={item.gear.thumbnailUrl}
                  alt={item.gear.name}
                  width={260}
                  height={150}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: "10px",
                  }}
                />
              ) : (
                <div style={{ fontSize: "24px", opacity: 0.65 }}>
                  {item.gear.name}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "220px",
            background:
              "linear-gradient(180deg, rgba(2, 6, 23, 0) 0%, rgba(2, 6, 23, 0.92) 70%)",
          }}
        />
      </div>
    ),
    size,
  );
}
