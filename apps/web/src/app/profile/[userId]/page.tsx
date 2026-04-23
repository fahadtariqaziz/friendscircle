import type { Metadata } from "next";
import { notFound } from "next/navigation";

// ── Supabase helpers ───────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
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

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*,universities(name,short_name,city)`,
    { headers, next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  const rows: ProfileRow[] = await res.json();
  return rows[0] ?? null;
}

async function fetchCount(table: string, column: string, userId: string): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${userId}&select=id`,
    {
      headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
      next: { revalidate: 300 },
    },
  );
  const range = res.headers.get("content-range");
  if (!range) return 0;
  const total = range.split("/")[1];
  return total ? parseInt(total, 10) : 0;
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

// ── Metadata ───────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const profile = await fetchProfile(userId);

  if (!profile) {
    return {
      title: "Profile Not Found | FriendsCircle",
      description: "This profile could not be found. Join FriendsCircle today!",
    };
  }

  const name = profile.full_name || "Student";
  const uni = profile.universities?.short_name ?? "";
  const description = profile.bio
    ? `${profile.bio.slice(0, 140)}${profile.bio.length > 140 ? "..." : ""}`
    : `${name} is a ${profile.level} on FriendsCircle${uni ? ` from ${uni}` : ""}. Join the community!`;

  return {
    title: `${name} | FriendsCircle`,
    description,
    openGraph: {
      title: `${name} ${LEVEL_ICONS[profile.level] ?? ""} on FriendsCircle`,
      description,
      url: `https://friendscircle.app/profile/${userId}`,
      siteName: "FriendsCircle",
      type: "profile",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} on FriendsCircle`,
      description,
    },
  };
}

// ── Features grid ──────────────────────────────────────────────────
const FEATURES = [
  { emoji: "\uD83C\uDF93", title: "Rate Professors", desc: "Share honest teacher reviews" },
  { emoji: "\uD83D\uDED2", title: "Student OLX", desc: "Buy & sell on campus" },
  { emoji: "\uD83C\uDFE0", title: "Find Roommates", desc: "Match with compatible roomies" },
  { emoji: "\uD83D\uDE97", title: "Share Rides", desc: "Split rides & save money" },
  { emoji: "\uD83D\uDCDA", title: "Past Papers", desc: "Access study resources" },
  { emoji: "\uD83C\uDF1F", title: "Campus Events", desc: "Discover what\u2019s happening" },
];

// ── Page component ─────────────────────────────────────────────────
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const profile = await fetchProfile(userId);

  // Profile not found -- show generic download page
  if (!profile) {
    return <GenericDownloadPage />;
  }

  const [postsCount, commentsCount] = await Promise.all([
    fetchCount("posts", "user_id", userId),
    fetchCount("comments", "user_id", userId),
  ]);

  const levelIcon = LEVEL_ICONS[profile.level] ?? "\uD83C\uDF31";
  const levelColor = LEVEL_COLORS[profile.level] ?? "#B0B0CC";
  const initials = profile.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{"\uD83C\uDF93"}</span>
          <span className="text-xl font-bold text-gradient">FriendsCircle</span>
        </div>
        <a
          href="https://friendscircle.app"
          className="text-sm text-primary hover:text-primary-light transition-colors"
        >
          Open App
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Profile Card */}
        <section className="rounded-card p-8 border border-border relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${levelColor}15, #1A1A2E 50%, #0F0F1A)` }}
        >
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-24 h-24 rounded-full object-cover border-2"
                style={{ borderColor: levelColor }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: `linear-gradient(135deg, ${levelColor}, ${levelColor}70)` }}
              >
                {initials}
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-3xl font-bold text-text-primary truncate">
                {profile.full_name}
              </h1>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Level badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-sm font-semibold"
                  style={{
                    backgroundColor: `${levelColor}20`,
                    color: levelColor,
                    border: `1px solid ${levelColor}40`,
                  }}
                >
                  {levelIcon} {profile.level}
                </span>

                {/* University */}
                {profile.universities && (
                  <span className="text-sm text-text-secondary">
                    {"\uD83C\uDFEB"} {profile.universities.short_name}
                    {profile.universities.city ? ` \u2022 ${profile.universities.city}` : ""}
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="text-text-secondary text-sm leading-relaxed mt-2">
                  &ldquo;{profile.bio}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: "XP", value: profile.points, emoji: "\u26A1", color: "#FDCB6E" },
              { label: "Posts", value: postsCount, emoji: "\uD83D\uDCDD", color: "#6C5CE7" },
              { label: "Comments", value: commentsCount, emoji: "\uD83D\uDCAC", color: "#00CEC9" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-button p-4 text-center border border-border"
                style={{ background: `${stat.color}08` }}
              >
                <span className="text-lg">{stat.emoji}</span>
                <div className="text-2xl font-bold text-text-primary mt-1">{stat.value}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="text-xs px-3 py-1 rounded-pill border border-border text-text-secondary"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">
            What is FriendsCircle?
          </h2>
          <p className="text-text-secondary mb-6">
            Pakistan&apos;s #1 university social platform. Everything students need, in one place.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-card p-4 border border-border bg-surface hover:bg-surface-light transition-colors"
              >
                <span className="text-2xl">{f.emoji}</span>
                <h3 className="text-sm font-semibold text-text-primary mt-2">{f.title}</h3>
                <p className="text-xs text-text-muted mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-card gradient-primary p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Join {profile.full_name.split(" ")[0]} on FriendsCircle
          </h2>
          <p className="text-white/70 max-w-md mx-auto">
            Connect with students from 15+ universities across Pakistan. Download the app to get started.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="https://apps.apple.com/app/friendscircle"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-button font-medium transition-colors"
            >
              {"\uD83C\uDF4E"} App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.friendscircle"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-button font-medium transition-colors"
            >
              {"\u25B6\uFE0F"} Google Play
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-text-muted text-sm">
          {"\uD83C\uDF93"} FriendsCircle &mdash; Pakistan&apos;s University Social Platform
        </p>
      </footer>
    </div>
  );
}

// ── Fallback page when profile is not found ────────────────────────
function GenericDownloadPage() {
  return (
    <div className="min-h-screen bg-surface-dark">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{"\uD83C\uDF93"}</span>
          <span className="text-xl font-bold text-gradient">FriendsCircle</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="text-6xl">{"\uD83C\uDF93"}</div>
        <h1 className="text-3xl font-bold text-text-primary">
          Profile Not Found
        </h1>
        <p className="text-text-secondary max-w-md mx-auto">
          This profile may have been removed or doesn&apos;t exist. Join FriendsCircle to connect with students across Pakistan!
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://apps.apple.com/app/friendscircle"
            className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-button font-medium"
          >
            {"\uD83C\uDF4E"} App Store
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.friendscircle"
            className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-button font-medium"
          >
            {"\u25B6\uFE0F"} Google Play
          </a>
        </div>
      </main>
    </div>
  );
}
