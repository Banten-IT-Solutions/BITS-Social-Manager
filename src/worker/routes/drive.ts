import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { driveConnections } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { signJWT, verifyJWT } from '../utils/jwt';
import { decrypt, encrypt } from '../utils/crypto';
import {
  buildConsentUrl,
  createFolder,
  DRIVE_ROOT_FOLDER,
  DriveError,
  driveConfigured,
  exchangeCode,
  getDriveConnection,
  getGoogleEmail,
  revokeToken,
} from '../utils/drive';
import type { Env, Variables } from '../index';

const OAUTH_STATE_TTL = 10 * 60; // 10 minutes

/** Authenticated Drive connection management (one connection per app user). */
export const driveRouter = new Hono<{ Bindings: Env; Variables: Variables }>();
driveRouter.use('*', authMiddleware);

driveRouter.get('/', async c => {
  const conn = await getDriveConnection(c.env, c.get('userId'));
  if (!conn) return c.json({ connection: null });
  return c.json({
    connection: {
      googleEmail: conn.googleEmail,
      connectedAt: conn.connectedAt.toISOString(),
      rootFolderId: conn.rootFolderId,
    },
  });
});

driveRouter.post('/connect', async c => {
  if (!driveConfigured(c.env)) {
    return c.json(
      { error: 'Google Drive is not configured on this server (missing OAuth credentials)' },
      503
    );
  }
  const state = await signJWT(
    { sub: c.get('userId'), email: c.get('userEmail'), name: c.get('userName') },
    c.env.JWT_SECRET,
    OAUTH_STATE_TTL
  );
  const redirectUri = new URL('/api/integrations/google/callback', c.req.url).toString();
  return c.json({ url: buildConsentUrl(c.env, state, redirectUri) });
});

driveRouter.delete('/', async c => {
  const userId = c.get('userId');
  const conn = await getDriveConnection(c.env, userId);
  if (!conn) return c.json({ success: true });

  try {
    const refreshToken = await decrypt(conn.refreshTokenEnc, c.env.ENCRYPTION_KEY);
    await revokeToken(refreshToken);
  } catch (err) {
    // Stored ciphertext may predate a key rotation; disconnecting locally is enough.
    console.error('[drive] could not revoke token (continuing)', err);
  }

  await getDb(c.env.DB).delete(driveConnections).where(eq(driveConnections.userId, userId));
  return c.json({ success: true });
});

/** Public OAuth callback — Google redirects the browser here (no bearer token). */
export const googleCallbackRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

googleCallbackRouter.get('/callback', async c => {
  const url = new URL(c.req.url);
  const origin = url.origin;
  const fail = (reason: string) =>
    c.redirect(`${origin}/profile?drive=error&reason=${encodeURIComponent(reason)}`);

  if (!driveConfigured(c.env)) return fail('not_configured');

  const oauthError = url.searchParams.get('error');
  if (oauthError) return fail(oauthError);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return fail('missing_code');

  let userId: string;
  try {
    const payload = await verifyJWT(state, c.env.JWT_SECRET);
    userId = payload.sub;
  } catch {
    return fail('invalid_state');
  }

  try {
    const redirectUri = `${origin}/api/integrations/google/callback`;
    const tokens = await exchangeCode(c.env, code, redirectUri);
    if (!tokens.refreshToken) return fail('missing_refresh_token');

    const googleEmail = await getGoogleEmail(tokens.accessToken);
    const db = getDb(c.env.DB);
    const existing = await db
      .select()
      .from(driveConnections)
      .where(eq(driveConnections.userId, userId))
      .get();

    const rootFolderId =
      existing?.rootFolderId ?? (await createFolder(tokens.accessToken, DRIVE_ROOT_FOLDER));

    const values = {
      userId,
      googleEmail,
      refreshTokenEnc: await encrypt(tokens.refreshToken, c.env.ENCRYPTION_KEY),
      accessTokenEnc: await encrypt(tokens.accessToken, c.env.ENCRYPTION_KEY),
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expiresIn,
      rootFolderId,
    };

    await db
      .insert(driveConnections)
      .values({ ...values, connectedAt: new Date() })
      .onConflictDoUpdate({
        target: driveConnections.userId,
        set: {
          googleEmail: values.googleEmail,
          refreshTokenEnc: values.refreshTokenEnc,
          accessTokenEnc: values.accessTokenEnc,
          expiresAt: values.expiresAt,
          rootFolderId: values.rootFolderId,
        },
      });

    return c.redirect(`${origin}/profile?drive=connected`);
  } catch (err) {
    console.error('[drive] OAuth callback failed', err);
    const reason = err instanceof DriveError ? err.message : 'connect_failed';
    return fail(reason);
  }
});
