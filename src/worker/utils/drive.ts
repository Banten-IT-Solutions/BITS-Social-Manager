import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { driveConnections, socialAccounts } from '../db/schema';
import { decrypt, encrypt } from './crypto';
import type { Env } from '../index';

export type { Env };

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file openid email';

/** Root folder name in the user's Drive. */
export const DRIVE_ROOT_FOLDER = 'BITS Social Manager';

/** Worker memory ceiling makes larger multipart bodies risky. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type DriveErrorStatus = 400 | 401 | 404 | 409 | 413 | 502;

export class DriveError extends Error {
  constructor(
    public status: DriveErrorStatus,
    message: string
  ) {
    super(message);
    this.name = 'DriveError';
  }
}

export interface DriveTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DriveFile {
  id: string;
  name?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

export function driveConfigured(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

/** Drive-safe folder name: `{platform} — {accountName}`. */
export function folderNameFor(platform: string, accountName: string): string {
  const name = `${platform} — ${accountName}`
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return name || 'Social account';
}

/** Drive file name follows the post title, keeping the original extension. */
export function driveFileName(title: string, originalName: string): string {
  const safeTitle = title
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
  const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '';
  return `${safeTitle || 'Video'}${ext.slice(0, 12)}`;
}

export function buildConsentUrl(env: Env, state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DRIVE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function tokenRequest(env: Env, body: Record<string, string>): Promise<DriveTokens> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID ?? '',
      client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
      ...body,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data['access_token'] !== 'string') {
    console.error('[drive] token endpoint failed', res.status, data['error']);
    const expired = data['error'] === 'invalid_grant';
    throw new DriveError(
      expired ? 409 : 502,
      expired
        ? 'Google Drive connection expired. Reconnect Google Drive in Profile.'
        : 'Could not authenticate with Google Drive'
    );
  }
  return {
    accessToken: data['access_token'],
    refreshToken: typeof data['refresh_token'] === 'string' ? data['refresh_token'] : '',
    expiresIn: typeof data['expires_in'] === 'number' ? data['expires_in'] : 3600,
  };
}

export function exchangeCode(env: Env, code: string, redirectUri: string): Promise<DriveTokens> {
  return tokenRequest(env, { code, redirect_uri: redirectUri, grant_type: 'authorization_code' });
}

export async function getGoogleEmail(accessToken: string): Promise<string> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data['email'] !== 'string') {
    throw new DriveError(502, 'Could not read the connected Google account email');
  }
  return data['email'];
}

export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });
  } catch (err) {
    console.error('[drive] revoke failed (ignored)', err);
  }
}

export async function getDriveConnection(env: Env, userId: string) {
  const db = getDb(env.DB);
  return db.select().from(driveConnections).where(eq(driveConnections.userId, userId)).get();
}

/**
 * Returns a live access token, refreshing and re-encrypting it when expired.
 * Throws DriveError(409) when the user must reconnect.
 */
export async function getValidAccessToken(env: Env, userId: string): Promise<string> {
  const db = getDb(env.DB);
  const conn = await getDriveConnection(env, userId);
  if (!conn) throw new DriveError(409, 'Google Drive is not connected');

  const now = Math.floor(Date.now() / 1000);
  if (conn.accessTokenEnc && conn.expiresAt && conn.expiresAt > now + 60) {
    return decrypt(conn.accessTokenEnc, env.ENCRYPTION_KEY);
  }

  let refreshToken: string;
  try {
    refreshToken = await decrypt(conn.refreshTokenEnc, env.ENCRYPTION_KEY);
  } catch {
    throw new DriveError(409, 'Google Drive connection is corrupted. Reconnect Google Drive.');
  }

  const tokens = await tokenRequest(env, {
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const accessTokenEnc = await encrypt(tokens.accessToken, env.ENCRYPTION_KEY);
  await db
    .update(driveConnections)
    .set({ accessTokenEnc, expiresAt: now + tokens.expiresIn })
    .where(eq(driveConnections.userId, userId));
  return tokens.accessToken;
}

async function googleFailure(res: Response, fallback: string): Promise<DriveError> {
  const body = await res.text().catch(() => '');
  console.error('[drive] Google API error', res.status, body.slice(0, 500));
  if (res.status === 401) {
    return new DriveError(409, 'Google Drive connection expired. Reconnect Google Drive.');
  }
  if (res.status === 404) {
    return new DriveError(404, 'The video file was not found in Google Drive');
  }
  return new DriveError(502, fallback);
}

async function folderExists(accessToken: string, folderId: string): Promise<boolean> {
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(folderId)}?fields=id`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) return false;
  if (!res.ok) throw await googleFailure(res, 'Could not access Google Drive folders');
  return true;
}

export async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string | null
): Promise<string> {
  const res = await fetch(`${DRIVE_API}/files?fields=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data['id'] !== 'string') {
    throw await googleFailure(res, 'Could not create a Google Drive folder');
  }
  return data['id'];
}

export async function ensureRootFolder(
  env: Env,
  userId: string,
  accessToken: string
): Promise<string> {
  const db = getDb(env.DB);
  const conn = await getDriveConnection(env, userId);
  if (conn?.rootFolderId && (await folderExists(accessToken, conn.rootFolderId))) {
    return conn.rootFolderId;
  }
  const id = await createFolder(accessToken, DRIVE_ROOT_FOLDER);
  await db
    .update(driveConnections)
    .set({ rootFolderId: id })
    .where(eq(driveConnections.userId, userId));
  return id;
}

/** Lazily creates (and persists) the per-social-account subfolder. */
export async function ensureAccountFolder(
  env: Env,
  userId: string,
  account: { id: string; platform: string; accountName: string; driveFolderId?: string | null },
  accessToken: string
): Promise<string> {
  if (account.driveFolderId && (await folderExists(accessToken, account.driveFolderId))) {
    return account.driveFolderId;
  }
  const rootId = await ensureRootFolder(env, userId, accessToken);
  const id = await createFolder(
    accessToken,
    folderNameFor(account.platform, account.accountName),
    rootId
  );
  await getDb(env.DB)
    .update(socialAccounts)
    .set({ driveFolderId: id })
    .where(eq(socialAccounts.id, account.id));
  return id;
}

/** Share the file so the Drive `/preview` iframe works for anyone with the link. */
export async function setAnyoneReader(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}/permissions?fields=id&sendNotificationEmail=false`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone', allowFileDiscovery: false }),
    }
  );
  if (!res.ok) {
    throw await googleFailure(
      res,
      'Could not enable video preview (Google Drive sharing may be restricted)'
    );
  }
}

/** Creates the file via a resumable session, streaming the body straight through. */
export async function uploadVideoFile(
  accessToken: string,
  parentId: string,
  name: string,
  mimeType: string,
  body: BodyInit,
  byteLength?: number
): Promise<DriveFile> {
  const init = await fetch(
    `${DRIVE_UPLOAD}/files?uploadType=resumable&fields=id,name,webViewLink,thumbnailLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        ...(byteLength ? { 'X-Upload-Content-Length': String(byteLength) } : {}),
      },
      body: JSON.stringify({ name, mimeType, parents: [parentId] }),
    }
  );
  if (!init.ok) throw await googleFailure(init, 'Could not start the Google Drive upload');

  const sessionUrl = init.headers.get('Location');
  if (!sessionUrl) throw new DriveError(502, 'Google Drive did not return an upload session');

  const upload = await fetch(sessionUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body,
  });
  const file = (await upload.json().catch(() => ({}))) as Record<string, unknown>;
  if (!upload.ok || typeof file['id'] !== 'string') {
    throw await googleFailure(upload, 'Could not upload the video to Google Drive');
  }
  await setAnyoneReader(accessToken, file['id']);
  return {
    id: file['id'],
    name: typeof file['name'] === 'string' ? file['name'] : undefined,
    webViewLink: typeof file['webViewLink'] === 'string' ? file['webViewLink'] : undefined,
    thumbnailLink: typeof file['thumbnailLink'] === 'string' ? file['thumbnailLink'] : undefined,
  };
}

/** Replaces the content of an existing file, keeping its id/link/permissions. */
export async function replaceVideoContent(
  accessToken: string,
  fileId: string,
  mimeType: string,
  body: BodyInit
): Promise<DriveFile> {
  const res = await fetch(
    `${DRIVE_UPLOAD}/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,name,webViewLink,thumbnailLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body,
    }
  );
  const file = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof file['id'] !== 'string') {
    throw await googleFailure(res, 'Could not replace the video in Google Drive');
  }
  await setAnyoneReader(accessToken, file['id']);
  return {
    id: file['id'],
    name: typeof file['name'] === 'string' ? file['name'] : undefined,
    webViewLink: typeof file['webViewLink'] === 'string' ? file['webViewLink'] : undefined,
    thumbnailLink: typeof file['thumbnailLink'] === 'string' ? file['thumbnailLink'] : undefined,
  };
}

export interface FileMetadataPatch {
  name?: string;
  addParents?: string | null;
  removeParents?: string | null;
}

/** Renames and/or moves a Drive file between account folders. */
export async function updateFileMeta(
  accessToken: string,
  fileId: string,
  patch: FileMetadataPatch
): Promise<void> {
  const params = new URLSearchParams({ fields: 'id,name,webViewLink' });
  if (patch.addParents) params.set('addParents', patch.addParents);
  if (patch.removeParents) params.set('removeParents', patch.removeParents);

  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(patch.name ? { name: patch.name } : {}),
  });
  if (!res.ok) throw await googleFailure(res, 'Could not update the video in Google Drive');
}
