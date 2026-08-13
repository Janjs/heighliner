import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const publicId = (await params).id;
  const id = Number(publicId.replace(/^opp_/, ""));
  if (!Number.isInteger(id) || id < 1)
    return NextResponse.json(
      { error: "Invalid opportunity ID." },
      { status: 400 },
    );
  const deleted = db.transaction(() => {
    db.prepare(
      "UPDATE routes SET opportunity_id = NULL WHERE opportunity_id = ? AND user_id = ?",
    ).run(id, user.id);
    return db
      .prepare("DELETE FROM opportunities WHERE id = ? AND user_id = ?")
      .run(id, user.id).changes;
  })();

  if (!deleted)
    return NextResponse.json(
      { error: "Opportunity not found." },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
