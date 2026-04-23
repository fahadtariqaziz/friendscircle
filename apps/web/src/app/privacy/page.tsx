import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | FriendsCircle",
  description:
    "Privacy Policy for FriendsCircle — learn how we collect, use, and protect your personal information on Pakistan's university social platform.",
  openGraph: {
    title: "Privacy Policy | FriendsCircle",
    description:
      "Privacy Policy for FriendsCircle — Pakistan's university social platform.",
    url: "https://friendscircle.app/privacy",
    siteName: "FriendsCircle",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | FriendsCircle",
    description:
      "Privacy Policy for FriendsCircle — Pakistan's university social platform.",
  },
};

const SECTIONS = [
  { id: "information-collected", title: "Information We Collect", number: 1 },
  { id: "how-we-use", title: "How We Use Information", number: 2 },
  { id: "information-sharing", title: "Information Sharing", number: 3 },
  { id: "data-storage", title: "Data Storage & Security", number: 4 },
  { id: "user-controls", title: "User Controls", number: 5 },
  { id: "cookies", title: "Cookies & Tracking", number: 6 },
  { id: "children", title: "Children's Privacy", number: 7 },
  { id: "push-notifications", title: "Push Notifications", number: 8 },
  { id: "changes", title: "Changes to Privacy Policy", number: 9 },
  { id: "contact", title: "Contact", number: 10 },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-dark">
      {/* ── Navigation ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface-dark/80 backdrop-blur-xl">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">{"\uD83C\uDF93"}</span>
            <span className="text-xl font-bold text-gradient">FriendsCircle</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-text-secondary hover:text-primary-light transition-colors flex items-center gap-1.5"
          >
            friendscircle.app
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight">
            Privacy Policy
          </h1>
          <div className="mt-4 h-1 w-20 rounded-full bg-primary" />
          <p className="mt-6 text-text-secondary text-lg">
            Last updated: April 2025
          </p>
          <p className="mt-3 text-text-muted text-sm leading-relaxed max-w-2xl">
            This Privacy Policy explains how FriendsCircle (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            &ldquo;our&rdquo;) collects, uses, stores, and protects your personal information when
            you use our mobile application, website, and related services. We are committed to
            safeguarding your privacy and handling your data with transparency and care.
          </p>
        </div>
      </section>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="flex gap-12">
          {/* Table of Contents — Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                Table of Contents
              </h2>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-text-secondary hover:text-primary-light transition-colors py-1.5 pl-3 border-l-2 border-border hover:border-primary"
                  >
                    <span className="text-text-muted mr-2">{s.number}.</span>
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Table of Contents — Mobile horizontal scroll */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border">
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-2 px-4 py-3 min-w-max">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-xs text-text-secondary hover:text-primary-light transition-colors whitespace-nowrap px-3 py-1.5 rounded-pill border border-border hover:border-primary"
                  >
                    {s.number}. {s.title}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-10 pb-20 lg:pb-0">
            {/* Section 1 */}
            <section id="information-collected" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">01</span>
                  Information We Collect
                </h2>
                <div className="mt-6 space-y-5 text-text-secondary text-sm leading-relaxed">
                  <p>We collect the following categories of information when you use FriendsCircle:</p>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">Account Information</h3>
                    <p>
                      When you create an account, we collect your email address, full name, and
                      authentication credentials. If you sign in through Google OAuth, we receive your
                      name, email address, and profile picture from Google. We also collect your
                      university affiliation, campus, bio, and interests as part of your profile setup.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">User-Generated Content</h3>
                    <p>
                      We store all content you create on the Platform, including posts (across all 11
                      post types), comments, teacher reviews, star ratings, marketplace listings,
                      friend circle conversations, and any images you upload. This content is necessary
                      to provide the core functionality of the Service.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">Usage Data</h3>
                    <p>
                      We collect information about how you interact with the Platform, including which
                      posts you like, comments you make, circles you join, search queries, and which
                      features you use most frequently. This data helps us improve the Service and
                      personalize your experience.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">Device Information</h3>
                    <p>
                      When you use the mobile app, we may collect your device type, operating system
                      version, and a push notification token (Expo Push Token) to deliver notifications
                      to your device. We do not collect device identifiers such as IMEI or hardware
                      serial numbers.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">Location Information</h3>
                    <p>
                      We do not collect precise GPS location data. The only location-related information
                      we process is the university and city you select in your profile. This is used to
                      show you relevant campus-specific content. We do not track your physical movements
                      or real-time location.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="how-we-use" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">02</span>
                  How We Use Information
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>We use the information we collect for the following purposes:</p>
                  <ul className="list-none space-y-3 ml-1">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-teal mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Providing the Service:</strong> To create and manage your account, display your profile to other users, process posts and comments, facilitate marketplace transactions, and enable all core platform features.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-teal mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Personalization:</strong> To show you content relevant to your university and interests, recommend circles you might want to join, and curate your home feed based on your activity and preferences.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-teal mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Notifications:</strong> To send you push notifications about activity relevant to you, such as comments on your posts, likes, circle invitations, and post moderation decisions. You control notification preferences on your device.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-teal mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Content Moderation:</strong> To review submitted posts for compliance with our community guidelines and Terms of Service, and to investigate reports of abuse or policy violations.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-teal mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Safety &amp; Security:</strong> To detect and prevent fraud, abuse, spam, fake accounts, and other malicious activity. To enforce our Terms of Service and protect the safety of our users.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-teal mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Analytics &amp; Improvement:</strong> To understand how users interact with the Platform, identify areas for improvement, fix bugs, and develop new features. We use aggregated and anonymized data for analytics whenever possible.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-teal mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Gamification:</strong> To calculate and award XP points, track your level progression (Freshman through Legend), and maintain leaderboards within the community.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-teal mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Communication:</strong> To respond to your support requests, bug reports, suggestions, and feedback submitted through the in-app reporting system.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="information-sharing" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">03</span>
                  Information Sharing
                </h2>
                <div className="mt-6 space-y-5 text-text-secondary text-sm leading-relaxed">
                  <div className="rounded-button bg-accent-mint/10 border border-accent-mint/20 p-4">
                    <p className="text-accent-mint font-semibold text-sm">
                      We never sell your personal data to third parties. Period.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">With Other Users</h3>
                    <p>
                      Your profile information (name, university, avatar, bio, level, and interests)
                      is visible to other FriendsCircle users. Posts, comments, reviews, and likes you
                      make are also visible to the community. Marketplace listings, ride-share offers,
                      and roommate posts are designed to be seen by other users to facilitate
                      connections.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">Service Providers</h3>
                    <p>We work with the following third-party service providers who process data on our behalf:</p>
                    <ul className="list-none space-y-2 mt-3 ml-1">
                      <li className="flex items-start gap-3">
                        <span className="text-primary mt-0.5">&#x2022;</span>
                        <span><strong className="text-text-primary">Supabase</strong> (database and authentication) &mdash; Stores your account data, posts, comments, and all platform data. Hosted on AWS infrastructure with industry-standard security. Supabase handles password hashing and authentication tokens; we never see or store your plaintext password.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary mt-0.5">&#x2022;</span>
                        <span><strong className="text-text-primary">Cloudinary</strong> (image hosting) &mdash; Stores and serves images you upload (profile photos, post images). Images are processed and optimized for fast delivery. Cloudinary does not access your account information.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary mt-0.5">&#x2022;</span>
                        <span><strong className="text-text-primary">Expo</strong> (push notifications) &mdash; Delivers push notifications to your mobile device. Expo receives your push notification token and notification content. No other personal data is shared with Expo.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary mt-0.5">&#x2022;</span>
                        <span><strong className="text-text-primary">Google</strong> (OAuth authentication) &mdash; If you sign in with Google, we receive your name, email, and profile picture. We do not share your FriendsCircle activity with Google.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">Legal Requirements</h3>
                    <p>
                      We may disclose your information if required to do so by law, in response to a
                      valid legal process (such as a court order or warrant issued by a Pakistani
                      court), or if we believe in good faith that disclosure is necessary to protect
                      the safety of users, investigate potential violations of our Terms, or comply
                      with the requirements of the Pakistan Electronic Crimes Act (PECA) 2016, the
                      Pakistan Telecommunication Authority (PTA), the Federal Investigation Agency
                      (FIA), or other relevant law enforcement agencies.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-text-primary font-semibold mb-2">Business Transfers</h3>
                    <p>
                      In the event of a merger, acquisition, bankruptcy, or sale of all or a portion
                      of our assets, your personal information may be transferred to the acquiring
                      entity. We will notify you via email or prominent notice on the Platform before
                      your information is transferred and becomes subject to a different privacy
                      policy.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="data-storage" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">04</span>
                  Data Storage &amp; Security
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    <strong className="text-text-primary">Infrastructure:</strong> Your data is
                    stored in a Supabase-managed PostgreSQL database hosted on Amazon Web Services
                    (AWS). Data is encrypted at rest and in transit using industry-standard encryption
                    protocols (TLS 1.2+).
                  </p>
                  <p>
                    <strong className="text-text-primary">Authentication Security:</strong> We use
                    Supabase Auth for all authentication operations. Passwords are hashed using
                    bcrypt with salt before storage. We never store, log, or have access to your
                    plaintext password. OAuth tokens from Google are managed securely by Supabase
                    Auth and are never exposed to our application code.
                  </p>
                  <p>
                    <strong className="text-text-primary">Row-Level Security:</strong> Our database
                    employs Row-Level Security (RLS) policies to ensure that users can only access
                    data they are authorized to view. This provides an additional layer of protection
                    at the database level, preventing unauthorized data access even in the event of an
                    application-level vulnerability.
                  </p>
                  <p>
                    <strong className="text-text-primary">Image Storage:</strong> Images uploaded to
                    FriendsCircle are stored on Cloudinary&apos;s globally distributed infrastructure
                    with SSL/TLS encryption. Images are served through Cloudinary&apos;s CDN for fast,
                    secure delivery.
                  </p>
                  <p>
                    <strong className="text-text-primary">Data Retention:</strong> We retain your
                    personal data for as long as your account is active or as needed to provide the
                    Service. If you delete your account, we will delete or anonymize your personal
                    data within 30 days, except where we are required by law to retain it for a
                    longer period. Aggregated, anonymized data that cannot be used to identify you
                    may be retained indefinitely for analytics purposes.
                  </p>
                  <p>
                    <strong className="text-text-primary">Security Measures:</strong> While we
                    implement commercially reasonable security measures to protect your data, no
                    method of electronic storage or transmission is 100% secure. We cannot guarantee
                    absolute security. If we become aware of a data breach that affects your personal
                    information, we will notify you in accordance with applicable Pakistani law and
                    take immediate steps to mitigate the impact.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="user-controls" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">05</span>
                  User Controls
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    You have the following rights and controls over your personal information on
                    FriendsCircle:
                  </p>
                  <ul className="list-none space-y-3 ml-1">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-mint mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Edit Your Profile:</strong> You can update your name, bio, avatar, university affiliation, and interests at any time through the profile settings in the app.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-mint mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Delete Your Posts:</strong> You can delete any post, comment, or review you have created at any time. Deleted content is permanently removed from the Platform.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-mint mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Manage Notifications:</strong> You can control push notification preferences through your device&apos;s system settings. You can also disable notifications entirely by revoking the notification permission for FriendsCircle on your device.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-mint mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Request Data Export:</strong> You can request a copy of your personal data by contacting us at support@friendscircle.app. We will provide your data in a structured, machine-readable format within 30 days of your request.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-mint mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Delete Your Account:</strong> You can request complete account deletion by contacting support@friendscircle.app. Upon deletion, all your personal data, posts, comments, and profile information will be permanently removed within 30 days. Some data may persist in anonymized form (such as aggregated statistics or anonymous reviews).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-mint mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Report Content:</strong> You can report inappropriate content, bugs, or privacy concerns through the in-app reporting feature. Reports are categorized as bugs, suggestions, complaints, or other issues and are reviewed by our team.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="cookies" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">06</span>
                  Cookies &amp; Tracking
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    <strong className="text-text-primary">Web Application:</strong> The FriendsCircle
                    web application uses minimal, essential cookies for authentication and session
                    management only. These cookies are strictly necessary for the Service to function
                    and cannot be disabled without losing access to your account.
                  </p>
                  <p>
                    <strong className="text-text-primary">No Advertising Trackers:</strong> We do
                    not use any advertising cookies, third-party tracking pixels, or behavioural
                    analytics scripts (such as Google Analytics, Facebook Pixel, or similar tools).
                    We do not participate in any advertising networks or data exchanges.
                  </p>
                  <p>
                    <strong className="text-text-primary">Mobile Application:</strong> The
                    FriendsCircle mobile app does not use cookies. Session management is handled
                    through secure authentication tokens stored locally on your device using the
                    platform&apos;s secure storage mechanisms.
                  </p>
                  <p>
                    <strong className="text-text-primary">Do Not Track:</strong> We honour Do Not
                    Track (DNT) browser signals. Since we do not engage in cross-site tracking or
                    advertising, there is no tracking behaviour to disable.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="children" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">07</span>
                  Children&apos;s Privacy
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    FriendsCircle is designed for university students and is not intended for use by
                    children under the age of 16. We do not knowingly collect personal information
                    from children under 16 years of age.
                  </p>
                  <p>
                    Users between the ages of 16 and 18 may use the Service only with the verified
                    consent of a parent or legal guardian. If you are a parent or guardian and you
                    believe that your child under 16 has provided us with personal information, please
                    contact us immediately at support@friendscircle.app.
                  </p>
                  <p>
                    If we discover that we have inadvertently collected personal information from a
                    child under 16 without appropriate parental consent, we will take immediate steps
                    to delete that information and terminate the associated account. We may also take
                    steps to verify the age of users if we have reason to believe they may be under 16.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="push-notifications" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">08</span>
                  Push Notifications
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    <strong className="text-text-primary">Opt-In:</strong> Push notifications on
                    FriendsCircle are entirely opt-in. When you first install the mobile app, we
                    request your permission to send push notifications. You can decline this
                    permission, and the app will function normally without push notifications.
                  </p>
                  <p>
                    <strong className="text-text-primary">How They Work:</strong> When you grant
                    notification permission, we store an Expo Push Token in your user profile in our
                    database. When relevant events occur (such as someone commenting on your post,
                    liking your content, or your post being approved), our system generates a
                    notification record and sends it to your device through Expo&apos;s push
                    notification service.
                  </p>
                  <p>
                    <strong className="text-text-primary">Notification Types:</strong> We send
                    notifications for the following events: new comments on your posts, likes on your
                    content, post approval or rejection decisions, circle invitations, and important
                    platform announcements.
                  </p>
                  <p>
                    <strong className="text-text-primary">Disabling Notifications:</strong> You can
                    disable push notifications at any time through your device&apos;s system settings
                    (Settings &rarr; Notifications &rarr; FriendsCircle on iOS; Settings &rarr; Apps
                    &rarr; FriendsCircle &rarr; Notifications on Android). Disabling notifications
                    does not affect any other functionality of the app.
                  </p>
                  <p>
                    <strong className="text-text-primary">Token Management:</strong> If you disable
                    notifications or uninstall the app, the push token stored in our database may
                    become stale. We do not take any action based on stale tokens beyond failed
                    delivery attempts, which are silently discarded.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section id="changes" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">09</span>
                  Changes to Privacy Policy
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our
                    practices, technology, legal requirements, or other factors. When we make changes,
                    we will update the &ldquo;Last updated&rdquo; date at the top of this page.
                  </p>
                  <p>
                    <strong className="text-text-primary">Significant Changes:</strong> For
                    significant changes that materially affect how we collect, use, or share your
                    personal information, we will notify you through an in-app notification, a
                    prominent notice on the Platform, or via email to the address associated with your
                    account. We will provide at least 7 days&apos; notice before such changes take
                    effect, giving you the opportunity to review the updated policy.
                  </p>
                  <p>
                    <strong className="text-text-primary">Minor Changes:</strong> For minor changes
                    (such as clarifications, formatting updates, or updates to contact information),
                    we may update the Privacy Policy without prior notice. We encourage you to review
                    this Privacy Policy periodically to stay informed.
                  </p>
                  <p>
                    Your continued use of FriendsCircle after any changes to this Privacy Policy
                    constitutes your acceptance of the revised policy. If you do not agree with the
                    updated policy, you should stop using the Service and request account deletion.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section id="contact" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">10</span>
                  Contact
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or
                    our data practices, please contact us:
                  </p>
                  <div className="rounded-button bg-surface-light border border-border p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-primary">&#9993;</span>
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider">Email</div>
                        <a
                          href="mailto:support@friendscircle.app"
                          className="text-primary-light hover:text-primary transition-colors"
                        >
                          support@friendscircle.app
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-primary">&#9873;</span>
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider">Location</div>
                        <span className="text-text-primary">Islamabad, Pakistan</span>
                      </div>
                    </div>
                  </div>
                  <p>
                    For privacy-related requests (data export, account deletion, or privacy concerns),
                    please include &ldquo;Privacy Request&rdquo; in the subject line of your email. We
                    aim to respond to all privacy-related inquiries within 15 business days.
                  </p>
                  <p>
                    If you are not satisfied with our response, you may raise your concern with the
                    Pakistan Telecommunication Authority (PTA) or any relevant regulatory body.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/terms"
                className="text-text-secondary hover:text-primary-light transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-text-primary font-semibold">Privacy Policy</span>
              <Link
                href="/"
                className="text-text-secondary hover:text-primary-light transition-colors"
              >
                Back to App
              </Link>
            </div>
            <p className="text-text-muted text-sm">
              &copy; 2025 FriendsCircle. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
