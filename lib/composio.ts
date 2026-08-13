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
