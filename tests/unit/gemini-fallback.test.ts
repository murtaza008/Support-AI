import { afterEach, describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";
import { fallbackMiddleware, isOverloaded } from "@/lib/gemini";

const apiError = (statusCode: number) =>
  new APICallError({ message: `HTTP ${statusCode}`, url: "https://example.test", requestBodyValues: {}, statusCode });

type Mw = ReturnType<typeof fallbackMiddleware>;
type StreamArgs = Parameters<NonNullable<Mw["wrapStream"]>>[0];

/** A fake model: doStream behaves as given, with the call options it received. */
function fakeModel(doStream: (opts: { abortSignal?: AbortSignal }) => Promise<unknown>) {
  return { doStream: vi.fn(doStream), doGenerate: vi.fn() };
}
const call = (mw: Mw, primary: ReturnType<typeof fakeModel>, abortSignal?: AbortSignal) =>
  mw.wrapStream!({
    doStream: vi.fn(),
    doGenerate: vi.fn(),
    params: { prompt: [], abortSignal },
    model: primary,
  } as unknown as StreamArgs);

/** Never answers until aborted, like Google holding a request before replying "busy". */
const hangs = (opts: { abortSignal?: AbortSignal }) =>
  new Promise((_, reject) => opts.abortSignal?.addEventListener("abort", () => reject(opts.abortSignal?.reason)));

afterEach(() => vi.restoreAllMocks());

describe("isOverloaded", () => {
  it("is true for overload, rate-limit and server errors only", () => {
    expect(isOverloaded(apiError(503))).toBe(true);
    expect(isOverloaded(apiError(429))).toBe(true);
    expect(isOverloaded(apiError(500))).toBe(true);
    expect(isOverloaded(apiError(400))).toBe(false);
    expect(isOverloaded(apiError(404))).toBe(false);
    expect(isOverloaded(new Error("network"))).toBe(false);
  });
});

describe("fallbackMiddleware", () => {
  it("uses the main model when it answers", async () => {
    const fallback = fakeModel(async () => "fallback-stream");
    const result = await call(fallbackMiddleware(fallback as never), fakeModel(async () => "primary-stream"));
    expect(result).toBe("primary-stream");
    expect(fallback.doStream).not.toHaveBeenCalled();
  });

  it("switches to the fallback when Google says the model is busy (503)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fallback = fakeModel(async () => "fallback-stream");
    const result = await call(fallbackMiddleware(fallback as never), fakeModel(async () => Promise.reject(apiError(503))));
    expect(result).toBe("fallback-stream");
    expect(fallback.doStream).toHaveBeenCalledOnce();
  });

  it("switches to the fallback when the main model is too slow to start", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fallback = fakeModel(async () => "fallback-stream");
    const started = Date.now();
    const result = await call(fallbackMiddleware(fallback as never, 50), fakeModel(hangs));
    expect(result).toBe("fallback-stream");
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("does not hide real errors such as a bad request", async () => {
    const fallback = fakeModel(async () => "fallback-stream");
    await expect(
      call(fallbackMiddleware(fallback as never), fakeModel(async () => Promise.reject(apiError(400)))),
    ).rejects.toThrow("HTTP 400");
    expect(fallback.doStream).not.toHaveBeenCalled();
  });

  it("respects a cancel from the user instead of falling back", async () => {
    const fallback = fakeModel(async () => "fallback-stream");
    const user = new AbortController();
    const pending = call(fallbackMiddleware(fallback as never, 5_000), fakeModel(hangs), user.signal);
    user.abort(new Error("stopped by user"));
    await expect(pending).rejects.toThrow("stopped by user");
    expect(fallback.doStream).not.toHaveBeenCalled();
  });
});
