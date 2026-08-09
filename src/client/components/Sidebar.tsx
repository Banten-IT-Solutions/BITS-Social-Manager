import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, User, LogOut, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Tooltip } from './ui';

const navItems = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Projects' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Logo - Shield Icon */}
      <div className="flex h-14 items-center justify-center border-b border-zinc-800">
        <Tooltip content="BITS Social Manager" side="right">
          <Link to="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors">
            <Shield className="h-5 w-5 text-white" />
          </Link>
        </Tooltip>
      </div>

      {/* Nav - Icons Only */}
      <nav className="flex-1 flex flex-col items-center gap-2 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Tooltip key={to} content={label} side="right">
            <Link
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(to)
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </Tooltip>
        ))}
      </nav>

      {/* Logout Only */}
      <div className="border-t border-zinc-800 p-3 flex flex-col items-center">
        <Tooltip content="Sign out" side="right">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-zinc-400 hover:bg-zinc-800/50 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-16 h-full"><SidebarContent /></div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar - Ultra compact */}
      <div className="hidden lg:flex lg:w-16 h-screen flex-col fixed left-0 top-0">
        <SidebarContent />
      </div>
    </>
  );
}
