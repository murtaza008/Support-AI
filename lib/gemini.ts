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

/** Google sometimes takes a minute or two just to answer "busy", so the main
 * model gets this long to start responding before the fallback takes over. */
export const PRIMARY_TIMEOUT_MS = 10_000;

type CallOptions = Parameters<FallbackModel["doStream"]>[0];

/**
 * Runs `call` on the main model with a time limit, and sends the same call to
 * `fallback` when the main model is overloaded or too slow to start.
 * A cancel from the user (params.abortSignal) is never treated as overload.
 */
async function withFallback<T>(
  params: CallOptions,
  primary: (params: CallOptions) => PromiseLike<T>,
  fallback: (params: CallOptions) => PromiseLike<T>,
  timeoutMs: number,
): Promise<T> {
  const timeout = new AbortController();
  const signal = params.abortSignal ? AbortSignal.any([params.abortSignal, timeout.signal]) : timeout.signal;
  const timer = setTimeout(() => timeout.abort(new Error("primary model timed out")), timeoutMs);
  try {
    return await primary({ ...params, abortSignal: signal });
  } catch (error) {
    if (params.abortSignal?.aborted) throw error;
    if (!timeout.signal.aborted && !isOverloaded(error)) throw error;
    console.warn(
      `[gemini] ${PRIMARY_CHAT_MODEL} ${timeout.signal.aborted ? "too slow" : "unavailable"}, using ${FALLBACK_CHAT_MODEL}`,
    );
    return fallback(params);
  } finally {
    clearTimeout(timer);
  }
}

/** Sends the call to `fallback` when the wrapped model is overloaded or too slow to start. */
export function fallbackMiddleware(fallback: FallbackModel, timeoutMs = PRIMARY_TIMEOUT_MS): LanguageModelMiddleware {
  return {
    wrapGenerate: ({ model, params }) =>
      withFallback(params, (p) => model.doGenerate(p), (p) => fallback.doGenerate(p), timeoutMs),
    wrapStream: ({ model, params }) =>
      withFallback(params, (p) => model.doStream(p), (p) => fallback.doStream(p), timeoutMs),
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
