import { Film, Play } from 'lucide-react';
import type { Post } from '../lib/types';
import { PlatformIcon, PLATFORM_BG, PLATFORM_COLORS } from './PlatformIcon';
import { cn, formatDateTime } from '../lib/utils';

/**
 * Video thumbnail for a post. Drive renders portrait videos as tall images, so
 * the sharp frame is contained inside the fixed 16:9 box with a blurred cover
 * behind it. Card heights stay identical for 16:9, 1:1 and 9:16 sources.
 */
export function DriveThumbnail({ post, className }: { post: Post; className?: string }) {
  const thumbnailUrl = post.driveFileId
    ? `https://drive.google.com/thumbnail?id=${post.driveFileId}&sz=w480`
    : null;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-900',
        className
      )}
    >
      <Film className="h-5 w-5 text-zinc-600" aria-hidden="true" />
      {thumbnailUrl && (
        <>
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-lg"
            onError={event => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 z-10 h-full w-full object-contain"
            onError={event => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30"
          >
            <Play className="h-5 w-5 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Upcoming post card shared by the Content page and the Dashboard so both keep
 * the same media box, two-line title reservation and bottom-aligned metadata.
 */
export function UpcomingPostCard({
  post,
  onOpen,
  actionLabel,
}: {
  post: Post;
  onOpen: (post: Post) => void;
  actionLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 text-left transition-[border-color,background-color] hover:border-zinc-700 hover:bg-zinc-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 motion-reduce:transition-none"
      aria-label={`${actionLabel} ${post.title}`}
    >
      <DriveThumbnail
        post={post}
        className="aspect-video w-full shrink-0 rounded-none border-0 border-b"
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Reserve two lines so every card keeps the same height; long titles
            are clamped and exposed in full via the tooltip. */}
        <p
          className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-zinc-100"
          title={post.title}
        >
          {post.title}
        </p>
        <div className="mt-auto flex items-center gap-2 text-xs text-zinc-500">
          <span
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded',
              PLATFORM_BG[post.account?.platform ?? 'TikTok']
            )}
          >
            <PlatformIcon
              platform={post.account?.platform ?? 'TikTok'}
              className={cn('h-3.5 w-3.5', PLATFORM_COLORS[post.account?.platform ?? 'TikTok'])}
            />
          </span>
          <span className="min-w-0 flex-1 truncate" title={post.account?.accountName}>
            {post.account?.accountName}
          </span>
          <span className="shrink-0 whitespace-nowrap">{formatDateTime(post.scheduledAt)}</span>
        </div>
      </div>
    </button>
  );
}
