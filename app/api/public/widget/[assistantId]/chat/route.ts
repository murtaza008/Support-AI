import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { prisma } from "@/lib/prisma";
import { chatModel } from "@/lib/gemini";
import { retrieveContext, buildRagSystemPrompt, toCitations } from "@/lib/rag";

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

function lastUserText(messages: UIMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return lastUser.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ assistantId: string }> },
) {
  const { assistantId } = await context.params;
  const { messages, visitorId, conversationId } = (await request.json()) as Body;

  if (!Array.isArray(messages)) {
    return new Response("Bad request", { status: 400, headers: CORS });
  }

  const assistant = await prisma.assistant.findUnique({ where: { id: assistantId } });
  if (!assistant) {
    return new Response("Assistant not found", { status: 404, headers: CORS });
  }
  const workspaceId = assistant.workspaceId;

  const userText = lastUserText(messages);
  const hits = userText
    ? await retrieveContext({ workspaceId, assistantId, query: userText })
    : [];
  const citations = toCitations(hits);

  let convId = conversationId ?? null;
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: {
        workspaceId,
        assistantId,
        channel: "WIDGET",
        visitorId: visitorId ?? null,
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
    headers: { ...CORS, "X-Conversation-Id": finalConvId ?? "" },
  });
}
