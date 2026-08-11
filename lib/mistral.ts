const api = "https://api.mistral.ai/v1";

function headers() { return { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` }; }

export async function parseFile(file: File) {
  if (!process.env.MISTRAL_API_KEY) return "MISTRAL_API_KEY is not configured. The file name was saved, but its contents were not parsed.";
  if (file.type.startsWith("text/") || file.name.endsWith(".csv") || file.name.endsWith(".md")) return (await file.text()).slice(0, 100_000);
  const upload = new FormData();
  upload.append("purpose", "ocr");
  upload.append("file", file, file.name);
  const uploaded = await fetch(`${api}/files`, { method: "POST", headers: headers(), body: upload });
  if (!uploaded.ok) throw new Error("Mistral could not upload this file for OCR.");
  const { id } = await uploaded.json();
  const signed = await fetch(`${api}/files/${id}/url?expiry=1`, { headers: headers() });
  if (!signed.ok) throw new Error("Mistral could not prepare this file for OCR.");
  const { url } = await signed.json();
  const ocr = await fetch(`${api}/ocr`, { method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest", document: { type: "document_url", document_url: url } }) });
  if (!ocr.ok) throw new Error("Mistral OCR could not parse this file.");
  const result = await ocr.json();
  return (result.pages ?? []).map((page: { markdown?: string }) => page.markdown ?? "").join("\n").slice(0, 100_000);
}
