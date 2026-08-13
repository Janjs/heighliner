import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, runId } = await params;
  const file = db
    .prepare(
      "SELECT output, output_name as name, output_type as type FROM route_runs WHERE id = ? AND route_id = ? AND user_id = ? AND status = 'completed'",
    )
    .get(Number(runId), Number(id), user.id) as
    { output: string; name: string | null; type: string | null } | undefined;
  if (!file)
    return NextResponse.json(
      { error: "Output file not found." },
      { status: 404 },
    );

  return new Response(file.output, {
    headers: {
      "Content-Type": file.type || "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${(file.name || "route-output.md").replace(/["\\]/g, "")}"`,
    },
  });
}
