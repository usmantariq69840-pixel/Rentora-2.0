import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { config } from '../config.js';

// The key is derived from SESSION_SECRET, so the database file alone cannot reveal a saved API key.
const key = scryptSync(config.sessionSecret, 'rentora-settings-v1', 32);

/** AES-256-GCM. Output looks like "v1.<iv>.<tag>.<data>" (all base64url). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

/** Returns null when the value is damaged or was encrypted with a different SESSION_SECRET. */
export function decryptSecret(boxed: string): string | null {
  try {
    const [version, iv, tag, data] = boxed.split('.');
    if (version !== 'v1' || !iv || !tag || !data) return null;
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
