import { db } from '../../database/connection.js';
import { hashPassword } from '../../lib/password.js';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone: string | null;
  emailVerifiedDemo: boolean;
  phoneVerifiedDemo: boolean;
  createdAt: string;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone: string | null;
  email_verified_demo: number;
  phone_verified_demo: number;
  created_at: string;
}

const COLUMNS = 'id, name, email, role, phone, email_verified_demo, phone_verified_demo, created_at';

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    emailVerifiedDemo: !!row.email_verified_demo,
    phoneVerifiedDemo: !!row.phone_verified_demo,
    createdAt: row.created_at,
  };
}

export function getUserById(id: number): AuthUser | null {
  const row = db.prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`).get(id) as UserRow | undefined;
  return row ? toAuthUser(row) : null;
}

/** Includes the password hash — only for the sign-in check, never sent to the client. */
export function findCredentials(email: string): { id: number; passwordHash: string } | null {
  const row = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email) as
    | { id: number; password_hash: string }
    | undefined;
  return row ? { id: row.id, passwordHash: row.password_hash } : null;
}

export function findUserIdByEmail(email: string): number | null {
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
  return row?.id ?? null;
}

export function createUser(input: { name: string; email: string; password: string; phone: string | null }): AuthUser {
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)')
    .run(input.name, input.email, hashPassword(input.password), input.phone);
  return getUserById(Number(result.lastInsertRowid))!;
}

export function updateProfile(id: number, input: { name: string; phone: string | null }): AuthUser {
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(input.name, input.phone, id);
  return getUserById(id)!;
}

const DEMO_EMAILS = {
  owner: 'owner@rentora.demo',
  renter: 'renter@rentora.demo',
  admin: 'admin@rentora.demo',
} as const;
export type DemoAccount = keyof typeof DEMO_EMAILS;

export function demoAccountId(account: DemoAccount): number | null {
  return findUserIdByEmail(DEMO_EMAILS[account]);
}
