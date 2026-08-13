import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    user: { email: user.email, avatar: user.avatar },
    workspace:
      db
        .prepare(
          "SELECT name, description, profile_type as profileType FROM workspaces WHERE user_id = ?",
        )
        .get(user.id) ?? null,
    sources: db
      .prepare(
        "SELECT id, name, kind, parsed_text as parsedText FROM sources WHERE user_id = ? ORDER BY id DESC",
      )
      .all(user.id),
    opportunities: db
      .prepare(
        "SELECT id, title, description, status FROM opportunities WHERE user_id = ? ORDER BY id DESC",
      )
      .all(user.id),
    routes: db
      .prepare(
        "SELECT id, title, description, last_run_at as lastRunAt, last_run_status as lastRunStatus FROM routes WHERE user_id = ? ORDER BY id DESC",
      )
      .all(user.id),
  });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name)
    return NextResponse.json({ error: "A name is required." }, { status: 400 });
  const profileType = body.profileType === "personal" ? "personal" : "company";
  db.prepare(
    "INSERT INTO workspaces (user_id, name, description, profile_type) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET name = excluded.name, description = excluded.description, profile_type = excluded.profile_type",
  ).run(user.id, name, String(body.description ?? "").trim(), profileType);
  return NextResponse.json({ ok: true });
}
export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const avatar = String((await request.json()).avatar ?? "");
  if (
    avatar.length > 3_000_000 ||
    !/^data:image\/(?:png|jpe?g|gif|webp);base64,/.test(avatar)
  )
    return NextResponse.json(
      { error: "Choose a PNG, JPEG, GIF, or WebP image smaller than 2 MB." },
      { status: 400 },
    );
  db.prepare("UPDATE users SET avatar_data = ? WHERE id = ?").run(
    avatar,
    user.id,
  );
  return NextResponse.json({ ok: true });
}
export async function DELETE() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  db.transaction(() => {
    db.prepare("DELETE FROM routes WHERE user_id = ?").run(user.id);
    db.prepare("DELETE FROM opportunities WHERE user_id = ?").run(user.id);
    db.prepare("DELETE FROM sources WHERE user_id = ?").run(user.id);
    db.prepare("DELETE FROM workspaces WHERE user_id = ?").run(user.id);
    db.prepare(
      "UPDATE users SET avatar_data = NULL, gmail_account_id = NULL, gmail_entity_id = NULL, gmail_enabled = -1 WHERE id = ?",
    ).run(user.id);
  })();
  return NextResponse.json({ ok: true });
}
