import type { UIMessage } from "ai";
import { prisma } from "@/lib/prisma";

/** Longest single customer message we pass to the model. */
export const MAX_USER_MESSAGE_CHARS = 4000;
/** Only the most recent turns go to the model, so a client can't pad the prompt with a huge history. */
const MAX_HISTORY_MESSAGES = 20;

export function lastUserText(messages: UIMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return lastUser.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

export function recentMessages(messages: UIMessage[]): UIMessage[] {
  return messages.slice(-MAX_HISTORY_MESSAGES);
}

/**
 * The client's conversation id, but only if it belongs to this assistant and
 * visitor. Anything else returns null, so a fresh conversation is started
 * instead of writing into someone else's transcript.
 */
export async function ownedConversationId(params: {
  conversationId?: string | null;
  assistantId: string;
  visitorId: string | null;
}): Promise<string | null> {
  if (!params.conversationId) return null;
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    select: { assistantId: true, visitorId: true },
  });
  if (
    !conversation ||
    conversation.assistantId !== params.assistantId ||
    conversation.visitorId !== params.visitorId
  ) {
    return null;
  }
  return params.conversationId;
}
