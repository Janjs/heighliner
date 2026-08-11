import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db } from "./db";

const cookieName = "heighliner_session";
const oneWeek = 7 * 24 * 60 * 60 * 1000;

export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  return db.prepare("SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > CURRENT_TIMESTAMP").get(token) as { id: number; email: string } | undefined;
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + oneWeek);
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires.toISOString());
  (await cookies()).set(cookieName, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", expires, path: "/" });
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  store.delete(cookieName);
}
