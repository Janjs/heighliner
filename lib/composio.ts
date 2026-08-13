import { Composio } from "@composio/core";

export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  disableVersionCheck: true,
});

export function composioUserId(userId: number) {
  return `heighliner-${userId}`;
}

export function requireGmailConfig() {
  if (!process.env.COMPOSIO_API_KEY || !process.env.COMPOSIO_AUTH_CONFIG_GMAIL) {
    throw new Error("Gmail is not configured. Add the Composio API key and Gmail auth config.");
  }
  return process.env.COMPOSIO_AUTH_CONFIG_GMAIL;
}

export type ComposioToolkit = {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
};

let toolkitCache: { at: number; items: ComposioToolkit[] } | undefined;

export async function listComposioToolkits() {
  if (toolkitCache && Date.now() - toolkitCache.at < 60 * 60 * 1000)
    return toolkitCache.items;
  // ponytail: SDK list response drops next_cursor, so this is capped at 1000. Paginate via REST if the catalog grows past that.
  const items = await composio.toolkits.get({ limit: 1000, sortBy: "usage" });
  const mapped = items.map((item) => ({
    name: item.name,
    slug: item.slug,
    logo: item.meta.logo,
    description: item.meta.description,
  }));
  toolkitCache = { at: Date.now(), items: mapped };
  return mapped;
}
