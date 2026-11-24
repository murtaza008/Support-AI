import { google } from "@ai-sdk/google";
import { APICallError, embedMany, wrapLanguageModel, type LanguageModelMiddleware } from "ai";

/** Free-tier Gemini models for answers. Rolling aliases, so they stay valid as
 * Google retires versions. When the main model is overloaded (Google returns
 * 503 "high demand", or 429 when the free quota is hit), the same request goes
 * to the lighter model instead of failing. */
export const PRIMARY_CHAT_MODEL = "gemini-flash-latest";
export const FALLBACK_CHAT_MODEL = "gemini-flash-lite-latest";

/** Errors worth retrying on another model: overloaded, rate limited, or a server error. */
export function isOverloaded(error: unknown): boolean {
  return APICallError.isInstance(error) && [429, 500, 502, 503, 504].includes(error.statusCode ?? 0);
}

type FallbackModel = Pick<ReturnType<typeof google>, "doGenerate" | "doStream">;

/** Sends the call to `fallback` when the wrapped model reports it is overloaded. */
export function fallbackMiddleware(fallback: FallbackModel): LanguageModelMiddleware {
  return {
    wrapGenerate: async ({ doGenerate, params }) => {
      try {
        return await doGenerate();
      } catch (error) {
        if (!isOverloaded(error)) throw error;
        console.warn(`[gemini] ${PRIMARY_CHAT_MODEL} unavailable, using ${FALLBACK_CHAT_MODEL}`);
        return fallback.doGenerate(params);
      }
    },
    wrapStream: async ({ doStream, params }) => {
      try {
        return await doStream();
      } catch (error) {
        if (!isOverloaded(error)) throw error;
        console.warn(`[gemini] ${PRIMARY_CHAT_MODEL} unavailable, using ${FALLBACK_CHAT_MODEL}`);
        return fallback.doStream(params);
      }
    },
  };
}

export function chatModel() {
  return wrapLanguageModel({
    model: google(PRIMARY_CHAT_MODEL),
    middleware: fallbackMiddleware(google(FALLBACK_CHAT_MODEL)),
  });
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
