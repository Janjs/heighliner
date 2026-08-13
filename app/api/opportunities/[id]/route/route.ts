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
  const publicId = (await params).id;
  const opportunityId = Number(publicId.replace(/^opp_/, ""));
  if (!Number.isInteger(opportunityId) || opportunityId < 1)
    return NextResponse.json(
      { error: "Invalid opportunity ID." },
      { status: 400 },
    );

  try {
    const route = await generateRoute(user.id, opportunityId);
    let routeId = 0;
    db.transaction(() => {
      const converted = db
        .prepare(
          "UPDATE opportunities SET status = 'converted' WHERE id = ? AND user_id = ? AND status = 'open'",
        )
        .run(opportunityId, user.id).changes;
      if (!converted) throw new Error("Opportunity not found.");
      const result = db
        .prepare(
          "INSERT INTO routes (user_id, opportunity_id, title, description, hours, systems_json, steps_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          user.id,
          opportunityId,
          route.title,
          route.description,
          route.hours,
          JSON.stringify(route.systems),
          JSON.stringify(route.steps),
        );
      routeId = Number(result.lastInsertRowid);
    })();
    return NextResponse.json({ ok: true, id: routeId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate the route.";
    return NextResponse.json(
      { error: message },
      { status: message === "Opportunity not found." ? 404 : 502 },
    );
  }
}
