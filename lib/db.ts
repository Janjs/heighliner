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

const userColumns = db.pragma("table_info(users)") as { name: string }[];
if (!userColumns.some((column) => column.name === "gmail_account_id"))
  db.exec("ALTER TABLE users ADD COLUMN gmail_account_id TEXT");
if (!userColumns.some((column) => column.name === "gmail_enabled"))
  db.exec(
    "ALTER TABLE users ADD COLUMN gmail_enabled INTEGER NOT NULL DEFAULT 0",
  );
if (!userColumns.some((column) => column.name === "gmail_entity_id"))
  db.exec("ALTER TABLE users ADD COLUMN gmail_entity_id TEXT");
if (!userColumns.some((column) => column.name === "avatar_data"))
  db.exec("ALTER TABLE users ADD COLUMN avatar_data TEXT");

const routeColumns = db.pragma("table_info(routes)") as { name: string }[];
if (!routeColumns.some((column) => column.name === "last_run_at"))
  db.exec("ALTER TABLE routes ADD COLUMN last_run_at TEXT");
if (!routeColumns.some((column) => column.name === "last_run_status"))
  db.exec("ALTER TABLE routes ADD COLUMN last_run_status TEXT");

const workspaceColumns = db.pragma("table_info(workspaces)") as {
  name: string;
}[];
if (!workspaceColumns.some((column) => column.name === "profile_type"))
  db.exec(
    "ALTER TABLE workspaces ADD COLUMN profile_type TEXT NOT NULL DEFAULT 'company'",
  );
