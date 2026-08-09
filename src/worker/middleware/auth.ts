import type { Context, Next } from 'hono';
import { verifyJWT } from '../utils/jwt';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { users } from '../db/schema';
import type { Env, Variables } from '../index';

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.slice(7);
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    const db = getDb(c.env.DB);
    const user = await db.select({ tokenVersion: users.tokenVersion }).from(users).where(eq(users.id, payload.sub)).get();
    if (!user || (user.tokenVersion ?? 0) !== payload.ver) return c.json({ error: 'Unauthorized' }, 401);
    if (payload.email.length > 254 || payload.name.length > 100) return c.json({ error: 'Unauthorized' }, 401);
    c.set('userId', payload.sub);
    c.set('userEmail', payload.email);
    c.set('userName', payload.name);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
}
