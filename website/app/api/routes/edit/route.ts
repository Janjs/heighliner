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

  const route = {
    ...body.route,
    description: `${body.route.description} (Demo update: ${message})`,
  };
  return NextResponse.json({
    reply: body.locale === "es" ? "Actualización de demostración aplicada." : "Demo update applied.",
    route,
  });
}
