import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const databasePath = path.join(process.cwd(), "data", "heighliner.db");
mkdirSync(path.dirname(databasePath), { recursive: true });

const globalForDb = globalThis as unknown as { db?: Database.Database };
export const db = globalForDb.db ?? new Database(databasePath);
if (process.env.NODE_ENV !== "production") globalForDb.db = db;

// Next may load route modules in parallel during a production build. Avoid a
// global journal-mode migration here, while still waiting briefly on writes.
db.pragma("busy_timeout = 5000");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS workspaces (user_id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', FOREIGN KEY(user_id) REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS sources (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, parsed_text TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS opportunities (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS routes (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, opportunity_id INTEGER, title TEXT NOT NULL, description TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));
`);
