// Simple utils for Workers runtime

export function uid(prefix = '') {
  const a = crypto.getRandomValues(new Uint8Array(16));
  const hex = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
  return prefix ? `${prefix}_${hex}` : hex;
}

function ab2b64(ab: ArrayBuffer) {
  const bytes = new Uint8Array(ab);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b642ab(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function hashPassword(password: string, iterations = 120_000) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256
  );
  const saltB64 = ab2b64(salt.buffer);
  const hashB64 = ab2b64(bits);
  return `v1$${iterations}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [v, iterStr, saltB64, hashB64] = stored.split('$');
  if (v !== 'v1') return false;
  const iterations = parseInt(iterStr, 10);
  const salt = b642ab(saltB64);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  const calc = ab2b64(bits);
  
  // Timing-safe comparison
  if (calc.length !== hashB64.length) return false;
  let result = 0;
  for (let i = 0; i < calc.length; i++) {
    result |= calc.charCodeAt(i) ^ hashB64.charCodeAt(i);
  }
  return result === 0;
}

export function cookieSerialize(name: string, value: string, opts: {
  httpOnly?: boolean, secure?: boolean, path?: string, sameSite?: 'Lax'|'Strict'|'None', maxAge?: number
} = {}) {
  const parts = [`${name}=${value}`];
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path ?? '/'}`);
  parts.push(`SameSite=${opts.sameSite ?? 'Lax'}`);
  if (opts.httpOnly !== false) parts.push(`HttpOnly`);
  if (opts.secure !== false) parts.push(`Secure`);
  return parts.join('; ');
}

