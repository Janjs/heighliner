import type { NextConfig } from "next";

const requiredEnvironment: string[] = ["COMPOSIO_API_KEY"];
const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name],
);
const provider = process.env.AI_PROVIDER;

if (provider && provider !== "openai" && provider !== "anthropic") {
  throw new Error("AI_PROVIDER must be openai or anthropic.");
}
if (provider === "openai" && !process.env.OPENAI_API_KEY) {
  missingEnvironment.push("OPENAI_API_KEY");
} else if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
  missingEnvironment.push("ANTHROPIC_API_KEY");
} else if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  missingEnvironment.push("OPENAI_API_KEY or ANTHROPIC_API_KEY");
}

if (missingEnvironment.length) {
  throw new Error(
    `Heighliner local app requires: ${missingEnvironment.join(", ")}. Add them to .env.local before starting Next.js.`,
  );
}

const nextConfig: NextConfig = {};
export default nextConfig;
