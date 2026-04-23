import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ── Supabase config ────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  points: number;
  level: string;
  interests: string[];
  created_at: string;
  universities: { name: string; short_name: string; city: string } | null;
}

// ── Level helpers ──────────────────────────────────────────────────
const LEVEL_ICONS: Record<string, string> = {
  Freshman: "\uD83C\uDF31",
  Sophomore: "\uD83C\uDF3F",
  Junior: "\u26A1",
  Senior: "\uD83D\uDD25",
  Alumni: "\uD83D\uDC8E",
  Legend: "\uD83D\uDC51",
};

const LEVEL_COLORS: Record<string, string> = {
  Freshman: "#B0B0CC",
  Sophomore: "#55EFC4",
  Junior: "#6C5CE7",
  Senior: "#FDCB6E",
  Alumni: "#FF6B6B",
  Legend: "#A29BFE",
};

async function fetchCount(
  table: string,
  column: string,
  userId: string,
): Promise<number> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${userId}&select=id`,
      {
        headers: { ...supabaseHeaders, Prefer: "count=exact", Range: "0-0" },
      },
    );
    const range = res.headers.get("content-range");
    if (!range) return 0;
    const total = range.split("/")[1];
    return total ? parseInt(total, 10) : 0;
  } catch {
    return 0;
  }
}

// ── Image generator ────────────────────────────────────────────────
export default async function OGImage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  // Fetch profile
  let profile: ProfileRow | null = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*,universities(name,short_name,city)`,
      { headers: supabaseHeaders },
    );
    if (res.ok) {
      const rows: ProfileRow[] = await res.json();
      profile = rows[0] ?? null;
    }
  } catch {
    // fall through to fallback
  }

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

  // Fallback if profile not found
  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1A1235, #0F0F1A)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>{"\uD83C\uDF93"}</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#FFFFFF" }}>
            FriendsCircle
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#B0B0CC",
              marginTop: 12,
            }}
          >
            Pakistan&apos;s #1 University Social Platform
          </div>
        </div>
      ),
      {
        ...size,
        fonts: interFont
          ? [{ name: "Inter", data: interFont, style: "normal" as const, weight: 700 as const }]
          : [],
      },
    );
  }

  const [postsCount, commentsCount] = await Promise.all([
    fetchCount("posts", "user_id", userId),
    fetchCount("comments", "user_id", userId),
  ]);

  const levelColor = LEVEL_COLORS[profile.level] ?? "#B0B0CC";
  const levelIcon = LEVEL_ICONS[profile.level] ?? "\uD83C\uDF31";
  const initials = profile.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const bio = profile.bio
    ? profile.bio.length > 120
      ? profile.bio.slice(0, 117) + "..."
      : profile.bio
    : null;

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
        {/* Decorative accent circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `${levelColor}10`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "#6C5CE708",
            display: "flex",
          }}
        />

        {/* Top bar: branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "28px 48px 0 48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{"\uD83C\uDF93"}</span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                background: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              FriendsCircle
            </span>
          </div>
          <span style={{ fontSize: 14, color: "#6C6C8A" }}>
            friendscircle.app
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "32px 48px",
            gap: 40,
            alignItems: "center",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              display: "flex",
              flexShrink: 0,
            }}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                width={160}
                height={160}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `4px solid ${levelColor}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${levelColor}, ${levelColor}70)`,
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#FFFFFF",
                }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 12,
              minWidth: 0,
            }}
          >
            {/* Name */}
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile.full_name}
            </div>

            {/* Level + Uni */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: `${levelColor}20`,
                  border: `1px solid ${levelColor}40`,
                }}
              >
                <span style={{ fontSize: 18 }}>{levelIcon}</span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: levelColor,
                  }}
                >
                  {profile.level}
                </span>
              </div>

              {profile.universities && (
                <span style={{ fontSize: 18, color: "#B0B0CC" }}>
                  {"\uD83C\uDFEB"} {profile.universities.short_name}
                  {profile.universities.city
                    ? ` \u2022 ${profile.universities.city}`
                    : ""}
                </span>
              )}
            </div>

            {/* Bio */}
            {bio && (
              <div
                style={{
                  fontSize: 18,
                  color: "#8888AA",
                  lineHeight: 1.4,
                  marginTop: 4,
                }}
              >
                &ldquo;{bio}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Bottom stats strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 48px 0 48px",
            marginBottom: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 32,
            }}
          >
            {[
              { label: "XP", value: profile.points, color: "#FDCB6E" },
              { label: "Posts", value: postsCount, color: "#6C5CE7" },
              { label: "Comments", value: commentsCount, color: "#00CEC9" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 28,
                    borderRadius: 2,
                    background: stat.color,
                    display: "flex",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    {stat.value}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6C6C8A",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brand bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 48px",
            borderTop: "1px solid #2D2D4A",
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: 14, color: "#6C6C8A" }}>
            Pakistan&apos;s #1 University Social Platform
          </span>
          <div
            style={{
              width: 40,
              height: 3,
              borderRadius: 2,
              background: "#6C5CE7",
              marginLeft: 12,
              display: "flex",
            }}
          />
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
