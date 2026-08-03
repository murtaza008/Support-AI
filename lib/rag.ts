import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunker";
import { embedTexts } from "@/lib/gemini";
import type { DocumentSourceType } from "@/lib/generated/prisma/enums";

export type Citation = {
  documentId: string;
  documentName: string;
  similarity: number;
};

type RetrievedChunk = {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  similarity: number;
};

const EMBED_BATCH = 50;

export async function ingestDocument(params: {
  workspaceId: string;
  assistantId: string | null;
  name: string;
  sourceType: DocumentSourceType;
  sourceUrl?: string | null;
  content: string;
  createdById: string;
}) {
  const chunks = chunkText(params.content);
  if (chunks.length === 0) throw new Error("No text content to ingest.");

  const doc = await prisma.document.create({
    data: {
      workspaceId: params.workspaceId,
      assistantId: params.assistantId,
      name: params.name,
      sourceType: params.sourceType,
      sourceUrl: params.sourceUrl ?? null,
      status: "PROCESSING",
      sizeBytes: params.content.length,
      charCount: params.content.length,
      chunkCount: chunks.length,
      createdById: params.createdById,
    },
  });

  try {
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const slice = chunks.slice(i, i + EMBED_BATCH);
      const vectors = await embedTexts(slice);
      const indices = slice.map((_, j) => i + j);

      await prisma.documentChunk.createMany({
        data: slice.map((content, j) => ({
          documentId: doc.id,
          workspaceId: params.workspaceId,
          assistantId: params.assistantId,
          chunkIndex: i + j,
          content,
          tokenCount: Math.ceil(content.length / 4),
        })),
      });

      const rows = await prisma.documentChunk.findMany({
        where: { documentId: doc.id, chunkIndex: { in: indices } },
        select: { id: true, chunkIndex: true },
      });
      const idByIndex = new Map(rows.map((r) => [r.chunkIndex, r.id]));

      for (let j = 0; j < slice.length; j++) {
        const id = idByIndex.get(i + j);
        if (!id) continue;
        const vectorLiteral = `[${vectors[j].join(",")}]`;
        await prisma.$executeRaw`UPDATE "DocumentChunk" SET embedding = ${vectorLiteral}::vector WHERE id = ${id}`;
      }
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "READY" },
    });
    return { id: doc.id, chunks: chunks.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "ERROR", error: message },
    });
    throw new Error(message);
  }
}

/** Embeds the query and returns the top-N most similar chunks (cosine distance via pgvector). */
export async function retrieveContext(params: {
  workspaceId: string;
  assistantId: string;
  query: string;
  limit?: number;
}): Promise<RetrievedChunk[]> {
  if (!params.query.trim()) return [];
  const [queryVector] = await embedTexts([params.query]);
  if (!queryVector) return [];
  const vectorLiteral = `[${queryVector.join(",")}]`;
  const limit = params.limit ?? 6;

  return prisma.$queryRaw<RetrievedChunk[]>`
    SELECT c.id, c."documentId" as "documentId", d.name as "documentName", c.content,
           1 - (c.embedding <=> ${vectorLiteral}::vector) as similarity
    FROM "DocumentChunk" c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE c."workspaceId" = ${params.workspaceId}
      AND (c."assistantId" IS NULL OR c."assistantId" = ${params.assistantId})
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;
}

export function buildRagSystemPrompt(assistant: {
  name: string;
  description: string | null;
  tone: string;
  systemPrompt: string | null;
}, contextChunks: RetrievedChunk[]) {
  const toneLine =
    assistant.tone === "professional"
      ? "Be precise, formal, and concise."
      : assistant.tone === "playful"
        ? "Be warm, witty, and use light humor."
        : "Be friendly, warm, and helpful.";

  const contextBlock = contextChunks
    .map((c, i) => `[${i + 1}] (${c.documentName})\n${c.content}`)
    .join("\n\n---\n\n");

  return `You are ${assistant.name}, an AI support assistant.
${assistant.description ? `Purpose: ${assistant.description}` : ""}
${toneLine}
${assistant.systemPrompt ?? ""}

Answer using ONLY the context below when it is relevant. If the answer is not in the context, say so honestly and offer to escalate. Cite sources inline as [1], [2] matching the numbered snippets.

--- CONTEXT ---
${contextBlock || "(No knowledge base results found.)"}
--- END CONTEXT ---`;
}

export function toCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((c) => ({
    documentId: c.documentId,
    documentName: c.documentName,
    similarity: c.similarity,
  }));
}
