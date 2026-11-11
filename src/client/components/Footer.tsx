import { Link } from 'react-router-dom';
import { Shield, FileText, ShieldCheck } from 'lucide-react';

/**
 * Floating chip-footer echoing the Landing's glass language (proof-point pills,
 * shield mark) while staying transparent to the one-page animated backdrop.
 * Icons match the legal page heroes (FileText = terms, ShieldCheck = privacy).
 */
export function Footer() {
  const chipClass =
    'inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:text-zinc-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400';

  const links = [
    { to: '/terms', label: 'Terms', icon: FileText },
    { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
  ];

  return (
    <footer
      className="relative z-10 flex shrink-0 flex-wrap items-center justify-center gap-2 px-5 pb-6 pt-2 motion-safe:animate-fade-in"
      style={{ animationDelay: '0.9s' }}
    >
      {/* Copyright pill — brand mark echoes the header logo */}
      <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur">
        <Shield className="h-3 w-3 text-violet-400" aria-hidden="true" />©{' '}
        {new Date().getFullYear()} Banten IT Solutions
      </span>

      {links.map(link => (
        <Link key={link.to} to={link.to} className={chipClass}>
          <link.icon className="h-3 w-3 text-violet-400" aria-hidden="true" />
          {link.label}
        </Link>
      ))}
    </footer>
  );
}
