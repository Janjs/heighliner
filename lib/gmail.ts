import { composio } from "./composio";

export type PromoMail = { id: string; subject: string; sender: string };

export async function fetchPromotions(accountId: string, entityId: string): Promise<PromoMail[]> {
  const result = await composio.tools.execute("GMAIL_FETCH_EMAILS", {
    connectedAccountId: accountId,
    userId: entityId,
    dangerouslySkipVersionCheck: true,
    arguments: { query: "category:promotions newer_than:30d", max_results: 20, verbose: false, include_payload: false },
  });
  if (!result.successful) throw new Error(result.error || "Gmail could not read promotional messages.");
  const data = result.data as { messages?: { messageId?: string; id?: string; subject?: string | null; sender?: string | null; from?: string | null }[] } | undefined;
  return (data?.messages ?? []).map((mail) => ({ id: mail.messageId ?? mail.id ?? "", subject: mail.subject || "(No subject)", sender: mail.sender || mail.from || "Unknown sender" }));
}
