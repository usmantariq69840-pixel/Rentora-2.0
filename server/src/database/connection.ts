import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { seedDatabase } from './seed.js';

// Resolves to server/data/rentora.db whether running from src/ (tsx) or dist/ (tsc).
const dataDir = path.resolve(import.meta.dirname, '../../data');
const schemaPath = path.resolve(import.meta.dirname, '../../src/database/schema.sql');
export const dbFile = path.join(dataDir, 'rentora.db');

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON'); // enforce foreign keys (off by default in SQLite)

/** Small additive upgrades for database files created by an earlier batch. */
function migrate() {
  const notificationColumns = db.prepare('PRAGMA table_info(notifications)').all() as { name: string }[];
  if (!notificationColumns.some((c) => c.name === 'link')) {
    db.exec('ALTER TABLE notifications ADD COLUMN link TEXT');
  }

  // Batch 4: listing tags and the owner's availability note
  const listingColumns = db.prepare('PRAGMA table_info(listings)').all() as { name: string }[];
  if (listingColumns.length && !listingColumns.some((c) => c.name === 'tags')) {
    db.exec("ALTER TABLE listings ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'");
  }
  if (listingColumns.length && !listingColumns.some((c) => c.name === 'availability_note')) {
    db.exec('ALTER TABLE listings ADD COLUMN availability_note TEXT');
  }
}

function applySchema() {
  // Existing databases first get any new columns, then the schema file adds new indexes/tables.
  const hasListings = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'listings'").get();
  if (hasListings) migrate();
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
}

/** Creates tables if needed and seeds the demo data the first time the server runs. */
export function initDatabase() {
  applySchema();
  const hasData = db.prepare('SELECT 1 FROM categories LIMIT 1').get();
  if (!hasData) {
    seedDatabase(db);
    console.log('Database was empty — loaded the demo dataset.');
  }
}

/** Wipes every table and reloads the known demo dataset (used before presentations). */
export function resetDatabase() {
  db.pragma('foreign_keys = OFF');
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  for (const { name } of tables) db.exec(`DROP TABLE IF EXISTS "${name}"`);
  db.pragma('foreign_keys = ON');
  applySchema();
  seedDatabase(db);
}
