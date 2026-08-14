type Provider = "openai" | "anthropic" | "mistral";

function provider(): Provider {
  const selected = process.env.AI_PROVIDER;
  if (
    selected &&
    selected !== "openai" &&
    selected !== "anthropic" &&
    selected !== "mistral"
  )
    throw new Error("AI_PROVIDER must be openai, anthropic, or mistral.");
  if (selected === "openai" || (!selected && process.env.OPENAI_API_KEY)) {
    if (!process.env.OPENAI_API_KEY)
      throw new Error("OpenAI is not configured.");
    return "openai";
  }
  if (
    selected === "anthropic" ||
    (!selected && process.env.ANTHROPIC_API_KEY)
  ) {
    if (!process.env.ANTHROPIC_API_KEY)
      throw new Error("Claude is not configured.");
    return "anthropic";
  }
  if (!process.env.MISTRAL_API_KEY)
    throw new Error("Add an OpenAI, Anthropic, or Mistral API key.");
  return "mistral";
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

async function requestMistral(system: string, input: unknown) {
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
  if (!response.ok) throw new Error("Mistral could not complete the request.");
  return (await response.json()).choices?.[0]?.message?.content || "{}";
}

export async function generateJson(system: string, input: unknown) {
  const selected = provider();
  const text =
    selected === "openai"
      ? await requestOpenAI(
          [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(input) },
          ],
          8_000,
          true,
        )
      : selected === "anthropic"
        ? await requestAnthropic(
            `${system}\nReturn only valid JSON without Markdown fences.`,
            JSON.stringify(input),
          )
        : await requestMistral(system, input);
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

  const selected = provider();
  if (selected === "mistral") {
    const headers = { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` };
    const upload = new FormData();
    upload.append("purpose", "ocr");
    upload.append("file", file, file.name);
    const uploaded = await fetch("https://api.mistral.ai/v1/files", {
      method: "POST",
      headers,
      body: upload,
    });
    if (!uploaded.ok)
      throw new Error("Mistral could not upload this file for OCR.");
    const { id } = await uploaded.json();
    const signed = await fetch(
      `https://api.mistral.ai/v1/files/${id}/url?expiry=1`,
      { headers },
    );
    if (!signed.ok)
      throw new Error("Mistral could not prepare this file for OCR.");
    const { url } = await signed.json();
    const ocr = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest",
        document: { type: "document_url", document_url: url },
      }),
    });
    if (!ocr.ok) throw new Error("Mistral OCR could not parse this file.");
    const result = await ocr.json();
    return (result.pages ?? [])
      .map((page: { markdown?: string }) => page.markdown ?? "")
      .join("\n")
      .slice(0, 100_000);
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const prompt =
    "Extract all useful text from this file. Preserve headings, lists, and tables where practical. Return plain text only.";
  let text: string;
  if (selected === "openai") {
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
