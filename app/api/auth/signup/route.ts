import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized) || String(password ?? "").length < 8) return NextResponse.json({ error: "Use a valid email and a password of at least 8 characters." }, { status: 400 });
  try { const result = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(normalized, await hash(password, 12)); await createSession(Number(result.lastInsertRowid)); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 }); }
}
