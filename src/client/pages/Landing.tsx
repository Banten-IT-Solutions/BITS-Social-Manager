import { useNavigate } from 'react-router-dom';
import { Shield, Lock, FolderKanban, LayoutGrid, KeyRound } from 'lucide-react';
import { Button } from '../components/ui';

const PLATFORMS =
  'Gmail, YouTube, Facebook, Instagram, Threads, WhatsApp, Telegram, TikTok, Shopee, X, LinkedIn, GitHub';

const features = [
  {
    icon: Lock,
    title: 'Encrypted at rest',
    description:
      'Passwords are encrypted server-side and only revealed on demand — never stored in plain text.',
  },
  {
    icon: FolderKanban,
    title: 'Project-based',
    description: 'Group accounts per client or project, so every team stays on the same page.',
  },
  {
    icon: LayoutGrid,
    title: '12 platforms',
    description: `From ${PLATFORMS.split(', ').slice(0, 3).join(', ')} to more — all your handles in one place.`,
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2">
              <Shield className="h-5 w-5 text-zinc-400" />
            </div>
            <span className="font-semibold tracking-tight">BITS Social Manager</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button size="sm" variant="primary" onClick={() => navigate('/register')}>
              Get started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative max-w-3xl mx-auto px-4 pt-24 pb-20 text-center">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-72 pointer-events-none"
            style={{
              background: 'radial-gradient(60% 60% at 50% 0%, rgb(63 63 70 / 0.4), transparent)',
            }}
          />
          <div className="relative animate-fade-in space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
              <KeyRound className="h-3.5 w-3.5" />
              Secure social media account management
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Every account.
              <br />
              <span className="text-zinc-400">One secure vault.</span>
            </h1>
            <p className="text-zinc-400 text-lg text-balance max-w-xl mx-auto">
              Store, organize, and share your team&apos;s social media credentials — encrypted per
              project, accessible only to you.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="lg" variant="primary" onClick={() => navigate('/register')}>
                Create free account
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(f => (
              <div
                key={f.title}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 space-y-3"
              >
                <div className="w-fit rounded-lg bg-zinc-900 border border-zinc-800 p-2">
                  <f.icon className="h-5 w-5 text-zinc-400" />
                </div>
                <h2 className="font-medium">{f.title}</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between text-sm text-zinc-500">
          <span>© {new Date().getFullYear()} Banten IT Solutions</span>
          <a
            href="/docs"
            className="hover:text-zinc-300 underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            API docs
          </a>
        </div>
      </footer>
    </div>
  );
}
