import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, User, LogOut, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLogout } from '../hooks/useLogout';
import { cn } from '../lib/utils';
import { Tooltip } from './ui';

interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Route path — when present the item renders as a link, otherwise as an action button. */
  to?: string;
  onSelect?: () => void;
}

// Desktop sidebar navigation entries.
const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Projects' },
  { to: '/profile', icon: User, label: 'Profile' },
];

interface SidebarContentProps {
  items: NavItem[];
  footerItems: NavItem[];
  pathname: string;
}

function SidebarContent({ items, footerItems, pathname }: SidebarContentProps) {
  const rowClass = (...extra: Array<string | undefined>) =>
    cn(
      'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
      ...extra
    );

  const renderControl = (item: NavItem, extraClassName?: string) => {
    const Icon = item.icon;
    const active = item.to !== undefined && pathname.startsWith(item.to);
    const className = rowClass(
      active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
      extraClassName
    );
    const children = <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />;
    if (item.to) {
      return (
        <Link key={item.label} to={item.to} aria-current={active ? 'page' : undefined} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <button key={item.label} type="button" onClick={item.onSelect} className={className}>
        {children}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Desktop header - centered logo tile */}
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-zinc-800">
        <Tooltip content="BITS Social Manager" side="right">
          <Link
            to="/dashboard"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400"
          >
            <Shield className="h-5 w-5 text-white" aria-hidden="true" />
          </Link>
        </Tooltip>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-2 p-3">
        {items.map((item) => (
          <Tooltip key={item.label} content={item.label} side="right">
            {renderControl(item)}
          </Tooltip>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="border-t border-zinc-800 p-3 flex flex-col items-center">
        {footerItems.map((item) => (
          <Tooltip key={item.label} content={item.label} side="right">
            {renderControl(item, 'hover:text-red-400')}
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const location = useLocation();
  const handleLogout = useLogout();

  // Footer actions (single definition).
  const footerItems: NavItem[] = [{ label: 'Sign out', icon: LogOut, onSelect: handleLogout }];

  // Desktop sidebar - Ultra compact
  return (
    <div className="hidden lg:flex lg:w-16 h-screen flex-col fixed left-0 top-0">
      <SidebarContent items={navItems} footerItems={footerItems} pathname={location.pathname} />
    </div>
  );
}
