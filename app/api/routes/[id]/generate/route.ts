import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateRoute } from "@/lib/routes";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  const stored = db
    .prepare(
      "SELECT opportunity_id as opportunityId FROM routes WHERE id = ? AND user_id = ?",
    )
    .get(id, user.id) as { opportunityId: number | null } | undefined;
  if (!stored)
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  if (!stored.opportunityId)
    return NextResponse.json(
      { error: "This route no longer has its source opportunity." },
      { status: 409 },
    );

  try {
    const route = await generateRoute(user.id, stored.opportunityId);
    db.transaction(() => {
      db.prepare("DELETE FROM route_runs WHERE route_id = ? AND user_id = ?").run(
        id,
        user.id,
      );
      db.prepare(
        "UPDATE routes SET title = ?, description = ?, hours = ?, systems_json = ?, steps_json = ?, last_run_at = NULL, last_run_status = NULL WHERE id = ? AND user_id = ?",
      ).run(
        route.title,
        route.description,
        route.hours,
        JSON.stringify(route.systems),
        JSON.stringify(route.steps),
        id,
        user.id,
      );
    })();
    return NextResponse.json({
      route: { id: String(id), ...route, createdAt: id, executions: [] },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to generate the route.",
      },
      { status: 502 },
    );
  }
}
