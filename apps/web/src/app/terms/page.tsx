import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | FriendsCircle",
  description:
    "Terms of Service for FriendsCircle — Pakistan's university social platform. Read our terms governing account usage, content policies, and community guidelines.",
  openGraph: {
    title: "Terms of Service | FriendsCircle",
    description:
      "Terms of Service for FriendsCircle — Pakistan's university social platform.",
    url: "https://friendscircle.app/terms",
    siteName: "FriendsCircle",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | FriendsCircle",
    description:
      "Terms of Service for FriendsCircle — Pakistan's university social platform.",
  },
};

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms", number: 1 },
  { id: "description", title: "Description of Service", number: 2 },
  { id: "accounts", title: "User Accounts", number: 3 },
  { id: "content", title: "User Content", number: 4 },
  { id: "prohibited", title: "Prohibited Conduct", number: 5 },
  { id: "ip", title: "Intellectual Property", number: 6 },
  { id: "privacy", title: "Privacy", number: 7 },
  { id: "disclaimers", title: "Disclaimers & Limitation of Liability", number: 8 },
  { id: "termination", title: "Termination", number: 9 },
  { id: "governing-law", title: "Governing Law", number: 10 },
  { id: "contact", title: "Contact", number: 11 },
];

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <div className="mt-4 h-1 w-20 rounded-full bg-primary" />
          <p className="mt-6 text-text-secondary text-lg">
            Last updated: April 2025
          </p>
          <p className="mt-3 text-text-muted text-sm leading-relaxed max-w-2xl">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
            FriendsCircle&apos;s mobile application, website, and related services
            (collectively, the &ldquo;Service&rdquo;). Please read them carefully before
            creating an account or using the platform.
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
            <section id="acceptance" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">01</span>
                  Acceptance of Terms
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    By accessing or using FriendsCircle (the &ldquo;Platform&rdquo;), you agree to be
                    bound by these Terms of Service and all applicable laws and regulations of
                    Pakistan. If you do not agree with any part of these Terms, you must not use the
                    Service.
                  </p>
                  <p>
                    <strong className="text-text-primary">Age Requirement:</strong> You must be at
                    least 18 years of age to create an account on FriendsCircle. If you are between
                    16 and 18 years of age, you may use the Service only with the verified consent of
                    a parent or legal guardian. Users under 16 are not permitted to use FriendsCircle
                    under any circumstances.
                  </p>
                  <p>
                    <strong className="text-text-primary">University Affiliation:</strong> FriendsCircle
                    is designed primarily for university students, faculty, and alumni in Pakistan.
                    While we do not strictly require university enrollment to use the Service, certain
                    features — such as teacher reviews, past papers, and campus-specific circles — are
                    intended for verified university community members. We reserve the right to limit
                    access to certain features based on university affiliation.
                  </p>
                  <p>
                    These Terms constitute a legally binding agreement between you (&ldquo;User&rdquo;,
                    &ldquo;you&rdquo;, &ldquo;your&rdquo;) and FriendsCircle (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
                    &ldquo;our&rdquo;). We may update these Terms from time to time. Continued use of the
                    Service after any changes constitutes acceptance of the revised Terms. We will
                    notify you of material changes through the app or via email.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="description" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">02</span>
                  Description of Service
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    FriendsCircle is a university-focused social platform serving students across
                    Pakistan. The Service provides a suite of community-driven features designed to
                    enhance campus life and foster meaningful connections among students.
                  </p>
                  <p>Our platform includes the following features:</p>
                  <ul className="list-none space-y-2 ml-1">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Friend Circles</strong> &mdash; Create private groups with your university friends and classmates for discussions, coordination, and social interaction.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Teacher Reviews</strong> &mdash; Rate and review professors to help fellow students make informed course selection decisions.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Student OLX (Buy &amp; Sell)</strong> &mdash; A campus marketplace for buying and selling textbooks, electronics, furniture, and other items.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Lost &amp; Found</strong> &mdash; Report and recover lost items within your university community.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Past Papers</strong> &mdash; Share and access examination past papers and study resources.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Roommate Finder</strong> &mdash; Find compatible roommates based on preferences, budget, and location.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Ride Sharing</strong> &mdash; Coordinate rides to and from campus, airports, and other destinations.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Freelance &amp; Jobs</strong> &mdash; Post and discover freelance opportunities and job openings relevant to students.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Campus Events</strong> &mdash; Discover and promote events, hackathons, workshops, and social gatherings.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-0.5">&#x2022;</span>
                      <span><strong className="text-text-primary">Campus Memories</strong> &mdash; Share and relive memorable moments from university life.</span>
                    </li>
                  </ul>
                  <p>
                    We reserve the right to modify, suspend, or discontinue any part of the Service at
                    any time without prior notice. We are not liable to you or any third party for any
                    modification, suspension, or discontinuation of the Service.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="accounts" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">03</span>
                  User Accounts
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    <strong className="text-text-primary">Registration:</strong> To access most
                    features of FriendsCircle, you must create an account using a valid email address
                    or by signing in through Google OAuth. You agree to provide accurate, current, and
                    complete information during registration and to update such information as
                    necessary.
                  </p>
                  <p>
                    <strong className="text-text-primary">Account Security:</strong> You are
                    responsible for maintaining the confidentiality of your account credentials and for
                    all activities that occur under your account. You must notify us immediately at
                    support@friendscircle.app if you suspect any unauthorized access to or use of your
                    account. FriendsCircle will not be liable for any loss or damage arising from your
                    failure to protect your account credentials.
                  </p>
                  <p>
                    <strong className="text-text-primary">One Account Per Person:</strong> Each
                    individual may maintain only one active FriendsCircle account. Creating multiple
                    accounts to circumvent bans, manipulate the platform&apos;s reputation system, or
                    engage in deceptive behaviour is strictly prohibited and may result in immediate
                    termination of all associated accounts.
                  </p>
                  <p>
                    <strong className="text-text-primary">Profile Information:</strong> Your profile
                    — including your name, university, avatar, and bio — is visible to other users on
                    the platform. You are responsible for ensuring that your profile information does
                    not violate these Terms or any applicable laws. We reserve the right to remove or
                    modify profile information that we deem inappropriate, misleading, or in violation
                    of these Terms.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="content" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">04</span>
                  User Content
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    <strong className="text-text-primary">Ownership:</strong> You retain all
                    ownership rights to the content you create and share on FriendsCircle, including
                    posts, comments, reviews, images, and any other material (&ldquo;User Content&rdquo;).
                    FriendsCircle does not claim ownership of your User Content.
                  </p>
                  <p>
                    <strong className="text-text-primary">License Grant:</strong> By submitting User
                    Content to the Platform, you grant FriendsCircle a non-exclusive, worldwide,
                    royalty-free, sublicensable, and transferable licence to use, reproduce, modify,
                    distribute, display, and perform your User Content solely in connection with
                    operating and providing the Service. This licence exists only for as long as your
                    content remains on the Platform and terminates when you delete your content or
                    account (subject to reasonable backup and caching periods).
                  </p>
                  <p>
                    <strong className="text-text-primary">Content Standards:</strong> User Content
                    must not contain or promote illegal activities, violence, harassment, hate speech,
                    explicit sexual material, personal attacks, defamation, misinformation, spam, or
                    any material that violates the rights of others. You are solely responsible for the
                    content you post and the consequences of sharing it.
                  </p>
                  <p>
                    <strong className="text-text-primary">Content Moderation:</strong> All posts on
                    FriendsCircle are subject to moderation. Newly created posts enter a
                    &ldquo;pending&rdquo; state and must be approved by our moderation team before
                    becoming visible to the community. We reserve the right to reject, remove, or
                    modify any content that violates these Terms, our community guidelines, or
                    applicable law, at our sole discretion and without prior notice.
                  </p>
                  <p>
                    <strong className="text-text-primary">Content Expiry:</strong> Certain types of
                    posts (such as OLX listings, ride shares, and roommate requests) may be subject
                    to automatic expiry after 30 days. Expired posts will be archived and may no longer
                    be visible to other users. You may re-post expired content if it remains relevant.
                  </p>
                  <p>
                    <strong className="text-text-primary">Image Uploads:</strong> Images uploaded to
                    the Platform must be in JPEG, PNG, WebP, or GIF format and must not exceed 10 MB
                    in size. Images are stored on third-party cloud infrastructure (Cloudinary). By
                    uploading images, you confirm that you have the right to share them and that they
                    comply with these Terms.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="prohibited" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">05</span>
                  Prohibited Conduct
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    You agree not to engage in any of the following prohibited activities while using
                    FriendsCircle:
                  </p>
                  <ul className="list-none space-y-3 ml-1">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">1.</span>
                      <span><strong className="text-text-primary">Harassment &amp; Bullying:</strong> Engaging in behaviour that intimidates, threatens, stalks, or causes distress to other users, including targeted attacks based on gender, ethnicity, religion, sect, caste, disability, sexual orientation, or any other protected characteristic.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">2.</span>
                      <span><strong className="text-text-primary">Hate Speech:</strong> Posting content that promotes hatred, discrimination, or violence against individuals or groups based on religion, ethnicity, gender, nationality, political affiliation, or any other characteristic. This includes content promoting sectarian division, which is particularly harmful in Pakistan&apos;s diverse social fabric.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">3.</span>
                      <span><strong className="text-text-primary">Fake Accounts &amp; Impersonation:</strong> Creating accounts using false identities, impersonating other individuals (students, faculty, or public figures), or misrepresenting your university affiliation.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">4.</span>
                      <span><strong className="text-text-primary">Spam &amp; Commercial Abuse:</strong> Sending unsolicited messages, posting repetitive content, using automated tools to interact with the Service, or using the platform for unauthorized commercial advertising unrelated to the student community.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">5.</span>
                      <span><strong className="text-text-primary">Academic Dishonesty:</strong> Posting content that facilitates cheating, plagiarism, or academic fraud. Past papers shared for study purposes are permitted, but selling answers to current examinations or assignments is prohibited.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">6.</span>
                      <span><strong className="text-text-primary">Illegal Activities:</strong> Using the platform to facilitate any activity that violates the laws of Pakistan, including but not limited to fraud, drug trafficking, piracy, gambling, and distribution of obscene material as defined under the Pakistan Penal Code and PECA 2016.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">7.</span>
                      <span><strong className="text-text-primary">Defamation:</strong> Posting false statements of fact that damage the reputation of individuals, faculty members, universities, or organizations. Teacher reviews must be honest, factual, and constructive.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">8.</span>
                      <span><strong className="text-text-primary">Platform Manipulation:</strong> Attempting to manipulate the platform&apos;s reputation system, gaming XP points, creating fake likes or comments, or exploiting technical vulnerabilities in the Service.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-coral mt-0.5 font-bold">9.</span>
                      <span><strong className="text-text-primary">Privacy Violations:</strong> Sharing personal information of others (doxxing), including phone numbers, addresses, CNIC numbers, or private photographs without consent.</span>
                    </li>
                  </ul>
                  <p>
                    Violations of these rules may result in content removal, temporary suspension, or
                    permanent account termination, at our sole discretion. Severe violations may be
                    reported to relevant law enforcement authorities.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="ip" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">06</span>
                  Intellectual Property
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    <strong className="text-text-primary">FriendsCircle Brand:</strong> The
                    FriendsCircle name, logo, visual design, colour scheme, and all associated
                    branding elements are the intellectual property of FriendsCircle and its founders.
                    You may not use, reproduce, modify, or distribute any of our branding without
                    prior written permission.
                  </p>
                  <p>
                    <strong className="text-text-primary">Platform Technology:</strong> The
                    FriendsCircle application, including its source code, design, algorithms,
                    architecture, and documentation, is protected by intellectual property laws. You
                    may not copy, reverse-engineer, decompile, disassemble, or create derivative works
                    from any part of the Service.
                  </p>
                  <p>
                    <strong className="text-text-primary">User Content Ownership:</strong> As stated
                    in Section 4, you retain ownership of all content you create and share on
                    FriendsCircle. We respect your intellectual property rights and will respond to
                    valid takedown requests for content that infringes upon the intellectual property
                    rights of others.
                  </p>
                  <p>
                    <strong className="text-text-primary">Copyright Complaints:</strong> If you
                    believe that your copyrighted work has been posted on FriendsCircle without your
                    permission, please contact us at support@friendscircle.app with a detailed
                    description of the alleged infringement. We will investigate and take appropriate
                    action in accordance with applicable Pakistani intellectual property laws.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="privacy" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">07</span>
                  Privacy
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    Your privacy is important to us. Our collection, use, and protection of your
                    personal information is governed by our{" "}
                    <Link
                      href="/privacy"
                      className="text-primary-light hover:text-primary underline underline-offset-2 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    , which is incorporated into these Terms by reference. By using FriendsCircle, you
                    consent to the collection and use of your information as described in the Privacy
                    Policy.
                  </p>
                  <p>
                    We are committed to protecting your data in accordance with applicable Pakistani
                    data protection laws and international best practices. We do not sell your personal
                    data to third parties.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="disclaimers" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">08</span>
                  Disclaimers &amp; Limitation of Liability
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    <strong className="text-text-primary">As-Is Service:</strong> FriendsCircle is
                    provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any
                    kind, whether express or implied, including but not limited to implied warranties
                    of merchantability, fitness for a particular purpose, and non-infringement. We do
                    not guarantee that the Service will be uninterrupted, error-free, secure, or free
                    of harmful components.
                  </p>
                  <p>
                    <strong className="text-text-primary">User-Generated Content:</strong> FriendsCircle
                    does not endorse, verify, or guarantee the accuracy, completeness, or reliability
                    of any User Content, including teacher reviews, marketplace listings, roommate
                    profiles, or ride-share offers. You rely on such content at your own risk. We
                    strongly encourage users to exercise due diligence and personal judgement when
                    engaging with other users or acting on information found on the Platform.
                  </p>
                  <p>
                    <strong className="text-text-primary">University Information:</strong> Information
                    about universities, campuses, faculty, and courses displayed on FriendsCircle is
                    provided by our user community and may not be accurate, complete, or up-to-date.
                    FriendsCircle is not affiliated with, endorsed by, or officially connected to any
                    university listed on the Platform unless explicitly stated.
                  </p>
                  <p>
                    <strong className="text-text-primary">Limitation of Liability:</strong> To the
                    maximum extent permitted by the laws of Pakistan, FriendsCircle, its founders,
                    employees, and affiliates shall not be liable for any indirect, incidental,
                    special, consequential, or punitive damages, including but not limited to loss of
                    profits, data, or goodwill, arising from or related to your use of the Service,
                    any transaction between users, or any content posted on the Platform. Our total
                    aggregate liability for any claim arising from or related to the Service shall not
                    exceed PKR 10,000 (Ten Thousand Pakistani Rupees).
                  </p>
                  <p>
                    <strong className="text-text-primary">Third-Party Transactions:</strong> FriendsCircle
                    is not a party to any transaction between users, including buy/sell transactions,
                    ride-sharing arrangements, or roommate agreements. We do not guarantee the quality,
                    safety, legality, or delivery of items listed on the student marketplace. Users
                    engage in such transactions entirely at their own risk.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section id="termination" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">09</span>
                  Termination
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    <strong className="text-text-primary">By You:</strong> You may delete your
                    account at any time by contacting us at support@friendscircle.app. Upon account
                    deletion, your profile and personal data will be removed from the Platform, though
                    some content (such as comments on other users&apos; posts) may persist in
                    anonymized form.
                  </p>
                  <p>
                    <strong className="text-text-primary">By Us:</strong> We reserve the right to
                    suspend or terminate your account at any time, with or without notice, for any
                    reason, including but not limited to: violation of these Terms, engagement in
                    prohibited conduct, receipt of valid legal or regulatory requests, extended periods
                    of inactivity, or actions that harm the Platform or its community.
                  </p>
                  <p>
                    <strong className="text-text-primary">Effect of Termination:</strong> Upon
                    termination, your right to use the Service will immediately cease. Provisions of
                    these Terms that by their nature should survive termination will survive,
                    including but not limited to intellectual property provisions, disclaimers,
                    limitations of liability, and governing law.
                  </p>
                  <p>
                    <strong className="text-text-primary">Appeal:</strong> If you believe your account
                    was terminated in error, you may appeal the decision by contacting us at
                    support@friendscircle.app within 30 days of termination. We will review your
                    appeal and respond within a reasonable time frame.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section id="governing-law" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">10</span>
                  Governing Law
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the
                    Islamic Republic of Pakistan, without regard to its conflict of law provisions.
                    This includes, but is not limited to, the Pakistan Electronic Crimes Act (PECA)
                    2016, the Contract Act 1872, and any applicable data protection regulations.
                  </p>
                  <p>
                    Any dispute arising from or relating to these Terms or your use of the Service that
                    cannot be resolved through good-faith negotiations shall be submitted to the
                    exclusive jurisdiction of the courts located in Islamabad, Pakistan. Both parties
                    agree to submit to the personal jurisdiction of such courts.
                  </p>
                  <p>
                    If any provision of these Terms is found to be unenforceable or invalid by a court
                    of competent jurisdiction, that provision shall be limited or eliminated to the
                    minimum extent necessary so that the remaining provisions of these Terms shall
                    remain in full force and effect.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 11 */}
            <section id="contact" className="scroll-mt-24">
              <div className="rounded-card bg-surface border border-border p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary flex items-baseline gap-3 border-l-4 border-primary pl-4 -ml-4">
                  <span className="text-primary font-mono text-sm">11</span>
                  Contact
                </h2>
                <div className="mt-6 space-y-4 text-text-secondary text-sm leading-relaxed">
                  <p>
                    If you have any questions, concerns, or feedback about these Terms of Service,
                    please contact us:
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
                    We aim to respond to all inquiries within 3&ndash;5 business days. For urgent
                    matters related to account security or safety concerns, please include
                    &ldquo;URGENT&rdquo; in the subject line of your email.
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
              <span className="text-text-primary font-semibold">Terms of Service</span>
              <Link
                href="/privacy"
                className="text-text-secondary hover:text-primary-light transition-colors"
              >
                Privacy Policy
              </Link>
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
