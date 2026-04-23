import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FEATURES = [
  { emoji: "\uD83C\uDF93", label: "Rate Professors" },
  { emoji: "\uD83D\uDED2", label: "Student OLX" },
  { emoji: "\uD83C\uDFE0", label: "Roommates" },
  { emoji: "\uD83D\uDE97", label: "Share Rides" },
  { emoji: "\uD83D\uDCDA", label: "Past Papers" },
  { emoji: "\uD83C\uDF1F", label: "Events" },
];

export default async function OGImage() {
  // Load Inter font
  let interFont: ArrayBuffer | undefined;
  try {
    const fontRes = await fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
    );
    interFont = await fontRes.arrayBuffer();
  } catch {
    // system font fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #1A1235 0%, #0F0F1A 50%, #0D0D18 100%)",
          fontFamily: "Inter, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "#6C5CE710",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "#00CEC908",
            display: "flex",
          }}
        />

        {/* Top branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "36px 48px 0 48px",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 36 }}>{"\uD83C\uDF93"}</span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              background: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            FriendsCircle
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "24px 48px",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.15,
            }}
          >
            Pakistan&apos;s #1 University
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              background: "linear-gradient(135deg, #6C5CE7, #A29BFE, #00CEC9)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1.15,
            }}
          >
            Social Platform
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#B0B0CC",
              marginTop: 8,
            }}
          >
            Join 10,000+ students from 15+ universities
          </div>
        </div>

        {/* Features grid */}
        <div
          style={{
            display: "flex",
            padding: "8px 48px",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 12,
                background: "#1A1A2E",
                border: "1px solid #2D2D4A",
              }}
            >
              <span style={{ fontSize: 22 }}>{f.emoji}</span>
              <span style={{ fontSize: 16, color: "#FFFFFF", fontWeight: 500 }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 48px",
            marginTop: "auto",
            borderTop: "1px solid #2D2D4A",
            height: 56,
          }}
        >
          <span style={{ fontSize: 14, color: "#6C6C8A" }}>
            friendscircle.app/invite
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: "#6C6C8A" }}>
              Available on iOS &amp; Android
            </span>
            <div
              style={{
                width: 40,
                height: 3,
                borderRadius: 2,
                background: "#6C5CE7",
                display: "flex",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: interFont
        ? [
            {
              name: "Inter",
              data: interFont,
              style: "normal" as const,
              weight: 700 as const,
            },
          ]
        : [],
    },
  );
}
