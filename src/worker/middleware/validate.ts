import type { Context } from 'hono';

type ValidationResult =
  | { success: true }
  | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };

/**
 * Uniform 400 body for all zValidator routes: `{ error: "field: message" }`.
 * Matches the OpenAPI `Error` schema and lets clients (api.ts) surface
 * Zod messages directly instead of a generic HTTP 400.
 */
export const validationHook = (result: ValidationResult, c: Context) => {
  if (result.success) return;
  const issue = result.error.issues[0];
  const prefix = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
  return c.json({ error: `${prefix}${issue?.message ?? 'Invalid request body'}` }, 400);
};
