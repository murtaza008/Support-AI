import { google } from "@ai-sdk/google";
import { embedMany } from "ai";

/** Free-tier Gemini chat model used for streaming RAG answers.
 * "gemini-flash-latest" is a rolling alias to Google's current flash model,
 * so this stays valid as Gemini versions are retired/replaced over time. */
export function chatModel() {
  return google("gemini-flash-latest");
}

const EMBEDDING_MODEL = "gemini-embedding-2";
export const EMBEDDING_DIMENSIONS = 768;

/** Embeds a batch of strings with Gemini's free embedding model, truncated to 768 dims to match the pgvector column. */
export async function embedTexts(values: string[]): Promise<number[][]> {
  if (values.length === 0) return [];
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel(EMBEDDING_MODEL),
    values,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMENSIONS } satisfies Record<string, unknown>,
    },
  });
  return embeddings;
}
