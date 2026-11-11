/**
 * Shared animated backdrop (glow orbs, grid, conic beam, particles, vignette).
 * Purely decorative — hidden from assistive tech and pointer events.
 *
 * `variant="fixed"` viewport-locks the backdrop so it stays tidy behind long,
 * scrollable pages (legal docs). Default "absolute" spans the container and
 * suits single-screen pages (landing, auth).
 */
export function AnimatedBackground({ variant = 'absolute' }: { variant?: 'absolute' | 'fixed' }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${variant === 'fixed' ? 'fixed' : 'absolute'} inset-0`}
    >
      {/* Fading grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(63_63_70/0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgb(63_63_70/0.16)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black,transparent)]" />
      {/* Drifting glow orbs */}
      <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl motion-safe:animate-float-a" />
      <div className="absolute -bottom-36 -left-28 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/15 blur-3xl motion-safe:animate-float-b" />
      <div
        className="absolute right-[-9rem] top-1/4 h-[24rem] w-[24rem] rounded-full bg-indigo-500/15 blur-3xl motion-safe:animate-float-b"
        style={{ animationDelay: '-10s' }}
      />
      {/* Slow rotating conic beam */}
      <div className="absolute left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 opacity-50 motion-safe:animate-rotate-slower">
        <div className="h-full w-full rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgb(139_92_246/0.22)_10%,transparent_22%)]" />
      </div>
      {/* Ambient floating particles */}
      <div
        className="absolute left-[18%] top-[30%] h-1.5 w-1.5 rounded-full bg-zinc-400/50 motion-safe:animate-float-a"
        style={{ animationDelay: '-4s' }}
      />
      <div
        className="absolute left-[78%] top-[58%] h-1 w-1 rounded-full bg-violet-400/60 motion-safe:animate-float-b"
        style={{ animationDelay: '-7s' }}
      />
      <div
        className="absolute left-[62%] top-[22%] h-1.5 w-1.5 rounded-full bg-zinc-400/40 motion-safe:animate-float-a"
        style={{ animationDelay: '-13s' }}
      />
      <div
        className="absolute left-[30%] top-[70%] h-1 w-1 rounded-full bg-fuchsia-400/50 motion-safe:animate-float-b"
        style={{ animationDelay: '-16s' }}
      />
      {/* Vignette to keep text readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(9_9_11/0.9)_100%)]" />
    </div>
  );
}
