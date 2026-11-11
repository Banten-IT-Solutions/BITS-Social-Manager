import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DriveError,
  replaceVideoContent,
  updateFileMeta,
  uploadVideoFile,
} from '../../src/worker/utils/drive';

type FetchCall = { url: string; init?: RequestInit };

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string) => Response | Promise<Response>): FetchCall[] {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    return handler(url);
  }) as typeof fetch;
  return calls;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('Drive upload flow', () => {
  it('uploads through a resumable session, then shares the file anyone/reader', async () => {
    const calls = mockFetch(url => {
      if (url.includes('uploadType=resumable')) {
        return new Response(null, {
          status: 200,
          headers: { Location: 'https://upload.example/session-1' },
        });
      }
      if (url === 'https://upload.example/session-1') {
        return Response.json({
          id: 'file-1',
          name: 'Episode 1.mp4',
          webViewLink: 'https://drive.google.com/file/d/file-1/view',
        });
      }
      if (url.includes('/permissions')) return Response.json({ id: 'perm-1' });
      return new Response('unexpected', { status: 500 });
    });

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' });
    const file = await uploadVideoFile(
      'access-token',
      'folder-1',
      'Episode 1.mp4',
      'video/mp4',
      blob,
      blob.size
    );

    expect(file.id).toBe('file-1');
    expect(file.webViewLink).toContain('file-1');

    const init = calls.find(call => call.url.includes('uploadType=resumable'));
    expect(init?.init?.method).toBe('POST');
    expect(JSON.parse(String(init?.init?.body))).toMatchObject({
      name: 'Episode 1.mp4',
      parents: ['folder-1'],
    });

    const upload = calls.find(call => call.url === 'https://upload.example/session-1');
    expect(upload?.init?.method).toBe('PUT');

    const permission = calls.find(call => call.url.includes('/permissions'));
    expect(JSON.parse(String(permission?.init?.body))).toMatchObject({
      role: 'reader',
      type: 'anyone',
      allowFileDiscovery: false,
    });
  });

  it('maps an unauthorized Google response to a reconnect-required DriveError (409)', async () => {
    mockFetch(() => new Response('invalid credentials', { status: 401 }));
    const blob = new Blob(['x'], { type: 'video/mp4' });
    await expect(replaceVideoContent('token', 'file-1', 'video/mp4', blob)).rejects.toMatchObject({
      name: 'DriveError',
      status: 409,
    });
  });

  it('fails the upload when the file cannot be shared publicly', async () => {
    mockFetch(url => {
      if (url.includes('uploadType=resumable')) {
        return new Response(null, {
          status: 200,
          headers: { Location: 'https://upload.example/session-2' },
        });
      }
      if (url === 'https://upload.example/session-2') return Response.json({ id: 'file-2' });
      return new Response('sharing disabled by admin', { status: 403 });
    });

    const blob = new Blob(['x'], { type: 'video/mp4' });
    const error = await uploadVideoFile('token', 'folder', 'v.mp4', 'video/mp4', blob).catch(
      err => err
    );
    expect(error).toBeInstanceOf(DriveError);
    expect((error as DriveError).status).toBe(502);
  });
});

describe('Drive metadata updates', () => {
  it('moves a file between account folders and renames it', async () => {
    const calls = mockFetch(() => Response.json({ id: 'file-1' }));
    await updateFileMeta('token', 'file-1', {
      name: 'New title.mp4',
      addParents: 'folder-new',
      removeParents: 'folder-old',
    });

    const call = calls[0]!;
    const url = new URL(call.url);
    expect(url.pathname).toBe('/drive/v3/files/file-1');
    expect(url.searchParams.get('addParents')).toBe('folder-new');
    expect(url.searchParams.get('removeParents')).toBe('folder-old');
    expect(JSON.parse(String(call.init?.body))).toEqual({ name: 'New title.mp4' });
  });
});
