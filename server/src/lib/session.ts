import { createHmac, randomBytes } from 'node:crypto';
import type { Response } from 'express';
import { config } from '../config.js';
import { db } from '../database/connection.js';

/**
 * Server-side sessions. The browser holds only a random token in an HTTP-only cookie
 * (JavaScript cannot read it). The database stores a keyed hash of that token, so a copy
 * of the database file does not contain usable session cookies.
 */
export const SESSION_COOKIE = 'rentora_sid';
const SESSION_DAYS = 7;

const digest = (token: string) => createHmac('sha256', config.sessionSecret).update(token).digest('hex');

export function createSession(userId: number): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(digest(token), userId, expiresAt.toISOString());
  return { token, expiresAt };
}

export function startSession(res: Response, userId: number) {
  const { token, expiresAt } = createSession(userId);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    expires: expiresAt,
    path: '/',
  });
}

export function endSession(res: Response, token: string | undefined) {
  if (token) db.prepare('DELETE FROM sessions WHERE id = ?').run(digest(token));
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/** Returns the user id for a valid, unexpired session token. */
export function userIdForToken(token: string): number | null {
  const row = db
    .prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?')
    .get(digest(token), new Date().toISOString()) as { user_id: number } | undefined;
  return row?.user_id ?? null;
}
