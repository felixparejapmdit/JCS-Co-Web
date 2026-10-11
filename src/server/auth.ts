import jwt from 'jsonwebtoken';
import { argon2id, argon2Verify } from 'hash-wasm';
import { isMysqlMode } from './db';

export const SESSION_COOKIE = 'cloudaos_session';
const SESSION_HOURS = 8;

export interface Session {
  u: string; // sys_userrecords.username
  n: string; // full name
  g: string; // user group (sys_usergroup.ug_code)
  ba: string; // active business area
  cos: string[]; // business areas this user proved a password for at sign-in
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (isMysqlMode()) throw new Error('JWT_SECRET must be set when connected to the company database.');
  return 'cloud-aos-demo-only-secret-change-me';
}

export function signSession(s: Session): string {
  return jwt.sign(s, secret(), { expiresIn: `${SESSION_HOURS}h` });
}

export function readSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  try {
    const p = jwt.verify(token, secret()) as Session & { exp: number };
    return { u: p.u, n: p.n, g: p.g, ba: p.ba, cos: p.cos };
  } catch {
    return null;
  }
}

/**
 * Session cookie settings. `Secure` follows the connection: on for HTTPS (the hosted site, or a
 * TLS proxy that sends X-Forwarded-Proto), off for plain HTTP so sign-in also works on an
 * intranet server or http://localhost. COOKIE_SECURE=true forces it on.
 */
export function sessionCookieOptions(https: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: https || process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  };
}

// ---------------------------------------------------------------------------
// Passwords. The legacy app stores Base64 text in sys_userrecords.userpassword
// (modules/MyDBFunctions.vb base64Encode, UTF-8). NextGen checks it once, then keeps
// an Argon2id hash in ng_user_credentials (PLAN.md section 4.4).
// ---------------------------------------------------------------------------
export function legacyEncode(plain: string): string {
  return Buffer.from(plain, 'utf8').toString('base64');
}

export function legacyMatches(stored: string | null | undefined, plain: string): boolean {
  if (!stored) return false;
  try {
    return Buffer.from(String(stored), 'base64').toString('utf8') === plain.trim();
  } catch {
    return false;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = new Uint8Array(16);
  globalThis.crypto.getRandomValues(salt);
  return argon2id({
    password: plain,
    salt,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536, // 64 MiB
    hashLength: 32,
    outputType: 'encoded',
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2Verify({ password: plain, hash });
  } catch {
    return false;
  }
}

/** Minimum password policy for new and changed passwords. */
export function passwordProblem(p: string): string | null {
  if (p.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'Use both letters and numbers.';
  return null;
}
