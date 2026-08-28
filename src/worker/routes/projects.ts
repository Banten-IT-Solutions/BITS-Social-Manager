import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { projects } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../index';

const projectsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();
projectsRouter.use('*', authMiddleware);

const createSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
});

const updateSchema = createSchema.partial();

projectsRouter.get('/', async c => {
  const userId = c.get('userId');
  const db = getDb(c.env.DB);
  const list = await db.select().from(projects).where(eq(projects.userId, userId)).all();
  return c.json({ projects: list });
});

projectsRouter.post('/', zValidator('json', createSchema), async c => {
  const userId = c.get('userId');
  const { name, description } = c.req.valid('json');
  const db = getDb(c.env.DB);
  const id = crypto.randomUUID().replace(/-/g, '');
  await db.insert(projects).values({ id, userId, name, description }).run();
  const project = await db.select().from(projects).where(eq(projects.id, id)).get();
  return c.json({ project }, 201);
});

projectsRouter.get('/:id', async c => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const db = getDb(c.env.DB);
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .get();
  if (!project) return c.json({ error: 'Not found' }, 404);
  return c.json({ project });
});

projectsRouter.put('/:id', zValidator('json', updateSchema), async c => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const data = c.req.valid('json');
  const db = getDb(c.env.DB);

  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .get();
  if (!project) return c.json({ error: 'Not found' }, 404);

  await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .run();
  const updated = await db.select().from(projects).where(eq(projects.id, id)).get();
  return c.json({ project: updated });
});

projectsRouter.delete('/:id', async c => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  const db = getDb(c.env.DB);

  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .get();
  if (!project) return c.json({ error: 'Not found' }, 404);

  await db.delete(projects).where(eq(projects.id, id)).run();
  return c.json({ success: true });
});

export default projectsRouter;
