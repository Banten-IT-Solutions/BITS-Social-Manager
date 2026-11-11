import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ShieldCheck, type LucideIcon } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Footer } from '../components/Footer';

const OPERATOR = 'Banten IT Solutions';
const APP_URL = 'social.bits.co.id';
const CONTACT_EMAIL = 'admin@bits.co.id';
const LAST_UPDATED = 'November 11, 2026';

type Section = { title: string; body: string[] };

function LegalPage({
  icon: Icon,
  title,
  subtitle,
  sections,
  other,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  sections: Section[];
  other: { href: string; label: string };
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-zinc-950 text-zinc-100">
      {/* Viewport-locked so the backdrop stays tidy behind the long document */}
      <AnimatedBackground variant="fixed" />

      {/* ── Top bar (same as Landing) ── */}
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-5 sm:px-8 motion-safe:animate-fade-in">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
        >
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 backdrop-blur">
            <Icon className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <span className="font-semibold tracking-tight">BITS Social Manager</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-400 backdrop-blur transition-colors hover:border-zinc-600 hover:text-zinc-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </header>

      {/* ── Document ── */}
      <main className="relative z-10 flex-1 px-4 pb-16 pt-8 sm:pt-12">
        <article className="mx-auto max-w-3xl space-y-5 motion-safe:animate-rise">
          <header className="space-y-4 text-center">
            <div className="mx-auto inline-flex rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 backdrop-blur">
              <Icon className="h-7 w-7 text-violet-400" aria-hidden="true" />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur">
                Last updated · {LAST_UPDATED}
              </span>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mx-auto max-w-xl text-balance text-zinc-400">{subtitle}</p>
          </header>

          <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-violet-600/5 backdrop-blur sm:p-10">
            {sections.map((section, i) => (
              <section key={section.title} className="space-y-2.5">
                <h2 className="flex items-baseline gap-2.5 text-base font-semibold text-zinc-100 sm:text-lg">
                  <span className="text-sm font-medium text-violet-400 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {section.title}
                </h2>
                {section.body.map(paragraph => (
                  <p key={paragraph} className="text-sm leading-relaxed text-zinc-400">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            <p className="border-t border-zinc-800 pt-4 text-sm text-zinc-500">
              Questions about this document? Contact {OPERATOR} at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-violet-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              >
                {CONTACT_EMAIL}
              </a>
              . See also our{' '}
              <Link
                to={other.href}
                className="text-violet-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              >
                {other.label}
              </Link>
              .
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

const termsSections: Section[] = [
  {
    title: 'About these terms',
    body: [
      `BITS Social Manager (the "Service") is operated by ${OPERATOR} and provided at ${APP_URL}. These Terms of Service govern your use of the Service. By creating an account or using the Service, you accept these Terms.`,
      'You must be at least 16 years old and legally permitted to use the Service in your jurisdiction.',
    ],
  },
  {
    title: 'Accounts and security',
    body: [
      'You register with your name, email address, and a password of at least 8 characters. Your password is stored only as a bcrypt hash; sessions use a signed JWT valid for 7 days.',
      'You are responsible for keeping your password confidential and for all activity under your account. Contact us immediately if you suspect unauthorized access.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'You may only store credentials for social media accounts that you own or are authorized to manage by the account owner or your organization, across the 12 supported platforms (Gmail, YouTube, Facebook, Instagram, Threads, WhatsApp, Telegram, TikTok, Shopee, X, LinkedIn, GitHub).',
      "You may not store unlawful content, attempt to access other users' data, probe or scan our infrastructure, or abuse the authentication endpoints. We apply rate limiting (10 attempts per 15 minutes) on login and registration.",
    ],
  },
  {
    title: 'Your content',
    body: [
      'You retain all rights to the data you store in the Service: projects, social account credentials, notes, and scheduled posts ("Your Content").',
      `Your Content is processed only to provide the Service to you. We do not access it except for storage, encryption, security monitoring, or when required by law. Account passwords are encrypted at rest with AES-256-GCM and are only decrypted when you explicitly reveal a single account.`,
    ],
  },
  {
    title: 'Google Drive integration',
    body: [
      'The Service offers an optional content-planning feature that can attach files from your Google Drive. Connecting Drive is entirely your choice.',
      'When connected, we store your Google account email and OAuth tokens, encrypted, solely to read and organize files you pick. You can disconnect at any time; we then revoke the token with Google and delete the stored connection data.',
    ],
  },
  {
    title: 'Availability and termination',
    body: [
      'The Service is provided "as is" and "as available". We may modify, suspend, or discontinue any part of the Service with reasonable notice where practical.',
      'You may delete your account at any time through the Service. We may suspend or terminate accounts that violate these Terms. Deleting your account permanently removes your projects, accounts, posts, and connected integrations.',
    ],
  },
  {
    title: 'Limitation of liability',
    body: [
      'To the maximum extent permitted by law, ' +
        OPERATOR +
        ' is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, or data, arising from your use of the Service.',
      'Use strong, unique passwords for the social accounts you manage, and restrict Service access to team members you trust. Nothing in these Terms limits liability that cannot be limited by law.',
    ],
  },
  {
    title: 'Changes to these terms',
    body: [
      'We may update these Terms from time to time. Material changes will be announced through the Service. Continued use after changes take effect constitutes acceptance.',
    ],
  },
];

const privacySections: Section[] = [
  {
    title: 'Information we collect',
    body: [
      'Account data: your name and email address. Your password is stored only as a bcrypt hash (10 rounds) and is never readable by us or by anyone else.',
      'Vault data: the social accounts you add per project — platform, account name, email/username handle, notes, and the account password. The password is encrypted with AES-256-GCM before storage; list endpoints never include it, and it is only decrypted for you when you open a single account.',
      'Content plan data: post titles, descriptions, scheduled dates, statuses, and Drive attachment metadata (file ID, name) for posts you create.',
      'Drive connection data: only if you connect Google Drive — your Google account email and OAuth tokens, stored encrypted, so the Service can access the files you select.',
      'Technical logs: request metadata such as IP address and timestamps, used for rate limiting, abuse prevention, and operational monitoring.',
    ],
  },
  {
    title: 'How we use information',
    body: [
      `To provide and secure the Service: authenticating you, encrypting and serving your vaults, enforcing that every project and account operation is scoped to your own data, and protecting against abuse.`,
      `We do not sell your data, and we do not use it for advertising, analytics tracking, or model training.`,
    ],
  },
  {
    title: 'Encryption and storage',
    body: [
      'Account passwords are encrypted with AES-256-GCM (Web Crypto API) using a server-side encryption key. Reveal responses are sent with no-store caching so decrypted passwords are never written to caches or browser history.',
      'All data is stored in Cloudflare D1 (SQLite) on infrastructure operated by Cloudflare. User passwords are hashed with bcrypt.',
    ],
  },
  {
    title: 'Third parties',
    body: [
      'Cloudflare: hosts the application and its database, and processes requests to ' +
        APP_URL +
        '.',
      'Google: only when you connect Google Drive. We exchange OAuth tokens with Google solely for the Drive scopes you approve, and never for other Google services.',
      'We share nothing else, with no one, unless required by law.',
    ],
  },
  {
    title: 'Sessions, cookies, and tracking',
    body: [
      "The Service does not use cookies. Your session is a signed JWT stored in your browser's local storage and sent as a Bearer token; it expires after 7 days, and signing out removes it immediately.",
      'We embed no advertising, analytics, or third-party tracking scripts on ' + APP_URL + '.',
    ],
  },
  {
    title: 'Retention and deletion',
    body: [
      'We keep your data while your account is active. Deleting a project removes its accounts and posts; deleting your account removes all of your data, including your Drive connection.',
      'Operational logs may be retained by our infrastructure provider for a limited period before automatic deletion.',
    ],
  },
  {
    title: 'Your rights',
    body: [
      'You can access, correct, export, and delete your data directly in the Service at any time: profile and password via your profile settings, and projects, accounts, and posts via the app. The full API (documented at /docs) also exposes read access to your data.',
      `For anything else — including requests under GDPR or applicable local law — contact ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'We may update this policy as the Service evolves. Material changes will be announced through the Service, and the "last updated" date above will change.',
    ],
  },
];

export function TermsPage() {
  return (
    <LegalPage
      icon={FileText}
      title="Terms of Service"
      subtitle="The rules for using BITS Social Manager. Short, plain, and binding once you create an account."
      sections={termsSections}
      other={{ href: '/privacy', label: 'Privacy Policy' }}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage
      icon={ShieldCheck}
      title="Privacy Policy"
      subtitle="What we collect, how we protect it, and what we never do with it."
      sections={privacySections}
      other={{ href: '/terms', label: 'Terms of Service' }}
    />
  );
}
