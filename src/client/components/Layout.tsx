import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
