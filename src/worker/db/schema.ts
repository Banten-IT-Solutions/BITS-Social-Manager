import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, '')),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const projects = sqliteTable('projects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, '')),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const socialAccounts = sqliteTable('social_accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, '')),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  accountName: text('account_name').notNull(),
  emailHandle: text('email_handle').notNull(),
  passwordEncrypted: text('password_encrypted').notNull(),
  notes: text('notes'),
  /** Google Drive subfolder for this account's videos (created lazily on first upload). */
  driveFolderId: text('drive_folder_id'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** One Google Drive connection per app user (OAuth tokens are always encrypted). */
export const driveConnections = sqliteTable('drive_connections', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  googleEmail: text('google_email').notNull(),
  refreshTokenEnc: text('refresh_token_enc').notNull(),
  accessTokenEnc: text('access_token_enc'),
  /** Unix epoch seconds. */
  expiresAt: integer('expires_at'),
  rootFolderId: text('root_folder_id'),
  connectedAt: integer('connected_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** A planned post/upload for one social account. */
export const posts = sqliteTable('posts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, '')),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id')
    .notNull()
    .references(() => socialAccounts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('draft'),
  driveFileId: text('drive_file_id'),
  attachmentName: text('attachment_name'),
  attachmentUrl: text('attachment_url'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type NewSocialAccount = typeof socialAccounts.$inferInsert;
export type DriveConnection = typeof driveConnections.$inferSelect;
export type NewDriveConnection = typeof driveConnections.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
