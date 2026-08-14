import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseFile } from "@/lib/ai";
import { executeRoute } from "@/lib/routes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const routeId = Number((await params).id);
  const startedAt = Date.now();
  const route = db
    .prepare(
      "SELECT id, steps_json as stepsJson FROM routes WHERE id = ? AND user_id = ?",
    )
    .get(routeId, user.id) as
    { id: number; stepsJson: string | null } | undefined;
  if (!route)
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  const result = db
    .prepare(
      "INSERT INTO route_runs (route_id, user_id, status, output, duration_ms, completed_steps_json) VALUES (?, ?, 'running', '', 0, '[]')",
    )
    .run(routeId, user.id);
  const runId = result.lastInsertRowid;
  const createdAt = (
    db
      .prepare("SELECT created_at as createdAt FROM route_runs WHERE id = ?")
      .get(runId) as { createdAt: string }
  ).createdAt;
  db.prepare(
    "UPDATE routes SET last_run_at = CURRENT_TIMESTAMP, last_run_status = 'running' WHERE id = ? AND user_id = ?",
  ).run(routeId, user.id);

  try {
    const files = request.headers
      .get("content-type")
      ?.includes("multipart/form-data")
      ? (await request.formData())
          .getAll("files")
          .filter(
            (value): value is File => value instanceof File && value.size > 0,
          )
      : [];
    if (files.length > 8)
      throw new Error("Choose no more than 8 input files per run.");
    if (files.some((file) => file.size > 20 * 1024 * 1024))
      throw new Error("Input files must be 20 MB or smaller.");
    if (
      files.length &&
      (!route.stepsJson ||
        JSON.parse(route.stepsJson)?.[0]?.action !== "read_files")
    )
      throw new Error("This route does not use input files.");
    const inputs = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        kind: file.type || "file",
        content: await parseFile(file),
      })),
    );
    const { output, outputName, outputType, completedSteps } =
      await executeRoute(user.id, routeId, inputs);
    const durationMs = Date.now() - startedAt;
    db.prepare(
      "UPDATE route_runs SET status = 'completed', output = ?, output_name = ?, output_type = ?, duration_ms = ?, completed_steps_json = ? WHERE id = ?",
    ).run(
      output,
      outputName,
      outputType,
      durationMs,
      JSON.stringify(completedSteps),
      runId,
    );
    db.prepare(
      "UPDATE routes SET last_run_at = CURRENT_TIMESTAMP, last_run_status = 'completed' WHERE id = ? AND user_id = ?",
    ).run(routeId, user.id);
    return NextResponse.json({
      execution: {
        id: String(runId),
        status: "completed",
        output,
        outputName,
        outputType,
        completedSteps,
        durationMs,
        createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run the route.";
    const durationMs = Date.now() - startedAt;
    db.prepare(
      "UPDATE route_runs SET status = 'failed', output = ?, duration_ms = ? WHERE id = ?",
    ).run(message, durationMs, runId);
    db.prepare(
      "UPDATE routes SET last_run_at = CURRENT_TIMESTAMP, last_run_status = 'failed' WHERE id = ? AND user_id = ?",
    ).run(routeId, user.id);
    return NextResponse.json(
      {
        error: message,
        execution: {
          id: String(runId),
          status: "failed",
          output: message,
          completedSteps: [],
          durationMs,
          createdAt,
        },
      },
      { status: 502 },
    );
  }
}
