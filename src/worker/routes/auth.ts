import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { users } from '../db/schema';
import { signJWT } from '../utils/jwt';
import { rateLimit } from '../middleware/rateLimit';
import type { Env } from '../index';

const auth = new Hono<{ Bindings: Env }>();

const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

// 10 attempts per 15 minutes
const limiter = rateLimit(10, 15 * 60 * 1000);

auth.post('/register', limiter as any, zValidator('json', registerSchema), async (c) => {
  const { name, email, password } = c.req.valid('json');
  const db = getDb(c.env.DB);

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
  if (existing) return c.json({ error: 'Email already registered' }, 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID().replace(/-/g, '');
  await db.insert(users).values({ id, name, email, passwordHash, tokenVersion: 0 }).run();

  const token = await signJWT({ sub: id, email, name, ver: 0 }, c.env.JWT_SECRET);
  return c.json({ token, user: { id, name, email } }, 201);
});

auth.post('/login', limiter as any, zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = getDb(c.env.DB);

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const token = await signJWT({ sub: user.id, email: user.email, name: user.name, ver: user.tokenVersion ?? 0 }, c.env.JWT_SECRET);
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ success: true });
  const token = authHeader.slice(7);
  const db = getDb(c.env.DB);
  try {
    const { verifyJWT } = await import('../utils/jwt');
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    const user = await db.select({ id: users.id, tokenVersion: users.tokenVersion }).from(users).where(eq(users.id, payload.sub)).get();
    if (user) {
      await db.update(users).set({ tokenVersion: (user.tokenVersion ?? 0) + 1, updatedAt: new Date() }).where(eq(users.id, user.id)).run();
    }
  } catch {
    // ignore
  }
  return c.json({ success: true });
});

export default auth;
