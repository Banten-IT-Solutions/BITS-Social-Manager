import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  FolderKanban,
  LayoutGrid,
  Eye,
  ArrowRight,
  LogIn,
  UserPlus,
  BookOpen,
} from 'lucide-react';
import { Button, Tooltip } from '../components/ui';
import { AnimatedBackground } from '../components/AnimatedBackground';

const highlights = [
  { icon: Lock, label: 'AES-256-GCM encryption' },
  { icon: FolderKanban, label: 'Per-project vaults' },
  { icon: LayoutGrid, label: '12 platforms' },
  { icon: Eye, label: 'Reveal on demand' },
];

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* ── Animated background ── */}
      <AnimatedBackground />

      {/* ── Top bar ── */}
      <header
        className="relative z-10 flex h-16 shrink-0 items-center justify-between px-5 sm:px-8 motion-safe:animate-fade-in"
        style={{ animationDelay: '0.05s' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 backdrop-blur">
            <Shield className="h-5 w-5 text-violet-400" />
          </div>
          <span className="font-semibold tracking-tight">BITS Social Manager</span>
        </div>
        <nav className="flex items-center gap-1" aria-label="Quick links">
          <Tooltip content="Sign in" side="bottom">
            <button
              type="button"
              onClick={() => navigate('/login')}
              aria-label="Sign in"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
            >
              <LogIn className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Create account" side="bottom">
            <button
              type="button"
              onClick={() => navigate('/register')}
              aria-label="Create account"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
            >
              <UserPlus className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="API documentation" side="bottom">
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              aria-label="API documentation"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
            >
              <BookOpen className="h-[18px] w-[18px]" aria-hidden="true" />
            </a>
          </Tooltip>
        </nav>
      </header>

      {/* ── Center stage ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className="max-w-3xl space-y-5 text-center sm:space-y-6">
          <span
            className="inline-flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur motion-safe:animate-rise"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
            </span>
            AES-256-GCM encrypted · Built for teams
          </span>

          <h1 className="text-balance text-4xl font-semibold leading-[1.06] tracking-tight sm:text-6xl">
            <span className="block">
              {['Every', 'account.', 'Locked', 'down.'].map((word, i) => (
                <span
                  key={word}
                  className="mr-[0.28em] inline-block motion-safe:animate-rise"
                  style={{ animationDelay: `${0.18 + i * 0.08}s` }}
                >
                  {word}
                </span>
              ))}
            </span>
            <span
              className="mt-1 block bg-[linear-gradient(90deg,rgb(196_181_253),rgb(244_244_245),rgb(139_92_246),rgb(196_181_253))] bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-shimmer"
              style={{ animationDelay: '0s' }}
            >
              One secure vault.
            </span>
          </h1>

          <p
            className="mx-auto max-w-xl text-balance text-zinc-400 sm:text-lg motion-safe:animate-rise"
            style={{ animationDelay: '0.5s' }}
          >
            Social media credentials for your whole team — encrypted with AES-256-GCM, organized per
            project, and revealed only when you need them.
          </p>

          <div
            className="relative inline-block motion-safe:animate-rise"
            style={{ animationDelay: '0.6s' }}
          >
            <div
              aria-hidden
              className="absolute -inset-1 rounded-lg bg-violet-600/40 blur-lg motion-safe:animate-pulse"
            />
            <Button
              size="lg"
              variant="primary"
              className="relative"
              onClick={() => navigate('/register')}
            >
              Create free account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Proof points */}
          <ul
            className="flex flex-wrap items-center justify-center gap-2 pt-1 motion-safe:animate-rise"
            style={{ animationDelay: '0.76s' }}
          >
            {highlights.map(f => (
              <li
                key={f.label}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-sm text-zinc-400 backdrop-blur transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:text-zinc-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <f.icon className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
