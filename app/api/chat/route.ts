import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { chatModel } from "@/lib/gemini";
import { retrieveContext, buildRagSystemPrompt, toCitations } from "@/lib/rag";
import { lastUserText, MAX_USER_MESSAGE_CHARS, ownedConversationId, recentMessages } from "@/lib/chat";
import { DEMO_WORKSPACE_SLUG } from "@/lib/demo/constants";
import { demoChatLimitMessage, demoVisitorKey } from "@/lib/demo/rate-limit";

type ChatBody = {
  messages?: UIMessage[];
  assistantId?: string;
  workspaceId?: string;
  conversationId?: string | null;
};

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ChatBody | null;
  const { messages, assistantId, workspaceId, conversationId } = body ?? {};

  if (!Array.isArray(messages) || !assistantId || !workspaceId) {
    return new Response("Missing messages/assistantId/workspaceId", { status: 400 });
  }

  try {
    await requireWorkspaceMember(userId, workspaceId);
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const assistant = await prisma.assistant.findUnique({
    where: { id: assistantId },
    include: { workspace: { select: { slug: true } } },
  });
  if (!assistant || assistant.workspaceId !== workspaceId) {
    return new Response("Assistant not found", { status: 404 });
  }

  const userText = lastUserText(messages);
  if (userText.length > MAX_USER_MESSAGE_CHARS) {
    return new Response(`Messages are limited to ${MAX_USER_MESSAGE_CHARS} characters.`, { status: 400 });
  }

  // Everyone shares the demo login, so demo playground chats are told apart (and rate limited) per visitor.
  const isDemo = assistant.workspace.slug === DEMO_WORKSPACE_SLUG;
  const visitorId = isDemo ? demoVisitorKey(request) : null;
  if (isDemo) {
    const limited = await demoChatLimitMessage(workspaceId, visitorId!);
    if (limited) return new Response(limited, { status: 429 });
  }

  const hits = userText
    ? await retrieveContext({ workspaceId, assistantId, query: userText })
    : [];
  const citations = toCitations(hits);

  let convId = await ownedConversationId({ conversationId, assistantId, visitorId });
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: { workspaceId, assistantId, channel: "PLAYGROUND", visitorId },
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
    messages: await convertToModelMessages(recentMessages(messages)),
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
