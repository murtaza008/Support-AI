import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { chatModel } from "@/lib/gemini";
import { retrieveContext, buildRagSystemPrompt, toCitations } from "@/lib/rag";

type ChatBody = {
  messages?: UIMessage[];
  assistantId?: string;
  workspaceId?: string;
  conversationId?: string | null;
};

function lastUserText(messages: UIMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return lastUser.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, assistantId, workspaceId, conversationId } =
    (await request.json()) as ChatBody;

  if (!Array.isArray(messages) || !assistantId || !workspaceId) {
    return new Response("Missing messages/assistantId/workspaceId", { status: 400 });
  }

  try {
    await requireWorkspaceMember(userId, workspaceId);
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const assistant = await prisma.assistant.findUnique({ where: { id: assistantId } });
  if (!assistant || assistant.workspaceId !== workspaceId) {
    return new Response("Assistant not found", { status: 404 });
  }

  const userText = lastUserText(messages);
  const hits = userText
    ? await retrieveContext({ workspaceId, assistantId, query: userText })
    : [];
  const citations = toCitations(hits);

  let convId = conversationId ?? null;
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: { workspaceId, assistantId, channel: "PLAYGROUND" },
      select: { id: true },
    });
    convId = conv.id;
  }

  if (convId && userText) {
    await prisma.message.create({
      data: { conversationId: convId, workspaceId, role: "USER", content: userText },
    });
  }

  const system = buildRagSystemPrompt(assistant, hits);
  const finalConvId = convId;

  const result = streamText({
    model: chatModel(),
    system,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (finalConvId && text) {
        await prisma.message.create({
          data: {
            conversationId: finalConvId,
            workspaceId,
            role: "ASSISTANT",
            content: text,
            citations: citations.length > 0 ? citations : undefined,
          },
        });
      }
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    headers: {
      "X-Conversation-Id": finalConvId ?? "",
      "X-Citations": encodeURIComponent(JSON.stringify(citations)),
    },
  });
}
