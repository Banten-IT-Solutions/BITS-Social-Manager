import { ExternalLink, Film, Play } from 'lucide-react';
import type { Post } from '../lib/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui';
import { formatDateTime } from '../lib/utils';

/** Read-only video preview shared by the Content page and the Dashboard. */
export function PostPreviewDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
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
