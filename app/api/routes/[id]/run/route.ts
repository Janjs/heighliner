import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  const route = db.prepare("SELECT id FROM routes WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!route) return NextResponse.json({ error: "Route not found." }, { status: 404 });
  db.prepare("UPDATE routes SET last_run_at = CURRENT_TIMESTAMP, last_run_status = 'completed' WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
