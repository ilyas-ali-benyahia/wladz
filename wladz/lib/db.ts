import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const globalForAuth = globalThis as typeof globalThis & {
  authDatabase?: DatabaseSync;
};

function createDatabase() {
  const path =
    process.env.AUTH_DATABASE_PATH ?? resolve(process.cwd(), ".data", "auth.sqlite");

  mkdirSync(dirname(path), { recursive: true });

  const database = new DatabaseSync(path);
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `);

  // Migration CC-20261013-hub-core-01 : un ancien schéma (sans full_name)
  // est incompatible, ses tables sont recréées.
  const userColumns = database.prepare("PRAGMA table_info(users)").all();
  if (
    userColumns.length > 0 &&
    !userColumns.some((column) => column.name === "full_name")
  ) {
    database.exec(`
      DROP TABLE IF EXISTS sessions;
      DROP TABLE users;
    `);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      birth_date TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
  `);

  return database;
}

// Ouverture paresseuse : `next build` importe les routes dans plusieurs
// processus à la fois et ne doit pas toucher au fichier SQLite.
export function getDb() {
  return (globalForAuth.authDatabase ??= createDatabase());
}
