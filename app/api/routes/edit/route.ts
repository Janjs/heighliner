import { NextResponse } from "next/server";

const kinds = ["system", "ai", "knowledge", "logic", "human"] as const;

type Step = {
  label: string;
  detail: string;
  kind: (typeof kinds)[number];
};

type Route = {
  id: string;
  title: string;
  description: string;
  hours: number;
  systems: string[];
  createdAt: number;
  steps: Step[];
};

const validRoute = (route: unknown): route is Route => {
  const value = route as Route;
  return Boolean(
    value &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.hours === "number" &&
    Array.isArray(value.systems) &&
    value.systems.every((system) => typeof system === "string") &&
    Array.isArray(value.steps) &&
    value.steps.length >= 2 &&
    value.steps.length <= 10 &&
    value.steps.every(
      (step) =>
        typeof step.label === "string" &&
        typeof step.detail === "string" &&
        kinds.includes(step.kind),
    ),
  );
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    route: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        hours: { type: "number" },
        systems: { type: "array", items: { type: "string" } },
        steps: {
          type: "array",
          minItems: 2,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              detail: { type: "string" },
              kind: { type: "string", enum: kinds },
            },
            required: ["label", "detail", "kind"],
          },
        },
      },
      required: ["title", "description", "hours", "systems", "steps"],
    },
  },
  required: ["reply", "route"],
};

export async function POST(request: Request) {
  const body = await request.json();
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!validRoute(body.route) || !message || message.length > 1_000) {
    return NextResponse.json({ error: "Invalid route edit" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "You edit automation routes. Apply only the requested change, preserve everything else, and keep steps concise. Return the complete updated route. A system step reads or writes an external system; knowledge retrieves context; ai transforms content; logic makes a decision; human requests a person. Reply briefly in the user's language.",
          },
          {
            role: "user",
            content: `Current route: ${JSON.stringify(body.route)}\nRequested edit: ${message}\nLocale: ${body.locale === "es" ? "Spanish" : "English"}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "route_edit",
            strict: true,
            schema,
          },
        },
      }),
    });
    if (!response.ok) throw new Error("OpenAI request failed");
    const data = await response.json();
    const text = data.output
      ?.flatMap((item: { content?: unknown[] }) => item.content || [])
      .find((item: { type?: string }) => item.type === "output_text")?.text;
    const result = JSON.parse(text);
    const route = {
      ...body.route,
      ...result.route,
      id: body.route.id,
      createdAt: body.route.createdAt,
    };
    if (!validRoute(route)) throw new Error("Invalid model output");
    return NextResponse.json({ reply: result.reply, route });
  } catch {
    return NextResponse.json(
      { error: "Unable to edit route" },
      { status: 502 },
    );
  }
}
