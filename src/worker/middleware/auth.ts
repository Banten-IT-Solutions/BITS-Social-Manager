import type { Context, Next } from 'hono';
import { verifyJWT } from '../utils/jwt';
import type { Env, Variables } from '../index';

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.slice(7);
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (payload.email.length > 254 || payload.name.length > 100) return c.json({ error: 'Unauthorized' }, 401);
    c.set('userId', payload.sub);
    c.set('userEmail', payload.email);
    c.set('userName', payload.name);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
}
