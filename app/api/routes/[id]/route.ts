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

  const id = Number((await params).id);
  const route = db
    .prepare(
      "SELECT opportunity_id as opportunityId FROM routes WHERE id = ? AND user_id = ?",
    )
    .get(id, user.id) as { opportunityId: number | null } | undefined;
  if (!route)
    return NextResponse.json({ error: "Route not found." }, { status: 404 });

  db.transaction(() => {
    db.prepare("DELETE FROM route_runs WHERE route_id = ? AND user_id = ?").run(
      id,
      user.id,
    );
    db.prepare("DELETE FROM routes WHERE id = ? AND user_id = ?").run(
      id,
      user.id,
    );
    if (route.opportunityId)
      db.prepare(
        "UPDATE opportunities SET status = 'open' WHERE id = ? AND user_id = ?",
      ).run(route.opportunityId, user.id);
  })();

  return NextResponse.json({ ok: true, opportunityId: route.opportunityId });
}
