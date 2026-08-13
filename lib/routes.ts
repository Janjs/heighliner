import { db } from "./db";

const actions = [
  "read_sources",
  "read_files",
  "ai_transform",
  "create_file",
] as const;
const unsupportedAction =
  /\b(store|save|send|update|delete|publish|modify|schedule|upload|post)\b/i;
export type RouteStep = {
  label: string;
  detail: string;
  kind: "knowledge" | "ai" | "system";
  action: (typeof actions)[number];
};

export type RouteInput = { name: string; kind: string; content: string };

type GeneratedRoute = {
  title: string;
  description: string;
  hours: number;
  systems: string[];
  steps: RouteStep[];
};

async function askMistral(system: string, input: unknown) {
  if (!process.env.MISTRAL_API_KEY)
    throw new Error("Mistral is not configured.");
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_MODEL || "mistral-small-latest",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(input) },
      ],
    }),
  });
  if (!response.ok) throw new Error("Mistral could not complete the route.");
  return JSON.parse(
    (await response.json()).choices?.[0]?.message?.content || "{}",
  );
}

function validRoute(value: unknown): value is GeneratedRoute {
  const route = value as GeneratedRoute;
  const createsFile =
    Array.isArray(route?.steps) && route.steps.at(-1)?.action === "create_file";
  return Boolean(
    route &&
    typeof route.title === "string" &&
    typeof route.description === "string" &&
    Number.isFinite(route.hours) &&
    Array.isArray(route.systems) &&
    route.systems.every((system) => typeof system === "string") &&
    Array.isArray(route.steps) &&
    route.steps.length >= (createsFile ? 3 : 2) &&
    route.steps.length <= 5 &&
    route.steps.every(
      (step) =>
        typeof step.label === "string" &&
        typeof step.detail === "string" &&
        actions.includes(step.action),
    ) &&
    ["read_sources", "read_files"].includes(route.steps[0].action) &&
    route.steps
      .slice(1, createsFile ? -1 : undefined)
      .every((step) => step.action === "ai_transform"),
  );
}

export async function generateRoute(userId: number, opportunityId: number) {
  const opportunity = db
    .prepare(
      "SELECT title, description FROM opportunities WHERE id = ? AND user_id = ?",
    )
    .get(opportunityId, userId) as
    { title: string; description: string } | undefined;
  if (!opportunity) throw new Error("Opportunity not found.");

  const sources = db
    .prepare(
      "SELECT name, kind, parsed_text as content FROM sources WHERE user_id = ? ORDER BY id DESC LIMIT 8",
    )
    .all(userId) as { name: string; kind: string; content: string | null }[];
  const hasKnowledge = sources.some((source) => source.kind !== "gmail");
  const availableSystems = [
    ...new Set([
      ...sources.filter((source) => source.kind === "gmail").map(() => "Gmail"),
      ...(hasKnowledge ? ["Company knowledge"] : []),
    ]),
  ];
  const prompt =
    "Design one executable AI route for the supplied opportunity and source context. Return JSON only with title, description, hours (integer hours saved per week), systems, and 2-5 ordered steps. Each step has label, detail, and action. Start with read_sources for imported company context, or read_files only when the route specifically needs files supplied at run time. Follow it with one or more ai_transform steps. End with create_file because every route result must be a downloadable Markdown file. These are the only capabilities available. Labels are short user-facing titles such as Read emails or Extract promotions; never expose action identifiers or snake_case in labels. Never add file input merely because the capability exists. Never add steps that send, update, delete, publish, modify, schedule, upload, or write to another system. Do not add optional or conditional steps. Use only systems listed in availableSystems. Every label and detail must describe exactly what that executable action does.";
  const input = {
    opportunity,
    availableSystems,
    sources: sources.map((source) => ({
      name: source.name,
      kind: source.kind,
      content: source.content?.slice(0, 12_000) || "",
    })),
  };
  const fallback = {
    title: opportunity.title,
    description: opportunity.description,
    hours: 4,
    systems: availableSystems,
    steps: [
      {
        label: "Read imported source data",
        detail: "Read the imported company sources relevant to this route.",
        action: "read_sources" as const,
        kind: "knowledge" as const,
      },
      {
        label: "Create the route output",
        detail: `Transform the imported source data into a useful result for ${opportunity.title}.`,
        action: "ai_transform" as const,
        kind: "ai" as const,
      },
      {
        label: "Output file",
        detail: "Save the final result as a Markdown file.",
        action: "create_file" as const,
        kind: "system" as const,
      },
    ],
  };
  let generated = await askMistral(prompt, input);
  if (!validRoute(generated)) generated = await askMistral(prompt, input);
  if (!validRoute(generated)) return fallback;

  const systems = generated.systems.filter((system) =>
    availableSystems.includes(system),
  );
  const createsFile = generated.steps.at(-1)!.action === "create_file";
  const transforms = generated.steps
    .slice(1, createsFile ? -1 : undefined)
    .filter((step) => !unsupportedAction.test(`${step.label} ${step.detail}`));
  transforms.splice(3);
  if (!transforms.length) return fallback;
  return {
    title: generated.title.trim() || opportunity.title,
    description: generated.description.trim() || opportunity.description,
    hours: Math.max(1, Math.round(generated.hours)),
    systems: systems.length ? systems : availableSystems,
    steps: [
      {
        label:
          generated.steps[0].action === "read_files"
            ? "Input files"
            : generated.steps[0].label.trim(),
        detail: generated.steps[0].detail.trim(),
        action: generated.steps[0].action,
        kind: "knowledge" as const,
      },
      ...transforms.map((step) => ({
        label: step.label.trim(),
        detail: step.detail.trim(),
        action: "ai_transform" as const,
        kind: "ai" as const,
      })),
      {
        label: "Output file",
        detail: createsFile
          ? generated.steps.at(-1)!.detail.trim() ||
            "Save the final result as a Markdown file."
          : "Save the final result as a Markdown file.",
        action: "create_file" as const,
        kind: "system" as const,
      },
    ],
  };
}

export async function executeRoute(
  userId: number,
  routeId: number,
  inputs: RouteInput[] = [],
) {
  const route = db
    .prepare(
      "SELECT title, description, steps_json as stepsJson FROM routes WHERE id = ? AND user_id = ?",
    )
    .get(routeId, userId) as
    | { title: string; description: string; stepsJson: string | null }
    | undefined;
  if (!route) throw new Error("Route not found.");
  if (!route.stepsJson)
    throw new Error("Generate this route before running it.");
  const steps = JSON.parse(route.stepsJson) as RouteStep[];
  const createsFile = steps.at(-1)?.action === "create_file";
  if (!validRoute({ ...route, hours: 1, systems: [], steps }))
    throw new Error(
      "This route contains unsupported steps. Regenerate it first.",
    );
  const sources = db
    .prepare(
      "SELECT name, kind, parsed_text as content FROM sources WHERE user_id = ? ORDER BY id DESC LIMIT 8",
    )
    .all(userId) as { name: string; kind: string; content: string | null }[];
  const readsFiles = steps[0].action === "read_files";
  if (inputs.length && !readsFiles)
    throw new Error("This route does not use input files.");
  if (readsFiles && !inputs.length)
    throw new Error("Choose an input file before running this route.");
  const routeInputs = readsFiles ? [...sources, ...inputs] : sources;
  if (!routeInputs.length)
    throw new Error(
      "Add a source or choose an input file before running this route.",
    );
  let output = routeInputs
    .map(
      (source) =>
        `Source: ${source.name} (${source.kind})\n${source.content?.slice(0, 12_000) || ""}`,
    )
    .join("\n\n");
  const completedSteps = [steps[0].label];

  for (const step of steps.slice(1, createsFile ? -1 : undefined)) {
    const result = await askMistral(
      "Perform exactly one text transformation step. Use only the supplied input. Return JSON only with an output string. Do not invent facts, dates, actions, or data. Do not claim to have stored, sent, updated, deleted, published, scheduled, or modified anything.",
      {
        route: { title: route.title, description: route.description },
        step: { label: step.label, detail: step.detail },
        input: output,
      },
    );
    output = typeof result.output === "string" ? result.output.trim() : "";
    if (!output)
      throw new Error(`The step “${step.label}” returned no result.`);
    completedSteps.push(step.label);
  }
  if (createsFile) completedSteps.push(steps.at(-1)!.label);
  const outputName = createsFile
    ? `${
        route.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "route-output"
      }.md`
    : null;
  return {
    output,
    outputName,
    outputType: createsFile ? "text/markdown" : null,
    completedSteps,
  };
}

export async function editRoute(
  userId: number,
  routeId: number,
  message: string,
) {
  const stored = db
    .prepare(
      "SELECT title, description, hours, systems_json as systemsJson, steps_json as stepsJson FROM routes WHERE id = ? AND user_id = ?",
    )
    .get(routeId, userId) as
    | {
        title: string;
        description: string;
        hours: number;
        systemsJson: string | null;
        stepsJson: string | null;
      }
    | undefined;
  if (!stored) throw new Error("Route not found.");
  if (!stored.stepsJson)
    throw new Error("Generate this route before editing it.");
  const current = {
    title: stored.title,
    description: stored.description,
    hours: stored.hours,
    systems: JSON.parse(stored.systemsJson || "[]"),
    steps: JSON.parse(stored.stepsJson),
  };
  const generated = await askMistral(
    "Apply the user's requested edit to the supplied AI route. Return JSON only with title, description, hours, systems, and 2-5 ordered steps. Each step has label, detail, and action. Start with read_sources, or read_files only if the user requests run-time file input. Follow with ai_transform steps. End with create_file only if the user requests a downloadable Markdown file. Labels are short user-facing titles; never expose action identifiers or snake_case in labels. Never add file input or output merely because the capability exists. Never add steps that send, update, delete, publish, modify, schedule, upload, or write to another system. Keep the existing systems.",
    { current, requestedEdit: message },
  );
  if (!validRoute(generated))
    throw new Error("Mistral returned an invalid route.");
  const createsFile = generated.steps.at(-1)!.action === "create_file";
  const transforms = generated.steps
    .slice(1, createsFile ? -1 : undefined)
    .filter((step) => !unsupportedAction.test(`${step.label} ${step.detail}`));
  if (!transforms.length)
    throw new Error("That edit did not contain any executable route steps.");
  const route = {
    title: generated.title.trim(),
    description: generated.description.trim(),
    hours: Math.max(1, Math.round(generated.hours)),
    systems: current.systems,
    steps: [
      {
        ...generated.steps[0],
        label:
          generated.steps[0].action === "read_files"
            ? "Input files"
            : generated.steps[0].label.trim(),
        kind: "knowledge" as const,
      },
      ...transforms.map((step) => ({
        label: step.label.trim(),
        detail: step.detail.trim(),
        action: "ai_transform" as const,
        kind: "ai" as const,
      })),
      ...(createsFile
        ? [
            {
              label: "Output file",
              detail:
                generated.steps.at(-1)!.detail.trim() ||
                "Save the final result as a Markdown file.",
              action: "create_file" as const,
              kind: "system" as const,
            },
          ]
        : []),
    ],
  };
  db.prepare(
    "UPDATE routes SET title = ?, description = ?, hours = ?, steps_json = ? WHERE id = ? AND user_id = ?",
  ).run(
    route.title,
    route.description,
    route.hours,
    JSON.stringify(route.steps),
    routeId,
    userId,
  );
  return route;
}
