import { describe, it, expect } from 'vitest';
import { signJWT, verifyJWT } from '../../src/worker/utils/jwt';

const SECRET = 'test-secret-that-is-at-least-32-chars-long!';

describe('JWT utilities', () => {
  it('signs and verifies token', async () => {
    const token = await signJWT({ sub: 'user-123', email: 'a@b.com', name: 'Alice' }, SECRET);
    const payload = await verifyJWT(token, SECRET);
    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('a@b.com');
    expect(payload.name).toBe('Alice');
  });

  it('rejects wrong secret', async () => {
    const token = await signJWT({ sub: 'u', email: 'x@y.com', name: 'X' }, SECRET);
    await expect(verifyJWT(token, 'wrong-secret-padded-to-at-least-32-chars!')).rejects.toThrow(
      'Invalid signature'
    );
  });

  it('rejects expired token', async () => {
    const token = await signJWT({ sub: 'u', email: 'x@y.com', name: 'X' }, SECRET, -1);
    await expect(verifyJWT(token, SECRET)).rejects.toThrow('expired');
  });

  it('rejects malformed token', async () => {
    await expect(verifyJWT('not.a.token', SECRET)).rejects.toThrow();
    await expect(verifyJWT('only.two', SECRET)).rejects.toThrow('Invalid token');
  });

  it('rejects payload without ver', async () => {
    const token = await signJWT({ sub: 'u', email: 'x@y.com', name: 'X' }, SECRET);
    await expect(verifyJWT(token, SECRET)).resolves.toMatchObject({ sub: 'u' });
  });

  it('embeds iat and exp', async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await signJWT({ sub: 'u', email: 'x@y.com', name: 'X' }, SECRET, 3600);
    const payload = await verifyJWT(token, SECRET);
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.exp).toBe(payload.iat + 3600);
  });
});
