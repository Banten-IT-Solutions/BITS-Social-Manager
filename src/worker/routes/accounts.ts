import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { socialAccounts, projects } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { encrypt, decrypt, DecryptError } from '../utils/crypto';
import type { Env, Variables } from '../index';

const accountsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();
accountsRouter.use('*', authMiddleware);

const PLATFORMS = [
  'Gmail',
  'YouTube',
  'Facebook',
  'Instagram',
  'Threads',
  'WhatsApp',
  'Telegram',
  'TikTok',
  'Shopee',
  'X',
  'LinkedIn',
  'GitHub',
] as const;

const createSchema = z.object({
  projectId: z.string().min(1),
  platform: z.enum(PLATFORMS),
  accountName: z.string().min(1).max(200).trim(),
  emailHandle: z.string().min(1).max(500).trim(),
  password: z.string().min(1).max(1000),
  notes: z.string().max(2000).trim().optional(),
});

const updateSchema = createSchema.omit({ projectId: true }).partial().extend({
  projectId: z.string().optional(),
});

async function ownsProject(db: ReturnType<typeof getDb>, projectId: string, userId: string) {
  return db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .get();
}

accountsRouter.get('/', async c => {
  const userId = c.get('userId');
  const projectId = c.req.query('projectId');
  const db = getDb(c.env.DB);

  if (projectId) {
    if (!(await ownsProject(db, projectId, userId))) {
      return c.json({ error: 'Not found' }, 404);
    }
    const accounts = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.projectId, projectId))
      .all();
    // Return without decrypted passwords
    return c.json({ accounts: accounts.map(a => ({ ...a, passwordEncrypted: undefined })) });
  }

  // All accounts across user's projects
  const userProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId))
    .all();
  const projectIds = userProjects.map(p => p.id);
  if (projectIds.length === 0) return c.json({ accounts: [] });

  const all = await db
    .select()
    .from(socialAccounts)
    .where(inArray(socialAccounts.projectId, projectIds))
    .all();
  return c.json({ accounts: all.map(a => ({ ...a, passwordEncrypted: undefined })) });
});

accountsRouter.post('/', zValidator('json', createSchema), async c => {
  const userId = c.get('userId');
  const { projectId, platform, accountName, emailHandle, password, notes } = c.req.valid('json');
  const db = getDb(c.env.DB);

  if (!(await ownsProject(db, projectId, userId))) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const passwordEncrypted = await encrypt(password, c.env.ENCRYPTION_KEY);
  const id = crypto.randomUUID().replace(/-/g, '');
  await db
    .insert(socialAccounts)
    .values({ id, projectId, platform, accountName, emailHandle, passwordEncrypted, notes })
    .run();
  const account = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id)).get();
  return c.json({ account: { ...account, passwordEncrypted: undefined } }, 201);
});

accountsRouter.get('/:id', async c => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const db = getDb(c.env.DB);

  const account = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id)).get();
  if (!account) return c.json({ error: 'Not found' }, 404);

  if (!(await ownsProject(db, account.projectId, userId))) {
    return c.json({ error: 'Not found' }, 404);
  }

  // Decrypt password for single-account view (reveal feature)
  let password: string;
  try {
    password = await decrypt(account.passwordEncrypted, c.env.ENCRYPTION_KEY);
  } catch (err) {
    if (err instanceof DecryptError) {
      // Stored value is undecryptable (rotated key, corrupted/legacy data) —
      // actionable for the user, no internal details leaked.
      console.error(`[accounts] decrypt failed for account ${id}: ${err.message}`);
      return c.json(
        {
          error:
            'Stored password could not be decrypted. The encryption key may have changed or the stored value is corrupted — edit this account and re-save the password.',
        },
        422
      );
    }
    // Anything else is a server/key misconfiguration — rethrow to the global JSON error handler.
    throw err;
  }
  c.header('Cache-Control', 'no-store');
  c.header('Pragma', 'no-cache');
  return c.json({ account: { ...account, password, passwordEncrypted: undefined } });
});

accountsRouter.put('/:id', zValidator('json', updateSchema), async c => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const data = c.req.valid('json');
  const db = getDb(c.env.DB);

  const account = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id)).get();
  if (!account) return c.json({ error: 'Not found' }, 404);

  if (!(await ownsProject(db, account.projectId, userId))) {
    return c.json({ error: 'Not found' }, 404);
  }

  const updates: Partial<typeof socialAccounts.$inferInsert> = { updatedAt: new Date() };
  if (data.platform) updates.platform = data.platform;
  if (data.accountName) updates.accountName = data.accountName;
  if (data.emailHandle) updates.emailHandle = data.emailHandle;
  if (data.notes !== undefined) updates.notes = data.notes;
  if (data.password) {
    updates.passwordEncrypted = await encrypt(data.password, c.env.ENCRYPTION_KEY);
  }

  await db.update(socialAccounts).set(updates).where(eq(socialAccounts.id, id)).run();
  const updated = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id)).get();
  return c.json({ account: { ...updated, passwordEncrypted: undefined } });
});

accountsRouter.delete('/:id', async c => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const db = getDb(c.env.DB);

  const account = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id)).get();
  if (!account) return c.json({ error: 'Not found' }, 404);

  if (!(await ownsProject(db, account.projectId, userId))) {
    return c.json({ error: 'Not found' }, 404);
  }

  await db.delete(socialAccounts).where(eq(socialAccounts.id, id)).run();
  return c.json({ success: true });
});

export default accountsRouter;
