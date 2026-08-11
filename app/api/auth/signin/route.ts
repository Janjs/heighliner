import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(String(email ?? "").trim().toLowerCase()) as { id: number; password_hash: string } | undefined;
  if (!user || !(await compare(String(password ?? ""), user.password_hash))) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  await createSession(user.id); return NextResponse.json({ ok: true });
}
