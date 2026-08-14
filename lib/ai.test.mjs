import assert from "node:assert/strict";
import test from "node:test";
import { generateJson, parseFile } from "./ai.ts";

test("uses the selected OpenAI provider and JSON mode", async () => {
  process.env.AI_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "test";
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        output: [{ content: [{ type: "output_text", text: '{"ok":true}' }] }],
      }),
    };
  };

  assert.deepEqual(await generateJson("Return JSON.", { value: 1 }), {
    ok: true,
  });
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.body.text.format.type, "json_object");
});

test("uses the selected Anthropic provider", async () => {
  process.env.AI_PROVIDER = "anthropic";
  process.env.ANTHROPIC_API_KEY = "test";
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ content: [{ type: "text", text: '{"ok":true}' }] }),
  });

  assert.deepEqual(await generateJson("Return JSON.", { value: 1 }), {
    ok: true,
  });
});

test("reads text files without an API request", async () => {
  globalThis.fetch = async () => {
    throw new Error("Unexpected API request");
  };
  assert.equal(await parseFile(new File(["hello"], "notes.md")), "hello");
});
