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
  createdAt: number;
  updatedAt: number;
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
