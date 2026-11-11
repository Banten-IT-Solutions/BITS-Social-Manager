import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Film,
  HardDrive,
  Link2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { api, type PostInput } from '../lib/api';
import type { DriveConnectionInfo, Post, PostStatus, SocialAccount } from '../lib/types';
import { POST_STATUSES } from '../lib/types';
import { PlatformIcon, PLATFORM_COLORS, PLATFORM_BG } from '../components/PlatformIcon';
import {
  Alert,
  Badge,
  Button,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Textarea,
} from '../components/ui';
import { cn } from '../lib/utils';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<PostStatus, string> = {
  draft: 'border-zinc-700 bg-zinc-800 text-zinc-400',
  scheduled: 'border-violet-500/25 bg-violet-600/15 text-violet-300',
  published: 'border-emerald-500/25 bg-emerald-600/15 text-emerald-300',
  cancelled: 'border-red-500/25 bg-red-600/15 text-red-300',
};

const HEADER_CTA =
  'min-h-[44px] w-full shrink-0 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/20 transition-[background-color,box-shadow,transform] hover:bg-violet-500 active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-300 motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto';

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return null;
  const diffMinutes = Math.round((timestamp - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(Math.round(diffHours / 24), 'day');
}

/** ISO → value usable by <input type="datetime-local"> (local timezone). */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function DriveThumbnail({ post, className }: { post: Post; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-900',
        className
      )}
    >
      <Film className="h-5 w-5 text-zinc-600" aria-hidden="true" />
      {post.driveFileId && (
        <>
          <img
            src={`https://drive.google.com/thumbnail?id=${post.driveFileId}&sz=w480`}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            onError={event => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30"
          >
            <Play className="h-5 w-5 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </span>
        </>
      )}
    </div>
  );
}

interface PostDialogProps {
  open: boolean;
  onClose: () => void;
  post: Post | null;
  accounts: SocialAccount[];
  driveConnected: boolean;
  defaultAccountId?: string;
  onSaved: (post: Post) => void;
}

function PostDialog({
  open,
  onClose,
  post,
  accounts,
  driveConnected,
  defaultAccountId,
  onSaved,
}: PostDialogProps) {
  const isEdit = !!post;
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accountId, setAccountId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Identifies the open dialog session so late-arriving props can't reset edits. */
  const initKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initKeyRef.current = null;
      return;
    }
    const key = post?.id ?? 'new';
    if (initKeyRef.current === key) return;
    initKeyRef.current = key;

    setAccountId(post?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? '');
    setTitle(post?.title ?? '');
    setDescription(post?.description ?? '');
    setScheduledAt(toLocalInput(post?.scheduledAt ?? null));
    setStatus(post?.status ?? 'draft');
    setAttachmentUrl(post?.attachmentUrl ?? '');
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [open, post, defaultAccountId, accounts]);

  // Accounts may finish loading after the dialog opened — fill the default
  // account only while the field is still empty, never resetting user edits.
  useEffect(() => {
    if (!open || accountId) return;
    const fallback = post?.accountId ?? defaultAccountId ?? accounts[0]?.id;
    if (fallback) setAccountId(fallback);
  }, [open, accountId, post, defaultAccountId, accounts]);

  const handleFile = (selected: File | null) => {
    setError(null);
    if (selected && selected.size > MAX_VIDEO_BYTES) {
      setError('Video is too large (max 50 MB).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!accountId) return setError('Choose a social account.');
    if (!title.trim()) return setError('Title is required.');

    const iso = fromLocalInput(scheduledAt);
    if (status === 'scheduled' && !iso) {
      return setError('Pick a schedule date/time, or switch the status to Draft.');
    }
    if (file && !driveConnected) {
      return setError('Connect Google Drive in Profile before uploading a video.');
    }

    const payload: PostInput = {
      title: title.trim(),
      description: description.trim() || null,
      scheduledAt: iso,
      status,
      attachmentUrl: attachmentUrl.trim() || null,
      ...(isEdit ? { accountId } : {}),
    };

    setSaving(true);
    try {
      let result: { post: Post };
      if (file) {
        const form = new FormData();
        form.set('title', payload.title ?? '');
        if (payload.description) form.set('description', payload.description);
        if (iso) form.set('scheduledAt', iso);
        form.set('status', status);
        if (payload.attachmentUrl) form.set('attachmentUrl', payload.attachmentUrl);
        if (isEdit) form.set('accountId', accountId);
        form.set('video', file);
        result = isEdit
          ? await api.posts.update(post.accountId, post.id, form)
          : await api.posts.create(accountId, form);
      } else {
        result = isEdit
          ? await api.posts.update(post.accountId, post.id, payload)
          : await api.posts.create(accountId, payload);
      }
      onSaved(result.post);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} className="max-w-lg">
      <DialogContent>
        <DialogHeader icon={<CalendarClock className="h-4 w-4" />}>
          <DialogTitle>{isEdit ? 'Edit post' : 'New post'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <Alert variant="destructive">{error}</Alert>}

          <FormField label="Account" required>
            <CustomSelect
              value={accountId}
              onChange={setAccountId}
              options={accounts.map(account => ({
                value: account.id,
                label: `${account.accountName} · ${account.platform}`,
              }))}
              placeholder={accounts.length ? 'Select an account…' : 'No accounts yet'}
            />
          </FormField>

          <FormField label="Title" required>
            <Input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="e.g. Behind the scenes — episode 3"
              maxLength={200}
              autoFocus
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Caption / notes for this post…"
              rows={3}
              maxLength={5000}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Schedule">
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={event => setScheduledAt(event.target.value)}
              />
            </FormField>
            <FormField label="Status" required>
              <CustomSelect
                value={status}
                onChange={value => setStatus(value as PostStatus)}
                options={POST_STATUSES.map(value => ({ value, label: STATUS_LABELS[value] }))}
              />
            </FormField>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-medium text-zinc-400">Video</p>

            {!driveConnected ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs leading-relaxed text-zinc-500">
                Google Drive is not connected. Connect it in{' '}
                <strong className="text-zinc-300">Profile</strong> to upload videos — you can still
                save this post with an external video link.
              </div>
            ) : (
              <>
                {isEdit && post.driveFileId && (
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-300">
                        {post.attachmentName ?? 'Video in Google Drive'}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {file
                          ? 'A new file will replace this video (same Drive link).'
                          : 'Stored in the account folder in your Drive.'}
                      </p>
                    </div>
                    {post.attachmentUrl && (
                      <a
                        href={post.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 motion-reduce:transition-none"
                        aria-label="Open current video in Google Drive"
                        title="Open in Google Drive"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={event => handleFile(event.target.files?.[0] ?? null)}
                />

                {file ? (
                  <div className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-600/10 px-3 py-2">
                    <Film className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-200">{file.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      aria-label="Remove selected video"
                      onClick={() => handleFile(null)}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor={fileInputId}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 px-3 py-3 transition-colors hover:border-violet-500/50 hover:bg-zinc-900/60 focus-within:ring-2 focus-within:ring-violet-500/20 motion-reduce:transition-none"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-600/15 text-violet-300"
                    >
                      <Film className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-zinc-300">
                        Choose a video
                      </span>
                      <span className="block text-[11px] text-zinc-500">
                        MP4, MOV, WebM · max 50 MB · uploaded to your Drive
                      </span>
                    </span>
                  </label>
                )}
              </>
            )}

            <FormField label="External video link (optional)">
              <Input
                type="url"
                value={attachmentUrl}
                onChange={event => setAttachmentUrl(event.target.value)}
                placeholder="https://…"
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {isEdit ? 'Save changes' : 'Create post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePostDialog({
  post,
  onClose,
  onDeleted,
}: {
  post: Post | null;
  onClose: () => void;
  onDeleted: (post: Post) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [post]);

  const handleDelete = async () => {
    if (!post) return;
    setLoading(true);
    setError(null);
    try {
      await api.posts.remove(post.accountId, post.id);
      onDeleted(post);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!post} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader icon={<TriangleAlert className="h-4 w-4" />} tone="danger">
          <DialogTitle>Delete post</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Delete <strong className="text-zinc-200">{post?.title}</strong>? The plan is removed, but
          the video file <strong className="text-zinc-200">stays in Google Drive</strong> as an
          archive.
        </DialogDescription>
        {error && (
          <Alert variant="destructive" className="mt-3">
            {error}
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" loading={loading} onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  return (
    <Dialog open={!!post} onOpenChange={onClose} className="max-w-3xl">
      <DialogContent>
        <DialogHeader icon={<Play className="h-4 w-4" />}>
          <DialogTitle>{post?.title}</DialogTitle>
          <DialogDescription>
            {post?.account ? `${post.account.accountName} · ${post.account.platform} · ` : ''}
            {formatDateTime(post?.scheduledAt ?? null)}
          </DialogDescription>
        </DialogHeader>

        {post?.driveFileId ? (
          <div className="aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-black">
            <iframe
              src={`https://drive.google.com/file/d/${post.driveFileId}/preview`}
              title={`Video preview: ${post.title}`}
              className="h-full w-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-10 text-center">
            <Film className="h-8 w-8 text-zinc-700" aria-hidden="true" />
            <p className="text-sm text-zinc-400">No video attached to this post.</p>
            {post?.attachmentUrl && (
              <a href={post.attachmentUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="mt-1">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Open video link
                </Button>
              </a>
            )}
          </div>
        )}

        {post?.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
            {post.description}
          </p>
        )}

        <DialogFooter>
          {post?.attachmentUrl && (
            <a href={post.attachmentUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Open in Drive
              </Button>
            </a>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [drive, setDrive] = useState<DriveConnectionInfo | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterAccount, setFilterAccount] = useState(
    () => new URLSearchParams(window.location.search).get('accountId') ?? 'all'
  );
  const [filterStatus, setFilterStatus] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [deletePost, setDeletePost] = useState<Post | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postRes, accountRes, driveRes] = await Promise.all([
        api.posts.list(),
        api.accounts.list(),
        api.drive.status(),
      ]);
      setPosts(postRes.posts);
      setAccounts(accountRes.accounts);
      setDrive(driveRes.connection);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load content plan');
    } finally {
      setLoading(false);
      setDriveLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts
      .filter(post => {
        if (filterAccount !== 'all' && post.accountId !== filterAccount) return false;
        if (filterStatus !== 'all' && post.status !== filterStatus) return false;
        if (!query) return true;
        return (
          post.title.toLowerCase().includes(query) ||
          (post.description?.toLowerCase().includes(query) ?? false) ||
          (post.account?.accountName.toLowerCase().includes(query) ?? false) ||
          (post.account?.platform.toLowerCase().includes(query) ?? false) ||
          (post.account?.projectName?.toLowerCase().includes(query) ?? false)
        );
      })
      .sort((a, b) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
  }, [posts, search, filterAccount, filterStatus]);

  const pushPost = (saved: Post) => {
    setPosts(prev => {
      const exists = prev.some(item => item.id === saved.id);
      return exists ? prev.map(item => (item.id === saved.id ? saved : item)) : [saved, ...prev];
    });
  };

  const handleDeleted = (deleted: Post) => {
    setPosts(prev => prev.filter(item => item.id !== deleted.id));
  };

  const openCreate = () => {
    setEditPost(null);
    setDialogOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditPost(post);
    setDialogOpen(true);
  };

  const defaultAccountId = filterAccount !== 'all' ? filterAccount : (accounts[0]?.id ?? undefined);

  const scheduledTotal = posts.filter(post => post.status === 'scheduled').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <header className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-violet-600/10"
            >
              <CalendarClock className="h-5 w-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Content Plan</h1>
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <CalendarClock className="h-3 w-3" aria-hidden="true" />
                  {scheduledTotal} scheduled
                </Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                Plan posts, schedule them, and upload videos to your Google Drive.
              </p>
            </div>
          </div>

          <Button onClick={openCreate} className={HEADER_CTA}>
            <span
              aria-hidden="true"
              className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
            >
              <Plus className="h-3.5 w-3.5" />
            </span>
            New post
          </Button>
        </div>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}

      {!driveLoading && !drive && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-zinc-100">Google Drive is not connected</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                Connect it once in Profile, then upload videos directly with each post — one folder
                per social account.
              </p>
            </div>
          </div>
          <a href="/profile" className="shrink-0">
            <Button variant="outline">Open Profile</Button>
          </a>
        </div>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 id="upcoming-heading" className="text-sm font-semibold text-zinc-200">
              Upcoming
            </h2>
            <Badge variant="secondary">{upcoming.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map(post => (
              <button
                key={post.id}
                type="button"
                onClick={() => (post.driveFileId ? setPreviewPost(post) : openEdit(post))}
                className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 text-left transition-[border-color,background-color] hover:border-zinc-700 hover:bg-zinc-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 motion-reduce:transition-none"
                aria-label={post.driveFileId ? `Preview ${post.title}` : `Edit ${post.title}`}
              >
                <DriveThumbnail
                  post={post}
                  className="aspect-video w-full rounded-none border-0 border-b"
                />
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-medium text-zinc-100">{post.title}</p>
                    <StatusBadge status={post.status as PostStatus} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded',
                        PLATFORM_BG[post.account?.platform ?? 'TikTok']
                      )}
                    >
                      <PlatformIcon
                        platform={post.account?.platform ?? 'TikTok'}
                        className={cn(
                          'h-3.5 w-3.5',
                          PLATFORM_COLORS[post.account?.platform ?? 'TikTok']
                        )}
                      />
                    </span>
                    <span className="truncate">{post.account?.accountName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">{formatDateTime(post.scheduledAt)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search posts…"
            aria-label="Search posts"
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <CustomSelect
          value={filterAccount}
          onChange={setFilterAccount}
          options={[
            { value: 'all', label: `All accounts (${accounts.length})` },
            ...accounts.map(account => ({
              value: account.id,
              label: `${account.accountName} · ${account.platform}`,
            })),
          ]}
          className="sm:w-56"
        />
        <CustomSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'all', label: 'All statuses' },
            ...POST_STATUSES.map(value => ({ value, label: STATUS_LABELS[value] })),
          ]}
          className="sm:w-44"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(index => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/30 motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <CalendarClock className="h-10 w-10 text-zinc-700" aria-hidden="true" />
          <p className="text-sm text-zinc-500">
            Create a project and add a social account before planning posts.
          </p>
          <a href="/projects">
            <Button variant="outline">Go to Projects</Button>
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <CalendarClock className="h-10 w-10 text-zinc-700" aria-hidden="true" />
          <p className="text-sm text-zinc-500">
            {posts.length === 0 ? 'No content planned yet.' : 'No posts match your filters.'}
          </p>
          {posts.length === 0 && (
            <Button variant="outline" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Create your first post
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(post => {
            const relative = relativeTime(post.scheduledAt);
            return (
              <div
                key={post.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 transition-[border-color,background-color] hover:border-zinc-700 hover:bg-zinc-900/50 sm:flex-row sm:items-center motion-reduce:transition-none"
              >
                <button
                  type="button"
                  onClick={() => setPreviewPost(post)}
                  className="group w-full shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:w-24"
                  aria-label={`Preview ${post.title}`}
                >
                  <DriveThumbnail post={post} className="aspect-video w-full sm:h-14" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-zinc-100">
                      {post.title}
                    </p>
                    <StatusBadge status={post.status as PostStatus} />
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded',
                          PLATFORM_BG[post.account?.platform ?? 'TikTok']
                        )}
                      >
                        <PlatformIcon
                          platform={post.account?.platform ?? 'TikTok'}
                          className={cn(
                            'h-3 w-3',
                            PLATFORM_COLORS[post.account?.platform ?? 'TikTok']
                          )}
                        />
                      </span>
                      {post.account?.accountName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{post.account?.platform}</span>
                    {post.account?.projectName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{post.account.projectName}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{formatDateTime(post.scheduledAt)}</span>
                    {relative && <span className="text-zinc-600">({relative})</span>}
                    {post.driveFileId && (
                      <span className="inline-flex items-center gap-1 text-violet-400/80">
                        <HardDrive className="h-3 w-3" aria-hidden="true" />
                        Drive
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPreviewPost(post)}
                    aria-label={`Preview ${post.title}`}
                    title="Preview video"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  {post.attachmentUrl && (
                    <a
                      href={post.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 motion-reduce:transition-none"
                      aria-label={`Open video for ${post.title}`}
                      title="Open video"
                    >
                      <Link2 className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(post)}
                    aria-label={`Edit ${post.title}`}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-red-400"
                    onClick={() => setDeletePost(post)}
                    aria-label={`Delete ${post.title}`}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PostDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditPost(null);
        }}
        post={editPost}
        accounts={accounts}
        driveConnected={!!drive}
        defaultAccountId={defaultAccountId}
        onSaved={pushPost}
      />
      <DeletePostDialog
        post={deletePost}
        onClose={() => setDeletePost(null)}
        onDeleted={handleDeleted}
      />
      <PreviewDialog post={previewPost} onClose={() => setPreviewPost(null)} />
    </div>
  );
}
