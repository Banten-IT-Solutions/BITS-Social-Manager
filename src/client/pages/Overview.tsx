import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Calendar,
  FolderOpen,
  KeyRound,
  LayoutGrid,
  ChevronRight,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Post, Project, SocialAccount, Platform } from '../lib/types';
import { PlatformIcon, PLATFORM_COLORS, PLATFORM_BG } from '../components/PlatformIcon';
import { UpcomingPostCard } from '../components/PostCard';
import { PostPreviewDialog } from '../components/PostPreviewDialog';
import { Badge, Button, Alert } from '../components/ui';
import { cn, formatDate } from '../lib/utils';

/** Decorative violet tile behind header icons (matches Projects / Project headers). */
const HEADER_ICON_TILE =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-violet-600/10';

export function OverviewPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, a, content] = await Promise.all([
          api.projects.list(),
          api.accounts.list(),
          api.posts.list(),
        ]);
        if (!cancelled) {
          setProjects(p.projects);
          setAccounts(a.accounts);
          setPosts(content.posts);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const platformCounts = useMemo(() => {
    const counts = new Map<Platform, number>();
    for (const a of accounts) {
      const p = a.platform as Platform;
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    return [...counts.entries()].sort((x, y) => y[1] - x[1]);
  }, [accounts]);

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [projects]
  );

  const upcoming = useMemo(
    () =>
      posts
        .filter(
          post =>
            post.status === 'scheduled' &&
            post.scheduledAt &&
            new Date(post.scheduledAt).getTime() >= Date.now()
        )
        .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
        .slice(0, 3),
    [posts]
  );

  const scheduledCount = useMemo(
    () => posts.filter(post => post.status === 'scheduled').length,
    [posts]
  );

  const maxCount = platformCounts[0]?.[1] ?? 0;

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderOpen },
    { label: 'Accounts', value: accounts.length, icon: KeyRound },
    { label: 'Platforms', value: platformCounts.length, icon: LayoutGrid },
    { label: 'Scheduled', value: scheduledCount, icon: CalendarClock },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent"
        />
        <div className="relative flex items-center gap-3">
          <div className={HEADER_ICON_TILE}>
            <LayoutGrid className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Projects, accounts, and upcoming content at a glance.
            </p>
          </div>
        </div>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-hidden="true">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {stats.map(s => (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <div className={cn(HEADER_ICON_TILE, 'h-10 w-10')}>
                  <s.icon className="h-5 w-5 text-violet-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-zinc-100">
                    {s.value}
                  </p>
                  <p className="text-sm text-zinc-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {upcoming.length > 0 && (
            <section aria-labelledby="dashboard-upcoming-heading" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2
                    id="dashboard-upcoming-heading"
                    className="text-sm font-semibold text-zinc-200"
                  >
                    Upcoming content
                  </h2>
                  <Badge variant="secondary">{upcoming.length}</Badge>
                </div>
                <Link
                  to="/content"
                  className="rounded text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                >
                  View content plan
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {upcoming.map(post => (
                  <UpcomingPostCard
                    key={post.id}
                    post={post}
                    actionLabel={post.driveFileId ? 'Preview' : 'Open'}
                    onOpen={post =>
                      post.driveFileId ? setPreviewPost(post) : navigate('/content')
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 py-16 space-y-3">
              <FolderOpen className="h-10 w-10 text-zinc-700" aria-hidden="true" />
              <p className="text-sm text-zinc-500">
                Nothing here yet — create your first project to start storing credentials.
              </p>
              <Button variant="primary" onClick={() => navigate('/projects')}>
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Go to projects
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Recent projects */}
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
                <header className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-3.5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <TrendingUp className="h-4 w-4 text-violet-400" aria-hidden="true" />
                    Recent projects
                  </h2>
                  <Link
                    to="/projects"
                    className="text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded"
                  >
                    View all
                  </Link>
                </header>
                <ul className="divide-y divide-zinc-800/60">
                  {recentProjects.map(p => (
                    <li key={p.id}>
                      <Link
                        to={`/projects/${p.id}`}
                        className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-800/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-400"
                      >
                        <div className={cn(HEADER_ICON_TILE, 'h-9 w-9 rounded-lg')}>
                          <FolderOpen className="h-4 w-4 text-violet-400" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-100">{p.name}</p>
                          <p className="flex items-center gap-1 text-xs text-zinc-500">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            {formatDate(p.createdAt)}
                          </p>
                        </div>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-zinc-600"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Platform breakdown */}
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
                <header className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-3.5">
                  <h2 className="text-sm font-semibold text-zinc-200">Accounts per platform</h2>
                  <Badge variant="secondary">{accounts.length} total</Badge>
                </header>
                <div className="space-y-3 px-5 py-4">
                  {platformCounts.length === 0 ? (
                    <p className="text-sm text-zinc-500">No accounts stored yet.</p>
                  ) : (
                    platformCounts.map(([platform, count]) => (
                      <div key={platform} className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            PLATFORM_BG[platform]
                          )}
                        >
                          <PlatformIcon
                            platform={platform}
                            className={cn('h-4 w-4', PLATFORM_COLORS[platform])}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="truncate text-zinc-300">{platform}</span>
                            <span className="tabular-nums text-zinc-500">{count}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-violet-500/70 transition-[width] duration-500 motion-reduce:transition-none"
                              style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </>
      )}

      <PostPreviewDialog post={previewPost} onClose={() => setPreviewPost(null)} />
    </div>
  );
}
