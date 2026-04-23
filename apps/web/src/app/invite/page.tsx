import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join FriendsCircle - Pakistan's University Social Platform",
  description:
    "Rate professors, buy & sell on campus, find roommates, share rides, access past papers, and connect with 10,000+ students from 15+ universities across Pakistan.",
  openGraph: {
    title: "Join FriendsCircle \uD83C\uDF93",
    description:
      "Pakistan's #1 university social platform. Rate professors, buy & sell, find roommates, share rides, and more!",
    url: "https://friendscircle.app/invite",
    siteName: "FriendsCircle",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join FriendsCircle",
    description:
      "Pakistan's #1 university social platform for students.",
  },
};

const FEATURES = [
  {
    emoji: "\uD83C\uDF93",
    title: "Rate Professors",
    desc: "Share honest reviews and help fellow students pick the best teachers.",
    color: "#6C5CE7",
  },
  {
    emoji: "\uD83D\uDED2",
    title: "Student OLX",
    desc: "Buy and sell textbooks, gadgets, and more within your campus community.",
    color: "#FF6B6B",
  },
  {
    emoji: "\uD83C\uDFE0",
    title: "Find Roommates",
    desc: "Match with compatible roommates based on habits and preferences.",
    color: "#00CEC9",
  },
  {
    emoji: "\uD83D\uDE97",
    title: "Share Rides",
    desc: "Split rides to campus, airports, and weekend trips. Save money together.",
    color: "#FDCB6E",
  },
  {
    emoji: "\uD83D\uDCDA",
    title: "Past Papers",
    desc: "Access a shared library of past papers and study resources.",
    color: "#55EFC4",
  },
  {
    emoji: "\uD83C\uDF1F",
    title: "Campus Events",
    desc: "Discover events, hackathons, workshops, and social gatherings.",
    color: "#A29BFE",
  },
];

const STATS = [
  { value: "10,000+", label: "Students" },
  { value: "15+", label: "Universities" },
  { value: "6", label: "Major Cities" },
];

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
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

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6">
          <div className="text-6xl">{"\uD83C\uDF93"}</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight">
            Your campus life,
            <br />
            <span className="text-gradient">all in one place</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            FriendsCircle is Pakistan&apos;s #1 university social platform. Connect with students,
            rate professors, buy &amp; sell, find roommates, and so much more.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 pt-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gradient">{stat.value}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <a
              href="https://apps.apple.com/app/friendscircle"
              className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-button font-medium hover:opacity-90 transition-opacity"
            >
              {"\uD83C\uDF4E"} App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.friendscircle"
              className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-button font-medium hover:opacity-90 transition-opacity"
            >
              {"\u25B6\uFE0F"} Google Play
            </a>
          </div>
        </section>

        {/* Features grid */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Everything students need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-card p-6 border border-border bg-surface hover:bg-surface-light transition-colors"
              >
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-lg font-semibold text-text-primary">{f.title}</h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Universities section */}
        <section className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-text-primary">
            Students from 15+ universities
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            LUMS, NUST, FAST, COMSATS, UET, GCU, PIEAS, QAU, IBA, NED, UCP, GIKI, IST, AKU, and more universities
            across Lahore, Islamabad, Karachi, Peshawar, and Faisalabad.
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="rounded-card gradient-primary p-10 text-center space-y-5">
          <h2 className="text-3xl font-bold text-white">
            Ready to join?
          </h2>
          <p className="text-white/70 max-w-md mx-auto">
            Download FriendsCircle and connect with your campus community today. It&apos;s free!
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
