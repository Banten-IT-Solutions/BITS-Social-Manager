import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../index';

const profile = new Hono<{ Bindings: Env; Variables: Variables }>();
profile.use('*', authMiddleware);

const updateSchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    email: z.string().email().toLowerCase().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .refine(d => !d.newPassword || d.currentPassword, {
    message: 'currentPassword required when changing password',
    path: ['currentPassword'],
  });

profile.get('/', async c => {
  const userId = c.get('userId');
  const db = getDb(c.env.DB);
  const user = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  if (!user) return c.json({ error: 'Not found' }, 404);
  return c.json({ user });
});

profile.put('/', zValidator('json', updateSchema), async c => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const db = getDb(c.env.DB);

  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return c.json({ error: 'Not found' }, 404);

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name) updates.name = data.name;

  if (data.email && data.email !== user.email) {
    const conflict = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .get();
    if (conflict) return c.json({ error: 'Email already in use' }, 409);
    updates.email = data.email;
  }

  if (data.newPassword) {
    if (!data.currentPassword) return c.json({ error: 'currentPassword required' }, 400);
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) return c.json({ error: 'Current password incorrect' }, 400);
    updates.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  try {
    await db.update(users).set(updates).where(eq(users.id, userId)).run();
  } catch (error) {
    if (error instanceof Error && /UNIQUE/i.test(error.message)) {
      return c.json({ error: 'Email already in use' }, 409);
    }
    throw error;
  }

  const updated = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  return c.json({ user: updated });
});

export default profile;
