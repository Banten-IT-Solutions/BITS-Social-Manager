import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt, DecryptError } from '../../src/worker/utils/crypto';

// Valid 32-byte key (64 hex chars)
const KEY = 'a'.repeat(64);

describe('crypto utilities', () => {
  it('round-trips plaintext', async () => {
    const plaintext = 'my-secret-password-123!';
    const cipher = await encrypt(plaintext, KEY);
    const plain = await decrypt(cipher, KEY);
    expect(plain).toBe(plaintext);
  });

  it('produces different ciphertext each call (random IV)', async () => {
    const c1 = await encrypt('same', KEY);
    const c2 = await encrypt('same', KEY);
    expect(c1).not.toBe(c2);
  });

  it('throws on wrong key', async () => {
    const cipher = await encrypt('secret', KEY);
    const wrongKey = 'b'.repeat(64);
    await expect(decrypt(cipher, wrongKey)).rejects.toThrow();
  });

  it('throws on tampered ciphertext', async () => {
    const cipher = await encrypt('secret', KEY);
    // Corrupt the last char
    const tampered = cipher.slice(0, -4) + 'XXXX';
    await expect(decrypt(tampered, KEY)).rejects.toThrow();
  });

  it('rejects key shorter than 32 bytes', async () => {
    await expect(encrypt('x', 'abcd')).rejects.toThrow('32 bytes');
  });

  it('handles unicode plaintext', async () => {
    const text = '🔑 Contraseña: ñoño & 中文';
    const cipher = await encrypt(text, KEY);
    expect(await decrypt(cipher, KEY)).toBe(text);
  });

  // --- Regression tests: decrypt failures must be typed DecryptError (data
  // problems → HTTP 422) while key misconfiguration stays a plain Error (→ 500).
  it('rejects missing ENCRYPTION_KEY with a clear error', async () => {
    const cipher = await encrypt('secret', KEY);
    await expect(decrypt(cipher, undefined as unknown as string))
      .rejects.toThrow('ENCRYPTION_KEY is not configured');
  });

  it('rejects non-hex ENCRYPTION_KEY instead of silently zero-filling', async () => {
    const cipher = await encrypt('secret', KEY);
    // 'z'.repeat(64) previously parsed to NaN bytes (silently coerced to 0x00)
    await expect(decrypt(cipher, 'z'.repeat(64)))
      .rejects.toThrow(/valid hex/);
    await expect(encrypt('secret', 'zz')).rejects.toThrow(/valid hex/);
  });

  it('wraps malformed base64 stored value in DecryptError', async () => {
    await expect(decrypt('not-valid-base64!!', KEY)).rejects.toBeInstanceOf(DecryptError);
    await expect(decrypt('', KEY)).rejects.toBeInstanceOf(DecryptError);
    await expect(decrypt('abc', KEY)).rejects.toBeInstanceOf(DecryptError); // bad padding length
  });

  it('wraps truncated ciphertext (< iv + tag) in DecryptError', async () => {
    await expect(decrypt(btoa('short'), KEY)).rejects.toBeInstanceOf(DecryptError);
  });

  it('wrong key rejects with DecryptError and preserves the cause', async () => {
    const cipher = await encrypt('secret', KEY);
    const err: DecryptError = await decrypt(cipher, 'b'.repeat(64)).then(
      () => { throw new Error('expected rejection'); },
      (e: unknown) => e as DecryptError,
    );
    expect(err).toBeInstanceOf(DecryptError);
    expect(err.cause).toBeDefined();
  });
});
