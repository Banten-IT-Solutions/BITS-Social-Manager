/// <reference types="@cloudflare/workers-types" />
import { describe, it, expect } from 'vitest';
import worker from '../../src/worker/index';
import { encrypt } from '../../src/worker/utils/crypto';
import { signJWT } from '../../src/worker/utils/jwt';

/**
 * Regression tests for GET /api/accounts/:id ("show password" reveal).
 * Before the fix, any decryption failure escaped the handler as an unhandled
 * exception → raw text/plain 500. Now data failures map to 422 JSON and
 * unexpected failures go through the global JSON error handler.
 */

const KEY = 'a'.repeat(64);
const OLD_KEY = 'c'.repeat(64);
const USER = 'u'.repeat(32);
const PROJECT = 'p'.repeat(32);
const ACCOUNT = 'bada2b52e4724567b6a258ddf1cc940f';
const TS = 1756000000;

function accountRow(encrypted: string) {
  return {
    id: ACCOUNT, project_id: PROJECT, platform: 'Gmail', account_name: 'Biz',
    email_handle: 'biz@x.co', password_encrypted: encrypted,
    notes: null, created_at: TS, updated_at: TS,
  };
}

/** Minimal D1 binding stub covering the Drizzle D1 driver calls used by the route. */
function makeD1(opts: { encrypted?: string; owned?: boolean; boom?: boolean } = {}) {
  const row = opts.encrypted !== undefined ? accountRow(opts.encrypted) : null;
  return {
    prepare(sql: string) {
      const stmt = {
        bind(..._params: unknown[]) { return stmt; },
        async run() { if (opts.boom) throw new Error('D1 internal error'); return { success: true }; },
        async all() {
          if (opts.boom) throw new Error('D1 internal error');
          if (/social_accounts/i.test(sql)) return { results: row ? [row] : [] };
          return { results: [] };
        },
        async raw() {
          if (opts.boom) throw new Error('D1 internal error');
          if (/social_accounts/i.test(sql)) {
            return row ? [[row.id, row.project_id, row.platform, row.account_name, row.email_handle, row.password_encrypted, row.notes, row.created_at, row.updated_at]] : [];
          }
          if (/projects/i.test(sql)) return opts.owned === false ? [] : [[PROJECT]];
          return [];
        },
      };
      return stmt;
    },
  } as unknown as D1Database;
}

async function call(path: string, d1: D1Database, env: Record<string, unknown> = {}) {
  const token = await signJWT({ sub: USER, email: 'user@example.com', name: 'User' }, 'test-secret');
  const request = new Request(`https://social.bits.co.id${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return worker.fetch(
    request,
    { DB: d1, JWT_SECRET: 'test-secret', ENCRYPTION_KEY: KEY, ASSETS: { fetch: () => new Response(null) }, ...env } as never,
    { waitUntil: () => {}, passThroughOnException: () => {} } as never,
  );
}

describe('GET /api/accounts/:id password reveal', () => {
  it('returns 422 JSON (not a raw 500) when stored ciphertext was written under a different key', async () => {
    const res = await call(`/api/accounts/${ACCOUNT}`, makeD1({ encrypted: await encrypt('hunter2', OLD_KEY) }));
    expect(res.status).toBe(422);
    const body = await res.json() as { error?: string };
    expect(body.error).toMatch(/could not be decrypted/i);
  });

  it('returns 422 JSON for corrupted / non-base64 stored values', async () => {
    const res = await call(`/api/accounts/${ACCOUNT}`, makeD1({ encrypted: 'not-valid-base64!!' }));
    expect(res.status).toBe(422);
  });

  it('reveals the password and strips ciphertext on the happy path', async () => {
    const res = await call(`/api/accounts/${ACCOUNT}`, makeD1({ encrypted: await encrypt('hunter2', KEY) }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json() as { account: { password?: string; passwordEncrypted?: string } };
    expect(body.account.password).toBe('hunter2');
    expect(body.account.passwordEncrypted).toBeUndefined();
  });

  it('still returns 404 for accounts not owned by the caller (no cross-tenant leak)', async () => {
    const res = await call(`/api/accounts/${ACCOUNT}`, makeD1({ encrypted: await encrypt('x', KEY), owned: false }));
    expect(res.status).toBe(404);
    const body = await res.json() as { error?: string };
    expect(body.error).not.toMatch(/password/);
  });

  it('missing ENCRYPTION_KEY secret surfaces as a JSON 500 through the global error handler', async () => {
    const res = await call(`/api/accounts/${ACCOUNT}`, makeD1({ encrypted: await encrypt('hunter2', KEY) }), { ENCRYPTION_KEY: undefined });
    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json() as { error?: string };
    expect(body.error).toBe('Internal Server Error');
  });

  it('unexpected DB failures return JSON (not text/plain) via the global error handler', async () => {
    const res = await call('/api/accounts?projectId=whatever', makeD1({ boom: true }));
    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
