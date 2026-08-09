/**
 * HS256 JWT using Web Crypto API.
 */

export interface JWTPayload {
  sub: string;   // user id
  email: string;
  name: string;
  iat: number;
  exp: number;
}

function b64url(data: string | Uint8Array): string {
  const s = typeof data === 'string' ? data : String.fromCharCode(...Array.from(data));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret) as Uint8Array<ArrayBuffer>;
  return crypto.subtle.importKey('raw', raw.buffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresInSeconds = 604800): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }));
  const signingInput = `${header}.${fullPayload}`;
  const key = await getKey(secret);
  const encoded = new TextEncoder().encode(signingInput) as Uint8Array<ArrayBuffer>;
  const sig = await crypto.subtle.sign('HMAC', key, encoded.buffer);
  return `${signingInput}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const [header, payload, sig] = parts as [string, string, string];
  const key = await getKey(secret);
  const sigBytes = fromB64url(sig);
  const inputEncoded = new TextEncoder().encode(`${header}.${payload}`) as Uint8Array<ArrayBuffer>;
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes.buffer, inputEncoded.buffer);
  if (!valid) throw new Error('Invalid signature');
  const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Partial<JWTPayload>;
  if (
    typeof data.sub !== 'string' ||
    typeof data.email !== 'string' ||
    typeof data.name !== 'string' ||
    typeof data.iat !== 'number' ||
    typeof data.exp !== 'number'
  ) throw new Error('Invalid payload');
  if (data.exp <= Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return data as JWTPayload;
}
