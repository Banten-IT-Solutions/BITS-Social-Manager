/**
 * AES-256-GCM encryption for social account passwords.
 * Key is a 64-char hex string (32 bytes).
 * Ciphertext format: base64(iv[12] + encrypted + authTag[16])
 *
 * Error contract:
 * - `DecryptError`  → the STORED value cannot be decrypted (malformed/truncated
 *   base64, corrupted ciphertext, or encrypted under a different key). Callers
 *   should map this to a client-actionable response (e.g. HTTP 422).
 * - other `Error`s  → environment/key misconfiguration (e.g. ENCRYPTION_KEY
 *   missing or wrong size). These are server-side problems (HTTP 500).
 */

const IV_LENGTH = 12;
const AUTH_TAG_MIN_LENGTH = 16;

/** Thrown when stored ciphertext cannot be decrypted (data problem, not config). */
export class DecryptError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DecryptError';
  }
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('ENCRYPTION_KEY must be a valid hex string');
  }
  const bytes = new Uint8Array(hex.length / 2) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  if (!hexKey) throw new Error('ENCRYPTION_KEY is not configured');
  const raw = hexToBytes(hexKey);
  if (raw.length !== 32) throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  return crypto.subtle.importKey('raw', raw.buffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(plaintext: string, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)) as Uint8Array<ArrayBuffer>;
  const encoded = new TextEncoder().encode(plaintext) as Uint8Array<ArrayBuffer>;
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer }, key, encoded.buffer);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(b64: string, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);

  if (typeof b64 !== 'string' || b64.length === 0 || b64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
    throw new DecryptError('Stored password is not valid base64 ciphertext');
  }

  // `atob` throws an opaque DOMException on bad input; normalize it.
  let combined: Uint8Array<ArrayBuffer>;
  try {
    combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
  } catch (err) {
    throw new DecryptError('Stored password is not valid base64 ciphertext', { cause: err });
  }

  if (combined.length < IV_LENGTH + AUTH_TAG_MIN_LENGTH) {
    throw new DecryptError('Stored ciphertext is truncated');
  }

  const iv = combined.slice(0, IV_LENGTH) as Uint8Array<ArrayBuffer>;
  const data = combined.slice(IV_LENGTH) as Uint8Array<ArrayBuffer>;

  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer }, key, data.buffer);
  } catch (err) {
    // Auth failure: wrong key (rotated/mismatched ENCRYPTION_KEY) or corrupted data.
    throw new DecryptError('Password could not be decrypted: wrong encryption key or corrupted ciphertext', { cause: err });
  }
  return new TextDecoder().decode(plain);
}
