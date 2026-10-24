import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { prisma } from "@/lib/prisma";
import { chatModel } from "@/lib/gemini";
import { retrieveContext, buildRagSystemPrompt, toCitations } from "@/lib/rag";
import { lastUserText, MAX_USER_MESSAGE_CHARS, ownedConversationId, recentMessages } from "@/lib/chat";
import { DEMO_WORKSPACE_SLUG } from "@/lib/demo/constants";
import { demoChatLimitMessage, demoVisitorKey } from "@/lib/demo/rate-limit";

type Body = {
  messages?: UIMessage[];
  visitorId?: string | null;
  conversationId?: string | null;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "X-Conversation-Id",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ assistantId: string }> },
) {
  const { assistantId } = await context.params;
  const body = (await request.json().catch(() => null)) as Body | null;
  const { messages, conversationId } = body ?? {};

  if (!Array.isArray(messages)) {
    return new Response("Bad request", { status: 400, headers: CORS });
  }

  const assistant = await prisma.assistant.findUnique({
    where: { id: assistantId },
    include: { workspace: { select: { slug: true } } },
  });
  if (!assistant) {
    return new Response("Assistant not found", { status: 404, headers: CORS });
  }
  const workspaceId = assistant.workspaceId;

  const userText = lastUserText(messages);
  if (userText.length > MAX_USER_MESSAGE_CHARS) {
    return new Response(`Messages are limited to ${MAX_USER_MESSAGE_CHARS} characters.`, {
      status: 400,
      headers: CORS,
    });
  }

  // Demo assistants: the visitor id is derived server-side so the hourly limit can't be dodged.
  const isDemo = assistant.workspace.slug === DEMO_WORKSPACE_SLUG;
  const visitorId = isDemo
    ? demoVisitorKey(request)
    : typeof body?.visitorId === "string"
      ? body.visitorId.slice(0, 64)
      : null;
  if (isDemo) {
    const limited = await demoChatLimitMessage(workspaceId, visitorId!);
    if (limited) return new Response(limited, { status: 429, headers: CORS });
  }

  const hits = userText
    ? await retrieveContext({ workspaceId, assistantId, query: userText })
    : [];
  const citations = toCitations(hits);

  let convId = await ownedConversationId({ conversationId, assistantId, visitorId });
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: {
        workspaceId,
        assistantId,
        channel: "WIDGET",
        visitorId,
      },
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
    headers: { ...CORS, "X-Conversation-Id": finalConvId ?? "" },
  });
}
