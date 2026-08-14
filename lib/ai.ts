type Provider = "openai" | "anthropic";

function provider(): Provider {
  const selected = process.env.AI_PROVIDER;
  if (selected && selected !== "openai" && selected !== "anthropic")
    throw new Error("AI_PROVIDER must be openai or anthropic.");
  if (selected === "openai" || (!selected && process.env.OPENAI_API_KEY)) {
    if (!process.env.OPENAI_API_KEY)
      throw new Error("OpenAI is not configured.");
    return "openai";
  }
  if (!process.env.ANTHROPIC_API_KEY)
    throw new Error("Add an OpenAI or Anthropic API key.");
  return "anthropic";
}

function outputText(result: any) {
  return (result.output ?? [])
    .flatMap((item: any) => item.content ?? [])
    .filter((item: any) => item.type === "output_text")
    .map((item: any) => item.text)
    .join("");
}

async function requestOpenAI(
  input: unknown,
  maxOutputTokens = 8_000,
  json = false,
) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input,
      max_output_tokens: maxOutputTokens,
      ...(json ? { text: { format: { type: "json_object" } } } : {}),
    }),
  });
  if (!response.ok) throw new Error("OpenAI could not complete the request.");
  return outputText(await response.json());
}

async function requestAnthropic(
  system: string,
  content: unknown,
  maxTokens = 8_000,
) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!response.ok) throw new Error("Claude could not complete the request.");
  return ((await response.json()).content ?? [])
    .filter((item: any) => item.type === "text")
    .map((item: any) => item.text)
    .join("");
}

export async function generateJson(system: string, input: unknown) {
  const text =
    provider() === "openai"
      ? await requestOpenAI(
          [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(input) },
          ],
          8_000,
          true,
        )
      : await requestAnthropic(
          `${system}\nReturn only valid JSON without Markdown fences.`,
          JSON.stringify(input),
        );
  return JSON.parse(text || "{}");
}

export async function parseFile(file: File) {
  if (
    file.type.startsWith("text/") ||
    [".csv", ".md", ".json", ".xml"].some((extension) =>
      file.name.toLowerCase().endsWith(extension),
    )
  )
    return (await file.text()).slice(0, 100_000);

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const prompt =
    "Extract all useful text from this file. Preserve headings, lists, and tables where practical. Return plain text only.";
  let text: string;
  if (provider() === "openai") {
    const content = file.type.startsWith("image/")
      ? [
          {
            type: "input_image",
            image_url: `data:${file.type};base64,${data}`,
          },
          { type: "input_text", text: prompt },
        ]
      : [
          {
            type: "input_file",
            filename: file.name,
            file_data: `data:${file.type || "application/octet-stream"};base64,${data}`,
          },
          { type: "input_text", text: prompt },
        ];
    text = await requestOpenAI([{ role: "user", content }], 32_000);
  } else {
    if (file.type !== "application/pdf" && !file.type.startsWith("image/"))
      throw new Error(
        "Claude file imports support PDFs, images, and text files.",
      );
    const attachment =
      file.type === "application/pdf"
        ? {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data },
          }
        : {
            type: "image",
            source: { type: "base64", media_type: file.type, data },
          };
    text = await requestAnthropic(
      prompt,
      [attachment, { type: "text", text: prompt }],
      32_000,
    );
  }
  return text.slice(0, 100_000);
}
