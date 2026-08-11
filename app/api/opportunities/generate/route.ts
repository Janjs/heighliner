import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.MISTRAL_API_KEY) return NextResponse.json({ error: "Set MISTRAL_API_KEY in .env.local to generate opportunities." }, { status: 503 });
  const sources = db.prepare("SELECT name, parsed_text FROM sources WHERE user_id = ? ORDER BY id DESC LIMIT 8").all(user.id) as { name: string; parsed_text: string | null }[];
  if (!sources.length) return NextResponse.json({ error: "Upload at least one source first." }, { status: 400 });
  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.MISTRAL_MODEL || "mistral-small-latest", response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return JSON only, with an opportunities array of up to five concrete automation opportunities. Each item needs title and description." }, { role: "user", content: JSON.stringify(sources.map((source) => ({ name: source.name, content: source.parsed_text?.slice(0, 12000) ?? "" }))) }] }) });
    if (!response.ok) throw new Error("Mistral request failed");
    const content = (await response.json()).choices?.[0]?.message?.content;
    const generated = JSON.parse(content).opportunities as { title?: unknown; description?: unknown }[];
    const add = db.prepare("INSERT INTO opportunities (user_id, title, description) VALUES (?, ?, ?)");
    const transaction = db.transaction(() => generated.slice(0, 5).forEach((item) => { const title = String(item.title ?? "").trim(), description = String(item.description ?? "").trim(); if (title && description) add.run(user.id, title, description); }));
    transaction();
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Mistral could not generate opportunities. Try again shortly." }, { status: 502 }); }
}
