import { describe, it, expect } from 'vitest';
import {
  buildConsentUrl,
  driveFileName,
  folderNameFor,
  DRIVE_ROOT_FOLDER,
  MAX_VIDEO_BYTES,
  type Env,
} from '../../src/worker/utils/drive';

const env = {
  GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'client-secret',
} as Env;

describe('Google Drive helpers', () => {
  it('builds a consent URL with offline access and the drive.file scope', () => {
    const url = new URL(buildConsentUrl(env, 'state-123', 'https://app.test/callback'));
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.pathname).toBe('/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe(env.GOOGLE_CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/callback');
    expect(url.searchParams.get('state')).toBe('state-123');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('scope')).toContain('auth/drive.file');
  });

  it('exposes the documented root folder and 50 MB upload limit', () => {
    expect(DRIVE_ROOT_FOLDER).toBe('BITS Social Manager');
    expect(MAX_VIDEO_BYTES).toBe(50 * 1024 * 1024);
  });

  it('sanitises account folder names for Drive', () => {
    expect(folderNameFor('Instagram', 'Kopi Senja')).toBe('Instagram — Kopi Senja');
    expect(folderNameFor('TikTok', 'A/B:C*D?E"F<G>H|I')).toBe('TikTok — A-B-C-D-E-F-G-H-I');
    expect(folderNameFor('X', '   ')).toBe('X —');
  });

  it('caps folder names at 120 characters', () => {
    const name = folderNameFor('Instagram', 'a'.repeat(500));
    expect(name.length).toBeLessThanOrEqual(120);
  });

  it('derives the Drive file name from the post title and keeps the extension', () => {
    expect(driveFileName('Episode 1', 'clip.MP4')).toBe('Episode 1.MP4');
    expect(driveFileName('A/B: C', 'video.webm')).toBe('A-B- C.webm');
    expect(driveFileName('', 'video.mov')).toBe('Video.mov');
    expect(driveFileName('No extension', 'clip')).toBe('No extension');
  });
});
