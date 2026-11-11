import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Timestamps arrive as ISO strings (JSON) or unix seconds — accept both. */
function toDate(v: number | string): Date {
  return typeof v === 'string' ? new Date(v) : new Date(v * 1000);
}

export function formatDate(v: number | string): string {
  const d = toDate(v);
  return isNaN(d.getTime())
    ? 'Recently'
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d);
}
