import { db } from "./db";

export async function generateOpportunities(userId: number) {
  if (!process.env.MISTRAL_API_KEY) throw new Error("Mistral is not configured.");
  const sources = db.prepare("SELECT name, parsed_text FROM sources WHERE user_id = ? ORDER BY id DESC LIMIT 8").all(userId) as { name: string; parsed_text: string | null }[];
  if (!sources.length) throw new Error("Add a source first.");
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.MISTRAL_MODEL || "mistral-small-latest", response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return JSON only, with an opportunities array of up to five concrete automation opportunities. Each item needs title and description." }, { role: "user", content: JSON.stringify(sources.map((source) => ({ name: source.name, content: source.parsed_text?.slice(0, 12000) ?? "" }))) }] }) });
  if (!response.ok) throw new Error("Mistral could not generate opportunities.");
  const generated = JSON.parse((await response.json()).choices?.[0]?.message?.content).opportunities as { title?: unknown; description?: unknown }[];
  const add = db.prepare("INSERT INTO opportunities (user_id, title, description) VALUES (?, ?, ?)");
  const transaction = db.transaction(() => { db.prepare("DELETE FROM opportunities WHERE user_id = ? AND status = 'open'").run(userId); generated.slice(0, 5).forEach((item) => { const title = String(item.title ?? "").trim(), description = String(item.description ?? "").trim(); if (title && description) add.run(userId, title, description); }); });
  transaction();
}
