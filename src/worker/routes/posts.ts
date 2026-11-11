import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '../db';
import { posts, projects, socialAccounts } from '../db/schema';
import type { DB } from '../db';
import { authMiddleware } from '../middleware/auth';
import {
  DriveError,
  driveConfigured,
  driveFileName,
  ensureAccountFolder,
  getValidAccessToken,
  MAX_VIDEO_BYTES,
  replaceVideoContent,
  updateFileMeta,
  uploadVideoFile,
  type FileMetadataPatch,
} from '../utils/drive';
import type { Env, Variables } from '../index';

const postsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();
// Mounted at /api, so scope auth to this router's own paths only — a `use('*')`
// would swallow /api/health, /api/openapi.json and the Google OAuth callback.
postsRouter.use('/posts', authMiddleware);
postsRouter.use('/posts/*', authMiddleware);
postsRouter.use('/accounts/*', authMiddleware);

const STATUSES = ['draft', 'scheduled', 'published', 'cancelled'] as const;
const statusSchema = z.enum(STATUSES);

/** Accepts any string Date.parse understands (ISO from the client). */
const dateTimeSchema = z
  .string()
  .refine(value => !Number.isNaN(Date.parse(value)), 'Invalid date/time');

const createSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200).trim(),
    description: z.string().max(5000).trim().nullable().optional(),
    scheduledAt: dateTimeSchema.nullable().optional(),
    status: statusSchema.default('draft'),
    attachmentUrl: z.string().url('Invalid URL').max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'scheduled' && !data.scheduledAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'A scheduled date is required when status is scheduled',
      });
    }
  });

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim().optional(),
  description: z.string().max(5000).trim().nullable().optional(),
  scheduledAt: dateTimeSchema.nullable().optional(),
  status: statusSchema.optional(),
  attachmentUrl: z.string().url('Invalid URL').max(2000).nullable().optional(),
  accountId: z.string().min(1).optional(),
});

type PostRow = typeof posts.$inferSelect;
type AccountRow = typeof socialAccounts.$inferSelect;

function validationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  const prefix = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
  return `${prefix}${issue?.message ?? 'Invalid request body'}`;
}

function serializePost(post: PostRow, account: AccountRow, projectName?: string) {
  return {
    id: post.id,
    userId: post.userId,
    accountId: post.accountId,
    title: post.title,
    description: post.description,
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
    status: post.status,
    driveFileId: post.driveFileId,
    attachmentName: post.attachmentName,
    attachmentUrl: post.attachmentUrl,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    account: {
      id: account.id,
      projectId: account.projectId,
      platform: account.platform,
      accountName: account.accountName,
      projectName,
    },
  };
}

async function loadOwnedAccount(db: DB, userId: string, accountId: string) {
  return db
    .select({ account: socialAccounts, projectName: projects.name })
    .from(socialAccounts)
    .innerJoin(projects, eq(socialAccounts.projectId, projects.id))
    .where(and(eq(socialAccounts.id, accountId), eq(projects.userId, userId)))
    .get();
}

async function loadOwnedPost(db: DB, userId: string, accountId: string, postId: string) {
  return db
    .select({ post: posts, account: socialAccounts, projectName: projects.name })
    .from(posts)
    .innerJoin(socialAccounts, eq(posts.accountId, socialAccounts.id))
    .innerJoin(projects, eq(socialAccounts.projectId, projects.id))
    .where(and(eq(posts.id, postId), eq(posts.accountId, accountId), eq(posts.userId, userId)))
    .get();
}

function driveFailure(c: Context<{ Bindings: Env; Variables: Variables }>, error: unknown) {
  if (error instanceof DriveError) {
    return c.json({ error: error.message }, error.status);
  }
  console.error('[posts] Drive operation failed', error);
  return c.json({ error: 'Google Drive operation failed' }, 502);
}

function formField(form: FormData, key: string): string | null | undefined {
  if (!form.has(key)) return undefined;
  const value = form.get(key);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function formFile(form: FormData): File | null {
  const value = form.get('video');
  return value instanceof File && value.size > 0 ? value : null;
}

function tooLarge(): { error: string; status: 413 } {
  return { error: 'Video is too large (max 50 MB)', status: 413 };
}

type CreateParsed = { data: z.infer<typeof createSchema>; file: File | null };

async function parseCreateRequest(
  c: Context<{ Bindings: Env; Variables: Variables }>
): Promise<CreateParsed | { error: string; status: 400 | 413 }> {
  const contentType = c.req.header('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const declared = Number(c.req.header('content-length') ?? '0');
    if (declared > MAX_VIDEO_BYTES + 2 * 1024 * 1024) return tooLarge();

    let form: FormData;
    try {
      form = await c.req.formData();
    } catch {
      return { error: 'Invalid multipart body', status: 400 };
    }
    const file = formFile(form);
    if (file && file.size > MAX_VIDEO_BYTES) return tooLarge();

    const parsed = createSchema.safeParse({
      title: formField(form, 'title') ?? '',
      description: formField(form, 'description'),
      scheduledAt: formField(form, 'scheduledAt'),
      status: formField(form, 'status') ?? 'draft',
      attachmentUrl: formField(form, 'attachmentUrl'),
    });
    if (!parsed.success) return { error: validationMessage(parsed.error), status: 400 };
    return { data: parsed.data, file };
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return { error: validationMessage(parsed.error), status: 400 };
  return { data: parsed.data, file: null };
}

type UpdateParsed = { data: z.infer<typeof updateSchema>; file: File | null };

async function parseUpdateRequest(
  c: Context<{ Bindings: Env; Variables: Variables }>
): Promise<UpdateParsed | { error: string; status: 400 | 413 }> {
  const contentType = c.req.header('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const declared = Number(c.req.header('content-length') ?? '0');
    if (declared > MAX_VIDEO_BYTES + 2 * 1024 * 1024) return tooLarge();

    let form: FormData;
    try {
      form = await c.req.formData();
    } catch {
      return { error: 'Invalid multipart body', status: 400 };
    }
    const file = formFile(form);
    if (file && file.size > MAX_VIDEO_BYTES) return tooLarge();

    const raw: Record<string, unknown> = {};
    if (form.has('title')) raw['title'] = formField(form, 'title') ?? '';
    if (form.has('description')) raw['description'] = formField(form, 'description');
    if (form.has('scheduledAt')) raw['scheduledAt'] = formField(form, 'scheduledAt');
    if (form.has('status')) raw['status'] = formField(form, 'status') ?? 'draft';
    if (form.has('attachmentUrl')) raw['attachmentUrl'] = formField(form, 'attachmentUrl');
    if (form.has('accountId')) raw['accountId'] = formField(form, 'accountId');

    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) return { error: validationMessage(parsed.error), status: 400 };
    return { data: parsed.data, file };
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return { error: validationMessage(parsed.error), status: 400 };
  return { data: parsed.data, file: null };
}

/** All posts across all accounts (Content Plan page). */
postsRouter.get('/posts', async c => {
  const userId = c.get('userId');
  const db = getDb(c.env.DB);
  const rows = await db
    .select({ post: posts, account: socialAccounts, projectName: projects.name })
    .from(posts)
    .innerJoin(socialAccounts, eq(posts.accountId, socialAccounts.id))
    .innerJoin(projects, eq(socialAccounts.projectId, projects.id))
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));

  return c.json({
    posts: rows.map(row => serializePost(row.post, row.account, row.projectName)),
  });
});

postsRouter.get('/accounts/:accountId/posts', async c => {
  const userId = c.get('userId');
  const accountId = c.req.param('accountId');
  const db = getDb(c.env.DB);
  const owned = await loadOwnedAccount(db, userId, accountId);
  if (!owned) return c.json({ error: 'Account not found' }, 404);

  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.userId, userId), eq(posts.accountId, accountId)))
    .orderBy(desc(posts.createdAt));

  return c.json({
    posts: rows.map(post => serializePost(post, owned.account, owned.projectName)),
  });
});

postsRouter.post('/accounts/:accountId/posts', async c => {
  const userId = c.get('userId');
  const accountId = c.req.param('accountId');
  const db = getDb(c.env.DB);

  const owned = await loadOwnedAccount(db, userId, accountId);
  if (!owned) return c.json({ error: 'Account not found' }, 404);

  const parsed = await parseCreateRequest(c);
  if ('error' in parsed) return c.json({ error: parsed.error }, parsed.status);
  const { data, file } = parsed;

  let driveFileId: string | null = null;
  let attachmentName: string | null = null;
  let attachmentUrl: string | null = data.attachmentUrl ?? null;

  if (file) {
    if (!driveConfigured(c.env)) {
      return c.json({ error: 'Google Drive is not connected' }, 409);
    }
    try {
      const token = await getValidAccessToken(c.env, userId);
      const folderId = await ensureAccountFolder(c.env, userId, owned.account, token);
      const uploaded = await uploadVideoFile(
        token,
        folderId,
        driveFileName(data.title, file.name),
        file.type || 'video/mp4',
        file,
        file.size
      );
      driveFileId = uploaded.id;
      attachmentName = file.name;
      attachmentUrl = uploaded.webViewLink ?? attachmentUrl;
    } catch (error) {
      return driveFailure(c, error);
    }
  }

  const [created] = await db
    .insert(posts)
    .values({
      userId,
      accountId,
      title: data.title,
      description: data.description ?? null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: data.status,
      driveFileId,
      attachmentName,
      attachmentUrl,
    })
    .returning();

  return c.json({ post: serializePost(created!, owned.account, owned.projectName) }, 201);
});

postsRouter.get('/accounts/:accountId/posts/:postId', async c => {
  const userId = c.get('userId');
  const db = getDb(c.env.DB);
  const row = await loadOwnedPost(db, userId, c.req.param('accountId'), c.req.param('postId'));
  if (!row) return c.json({ error: 'Post not found' }, 404);
  return c.json({ post: serializePost(row.post, row.account, row.projectName) });
});

postsRouter.put('/accounts/:accountId/posts/:postId', async c => {
  const userId = c.get('userId');
  const db = getDb(c.env.DB);
  const existing = await loadOwnedPost(db, userId, c.req.param('accountId'), c.req.param('postId'));
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  const parsed = await parseUpdateRequest(c);
  if ('error' in parsed) return c.json({ error: parsed.error }, parsed.status);
  const { data, file } = parsed;

  const targetAccountId = data.accountId ?? existing.post.accountId;
  const accountChanged = targetAccountId !== existing.post.accountId;
  let targetAccount = existing.account;
  let projectName = existing.projectName;

  if (accountChanged) {
    const owned = await loadOwnedAccount(db, userId, targetAccountId);
    if (!owned) return c.json({ error: 'Account not found' }, 404);
    targetAccount = owned.account;
    projectName = owned.projectName;
  }

  const title = data.title ?? existing.post.title;
  const status = data.status ?? existing.post.status;
  const scheduledAt =
    data.scheduledAt !== undefined
      ? data.scheduledAt
      : existing.post.scheduledAt
        ? existing.post.scheduledAt.toISOString()
        : null;

  if (status === 'scheduled' && !scheduledAt) {
    return c.json(
      { error: 'scheduledAt: A scheduled date is required when status is scheduled' },
      400
    );
  }

  const titleChanged = title !== existing.post.title;
  let driveFileId = existing.post.driveFileId;
  let attachmentName = existing.post.attachmentName;
  let attachmentUrl =
    data.attachmentUrl !== undefined ? data.attachmentUrl : existing.post.attachmentUrl;

  if (file && !driveConfigured(c.env)) {
    return c.json({ error: 'Google Drive is not connected' }, 409);
  }

  try {
    if (file) {
      const token = await getValidAccessToken(c.env, userId);
      const targetFolderId = await ensureAccountFolder(c.env, userId, targetAccount, token);
      const mimeType = file.type || 'video/mp4';
      let uploaded;

      if (driveFileId) {
        try {
          // Replace in place: same file id, same link, permissions retained.
          uploaded = await replaceVideoContent(token, driveFileId, mimeType, file);
        } catch (error) {
          if (error instanceof DriveError && error.status === 404) {
            uploaded = await uploadVideoFile(
              token,
              targetFolderId,
              driveFileName(title, file.name),
              mimeType,
              file,
              file.size
            );
            driveFileId = uploaded.id;
          } else {
            throw error;
          }
        }
      } else {
        uploaded = await uploadVideoFile(
          token,
          targetFolderId,
          driveFileName(title, file.name),
          mimeType,
          file,
          file.size
        );
        driveFileId = uploaded.id;
      }

      attachmentName = file.name;
      attachmentUrl = uploaded.webViewLink ?? attachmentUrl;

      const patch: FileMetadataPatch = { name: driveFileName(title, file.name) };
      if (accountChanged) {
        patch.addParents = targetFolderId;
        patch.removeParents = existing.account.driveFolderId;
      }
      await updateFileMeta(token, driveFileId!, patch);
    } else if (driveFileId && (accountChanged || titleChanged)) {
      const token = await getValidAccessToken(c.env, userId);
      const patch: FileMetadataPatch = {};
      if (titleChanged) {
        patch.name = driveFileName(title, attachmentName ?? 'video.mp4');
      }
      if (accountChanged) {
        patch.addParents = await ensureAccountFolder(c.env, userId, targetAccount, token);
        patch.removeParents = existing.account.driveFolderId;
      }
      await updateFileMeta(token, driveFileId, patch);
    }
  } catch (error) {
    return driveFailure(c, error);
  }

  const [updated] = await db
    .update(posts)
    .set({
      accountId: targetAccountId,
      title,
      description: data.description !== undefined ? data.description : existing.post.description,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status,
      driveFileId,
      attachmentName,
      attachmentUrl,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, existing.post.id))
    .returning();

  return c.json({ post: serializePost(updated!, targetAccount, projectName) });
});

postsRouter.delete('/accounts/:accountId/posts/:postId', async c => {
  const userId = c.get('userId');
  const db = getDb(c.env.DB);
  const existing = await loadOwnedPost(db, userId, c.req.param('accountId'), c.req.param('postId'));
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  // The Drive video is intentionally kept as an archive.
  await db.delete(posts).where(eq(posts.id, existing.post.id));
  return c.json({ success: true });
});

export default postsRouter;
