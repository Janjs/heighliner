import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const user = db.transaction(() => {
    db.prepare("INSERT INTO users (email, password_hash) VALUES ('local@heighliner', 'local') ON CONFLICT(email) DO NOTHING").run();
    const local = db.prepare("SELECT id, gmail_account_id as accountId, gmail_enabled as enabled FROM users WHERE email = 'local@heighliner'").get() as { id: number; accountId: string | null; enabled: number };
    if (!local.accountId && local.enabled >= 0) {
      const existing = db.prepare("SELECT id, gmail_account_id as accountId, gmail_entity_id as entityId, gmail_enabled as enabled FROM users WHERE email != 'local@heighliner' AND gmail_account_id IS NOT NULL AND gmail_entity_id IS NOT NULL ORDER BY gmail_enabled DESC, id DESC LIMIT 1").get() as { id: number; accountId: string; entityId: string; enabled: number } | undefined;
      if (existing) {
        db.prepare("UPDATE users SET gmail_account_id = ?, gmail_entity_id = ?, gmail_enabled = ? WHERE id = ?").run(existing.accountId, existing.entityId, existing.enabled, local.id);
        db.prepare("INSERT INTO sources (user_id, name, kind, parsed_text) SELECT ?, name, kind, parsed_text FROM sources WHERE user_id = ? AND kind = 'gmail' AND NOT EXISTS (SELECT 1 FROM sources WHERE user_id = ? AND kind = 'gmail') LIMIT 1").run(local.id, existing.id, local.id);
      }
    }
    return local;
  })();
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
