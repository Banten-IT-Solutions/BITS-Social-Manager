export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  /** ISO string over the wire, unix seconds in older clients. */
  createdAt: number | string;
  updatedAt: number | string;
}

export interface SocialAccount {
  id: string;
  projectId: string;
  platform: Platform;
  accountName: string;
  emailHandle: string;
  notes?: string | null;
  password?: string; // only returned on GET /:id
  /** Number of scheduled posts for this account (list endpoint only). */
  scheduledPosts?: number;
  createdAt: number;
  updatedAt: number;
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'cancelled';

export const POST_STATUSES = ['draft', 'scheduled', 'published', 'cancelled'] as const;

/** Lightweight account/project info attached to a post in list responses. */
export interface PostAccount {
  id: string;
  projectId: string;
  platform: Platform;
  accountName: string;
  projectName?: string;
}

export interface Post {
  id: string;
  userId: string;
  accountId: string;
  title: string;
  description?: string | null;
  /** ISO string over the wire (null = unscheduled draft). */
  scheduledAt: string | null;
  status: PostStatus;
  driveFileId?: string | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  account?: PostAccount;
}

export interface DriveConnectionInfo {
  googleEmail: string;
  connectedAt: string;
  rootFolderId?: string | null;
}

export const PLATFORMS = [
  'Gmail',
  'YouTube',
  'Facebook',
  'Instagram',
  'Threads',
  'WhatsApp',
  'Telegram',
  'TikTok',
  'Shopee',
  'X',
  'LinkedIn',
  'GitHub',
] as const;

export type Platform = (typeof PLATFORMS)[number];
