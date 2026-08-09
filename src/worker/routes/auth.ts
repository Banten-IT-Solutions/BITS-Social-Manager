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
  await db.insert(users).values({ id, name, email, passwordHash }).run();

  const token = await signJWT({ sub: id, email, name }, c.env.JWT_SECRET);
  return c.json({ token, user: { id, name, email } }, 201);
});

auth.post('/login', limiter as any, zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = getDb(c.env.DB);

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const token = await signJWT({ sub: user.id, email: user.email, name: user.name }, c.env.JWT_SECRET);
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

auth.post('/logout', (c) => c.json({ success: true }));

export default auth;
