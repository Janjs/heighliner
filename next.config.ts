import type { NextConfig } from "next";

const requiredEnvironment: string[] = ["COMPOSIO_API_KEY"];
const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name],
);
const provider = process.env.AI_PROVIDER;
const providerKeys = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  mistral: "MISTRAL_API_KEY",
} as const;

if (provider && !(provider in providerKeys)) {
  throw new Error("AI_PROVIDER must be openai, anthropic, or mistral.");
}
if (provider) {
  const key = providerKeys[provider as keyof typeof providerKeys];
  if (!process.env[key]) missingEnvironment.push(key);
} else if (
  !process.env.OPENAI_API_KEY &&
  !process.env.ANTHROPIC_API_KEY &&
  !process.env.MISTRAL_API_KEY
) {
  missingEnvironment.push(
    "OPENAI_API_KEY, ANTHROPIC_API_KEY, or MISTRAL_API_KEY",
  );
}

if (missingEnvironment.length) {
  throw new Error(
    `Heighliner local app requires: ${missingEnvironment.join(", ")}. Add them to .env.local before starting Next.js.`,
  );
}

const nextConfig: NextConfig = {};
export default nextConfig;
