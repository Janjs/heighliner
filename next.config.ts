import type { NextConfig } from "next";

const requiredEnvironment = ["MISTRAL_API_KEY", "COMPOSIO_API_KEY"] as const;
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length) {
  throw new Error(
    `Heighliner local app requires: ${missingEnvironment.join(", ")}. Add them to .env.local before starting Next.js.`,
  );
}

const nextConfig: NextConfig = {};
export default nextConfig;
