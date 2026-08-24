import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, User, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLogout } from '../hooks/useLogout';
import { cn } from '../lib/utils';

interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

// Mobile bottom-nav entries ("Home" instead of "Projects" for brevity on small screens).
const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Home' },
  { to: '/profile', icon: User, label: 'Profile' },
];

/**
 * Mobile app bar (below lg): fixed bottom navigation with Home / Profile / Logout.
 * The desktop icon rail lives in Sidebar.tsx; this replaces the old mobile drawer.
 */
export function MobileNav() {
  const location = useLocation();
  const handleLogout = useLogout();

  const itemClass = (active: boolean) =>
    cn(
      'flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 text-[11px] font-medium transition-colors motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
      active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
    );

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around p-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={itemClass(active)}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={handleLogout} aria-label="Sign out" className={cn(itemClass(false), 'hover:text-red-400')}>
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
