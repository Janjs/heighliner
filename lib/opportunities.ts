import { db } from "./db";
import { generateJson } from "./ai";

export async function generateOpportunities(userId: number) {
  const sources = db
    .prepare(
      "SELECT name, parsed_text FROM sources WHERE user_id = ? ORDER BY id DESC LIMIT 8",
    )
    .all(userId) as { name: string; parsed_text: string | null }[];
  if (!sources.length) throw new Error("Add a source first.");
  const generated = (
    await generateJson(
      "Return JSON only, with an opportunities array of up to five concrete automation opportunities. Each item needs title and description.",
      sources.map((source) => ({
        name: source.name,
        content: source.parsed_text?.slice(0, 12000) ?? "",
      })),
    )
  ).opportunities as { title?: unknown; description?: unknown }[];
  const add = db.prepare(
    "INSERT INTO opportunities (user_id, title, description) VALUES (?, ?, ?)",
  );
  const transaction = db.transaction(() => {
    db.prepare(
      "DELETE FROM opportunities WHERE user_id = ? AND status = 'open'",
    ).run(userId);
    generated.slice(0, 5).forEach((item) => {
      const title = String(item.title ?? "").trim(),
        description = String(item.description ?? "").trim();
      if (title && description) add.run(userId, title, description);
    });
  });
  transaction();
}
