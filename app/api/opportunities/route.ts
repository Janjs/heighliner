import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request: Request) { const user = await currentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json(); const title = String(body.title ?? "").trim(), description = String(body.description ?? "").trim(); if (!title || !description) return NextResponse.json({ error: "Title and description are required." }, { status: 400 }); db.prepare("INSERT INTO opportunities (user_id, title, description) VALUES (?, ?, ?)").run(user.id, title, description); return NextResponse.json({ ok: true }); }
