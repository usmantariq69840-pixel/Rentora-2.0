import { config } from '../../config.js';
import { db } from '../../database/connection.js';
import { decryptSecret, encryptSecret } from '../../lib/secretBox.js';

const KEY_SETTING = 'gemini_api_key';
const MODEL_SETTING = 'gemini_model';

/** "gemini-flash-latest" always points at Google's current Flash model, so the name never goes stale. */
export const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

interface SettingRow { value: string; updated_at: string }

function readSetting(name: string): SettingRow | undefined {
  return db.prepare('SELECT value, updated_at FROM app_settings WHERE key = ?').get(name) as SettingRow | undefined;
}

function writeSetting(name: string, value: string, userId: number) {
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at, updated_by) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).run(name, value, userId);
}

export type KeySource = 'saved' | 'env' | 'none';

/** The key the AI features will use: one saved from the website wins over one in server/.env. */
export function getActiveGeminiKey(): { key: string; source: Exclude<KeySource, 'none'> } | null {
  const saved = readSetting(KEY_SETTING);
  if (saved) {
    const key = decryptSecret(saved.value);
    if (key) return { key, source: 'saved' };
  }
  if (config.geminiApiKey) return { key: config.geminiApiKey, source: 'env' };
  return null;
}

export const aiIsConfigured = () => getActiveGeminiKey() !== null;

export function getGeminiModel(): string {
  return readSetting(MODEL_SETTING)?.value || DEFAULT_GEMINI_MODEL;
}

/** "AIza…x9Kq": enough to recognise which key is saved, never enough to use it. */
function mask(key: string) {
  return key.length > 12 ? `${key.slice(0, 4)}…${key.slice(-4)}` : '••••••••';
}

/** What the admin settings page may see. The full key is never returned. */
export function getAiSettingsView() {
  const saved = readSetting(KEY_SETTING);
  const active = getActiveGeminiKey();
  const savedKey = saved ? decryptSecret(saved.value) : null;
  return {
    configured: active !== null,
    source: (active?.source ?? 'none') as KeySource,
    maskedKey: active ? mask(active.key) : null,
    savedKeyUnreadable: !!saved && !savedKey,
    envKeyPresent: !!config.geminiApiKey,
    model: getGeminiModel(),
    defaultModel: DEFAULT_GEMINI_MODEL,
    updatedAt: saved?.updated_at ?? null,
  };
}

export function saveGeminiKey(key: string, userId: number) {
  writeSetting(KEY_SETTING, encryptSecret(key), userId);
}

export function deleteGeminiKey() {
  db.prepare('DELETE FROM app_settings WHERE key = ?').run(KEY_SETTING);
}

export function saveGeminiModel(model: string, userId: number) {
  if (model === DEFAULT_GEMINI_MODEL) db.prepare('DELETE FROM app_settings WHERE key = ?').run(MODEL_SETTING);
  else writeSetting(MODEL_SETTING, model, userId);
}
