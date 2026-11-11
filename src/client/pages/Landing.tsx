import { useNavigate } from 'react-router-dom';
import { Shield, Lock, FolderKanban, LayoutGrid, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui';

const highlights = [
  { icon: Lock, label: 'Encrypted at rest' },
  { icon: FolderKanban, label: 'Project-based' },
  { icon: LayoutGrid, label: '12 platforms' },
];

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* ── Animated background ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Fading grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(63_63_70/0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgb(63_63_70/0.16)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black,transparent)]" />
        {/* Drifting glow orbs */}
        <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl motion-safe:animate-float-a" />
        <div className="absolute -bottom-36 -left-28 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/15 blur-3xl motion-safe:animate-float-b" />
        <div
          className="absolute right-[-9rem] top-1/4 h-[24rem] w-[24rem] rounded-full bg-indigo-500/15 blur-3xl motion-safe:animate-float-b"
          style={{ animationDelay: '-10s' }}
        />
        {/* Slow rotating conic beam behind the headline */}
        <div className="absolute left-1/2 top-[45%] h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 opacity-50 motion-safe:animate-rotate-slower">
          <div className="h-full w-full rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgb(139_92_246/0.22)_10%,transparent_22%)]" />
        </div>
        {/* Vignette to keep text readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(9_9_11/0.9)_100%)]" />
      </div>

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
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded px-1.5 py-1"
        >
          API docs
        </a>
      </header>

      {/* ── Center stage ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className="max-w-3xl space-y-6 text-center sm:space-y-7">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-400 backdrop-blur motion-safe:animate-rise"
            style={{ animationDelay: '0.1s' }}
          >
            <KeyRound className="h-3.5 w-3.5 text-violet-400" />
            Secure social media account management
          </span>

          <h1
            className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl motion-safe:animate-rise"
            style={{ animationDelay: '0.2s' }}
          >
            Every account.
            <br />
            <span className="bg-[linear-gradient(90deg,rgb(196_181_253),rgb(244_244_245),rgb(139_92_246),rgb(196_181_253))] bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-shimmer">
              One secure vault.
            </span>
          </h1>

          <p
            className="mx-auto max-w-xl text-balance text-zinc-400 sm:text-lg motion-safe:animate-rise"
            style={{ animationDelay: '0.3s' }}
          >
            Store, organize, and share your team&apos;s social media credentials — encrypted per
            project, accessible only to you.
          </p>

          <div
            className="flex items-center justify-center gap-4 motion-safe:animate-rise"
            style={{ animationDelay: '0.4s' }}
          >
            <Button size="lg" variant="primary" onClick={() => navigate('/register')}>
              Create free account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p
            className="text-sm text-zinc-500 motion-safe:animate-rise"
            style={{ animationDelay: '0.48s' }}
          >
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-zinc-300 underline-offset-4 transition-colors hover:text-zinc-100 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded"
            >
              Sign in
            </button>
          </p>

          {/* Feature chips */}
          <ul
            className="flex flex-wrap items-center justify-center gap-2 pt-2 motion-safe:animate-rise"
            style={{ animationDelay: '0.56s' }}
          >
            {highlights.map(f => (
              <li
                key={f.label}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-sm text-zinc-400 backdrop-blur"
              >
                <f.icon className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* ── Bottom bar ── */}
      <footer
        className="relative z-10 flex h-14 shrink-0 items-center justify-between px-5 text-sm text-zinc-600 sm:px-8 motion-safe:animate-fade-in"
        style={{ animationDelay: '0.7s' }}
      >
        <span>© {new Date().getFullYear()} Banten IT Solutions. All rights reserved.</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  );
}
