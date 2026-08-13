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
  CREATE TABLE IF NOT EXISTS route_runs (id INTEGER PRIMARY KEY, route_id INTEGER NOT NULL, user_id INTEGER NOT NULL, status TEXT NOT NULL, output TEXT NOT NULL, duration_ms INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(route_id) REFERENCES routes(id), FOREIGN KEY(user_id) REFERENCES users(id));
`);

const runColumns = db.pragma("table_info(route_runs)") as { name: string }[];
if (!runColumns.some((column) => column.name === "completed_steps_json"))
  db.exec("ALTER TABLE route_runs ADD COLUMN completed_steps_json TEXT");
if (!runColumns.some((column) => column.name === "output_name"))
  db.exec("ALTER TABLE route_runs ADD COLUMN output_name TEXT");
if (!runColumns.some((column) => column.name === "output_type"))
  db.exec("ALTER TABLE route_runs ADD COLUMN output_type TEXT");

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
if (!routeColumns.some((column) => column.name === "steps_json"))
  db.exec("ALTER TABLE routes ADD COLUMN steps_json TEXT");
if (!routeColumns.some((column) => column.name === "systems_json"))
  db.exec("ALTER TABLE routes ADD COLUMN systems_json TEXT");
if (!routeColumns.some((column) => column.name === "hours"))
  db.exec("ALTER TABLE routes ADD COLUMN hours INTEGER NOT NULL DEFAULT 4");

const workspaceColumns = db.pragma("table_info(workspaces)") as {
  name: string;
}[];
if (!workspaceColumns.some((column) => column.name === "profile_type"))
  db.exec(
    "ALTER TABLE workspaces ADD COLUMN profile_type TEXT NOT NULL DEFAULT 'company'",
  );
