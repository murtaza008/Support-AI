import { describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";
import { fallbackMiddleware, isOverloaded } from "@/lib/gemini";

const apiError = (statusCode: number) =>
  new APICallError({ message: `HTTP ${statusCode}`, url: "https://example.test", requestBodyValues: {}, statusCode });

// The middleware only passes these through; their exact shape doesn't matter here.
type StreamArgs = Parameters<NonNullable<ReturnType<typeof fallbackMiddleware>["wrapStream"]>>[0];
const args = (doStream: () => Promise<unknown>) =>
  ({ doStream, doGenerate: vi.fn(), params: { prompt: [] }, model: {} }) as unknown as StreamArgs;

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
    const fallback = { doStream: vi.fn(), doGenerate: vi.fn() };
    const mw = fallbackMiddleware(fallback as never);
    const result = await mw.wrapStream!(args(async () => "primary-stream"));
    expect(result).toBe("primary-stream");
    expect(fallback.doStream).not.toHaveBeenCalled();
  });

  it("switches to the fallback model when Google says the model is busy (503)", async () => {
    const fallback = { doStream: vi.fn(async () => "fallback-stream"), doGenerate: vi.fn() };
    const mw = fallbackMiddleware(fallback as never);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await mw.wrapStream!(args(async () => Promise.reject(apiError(503))));
    expect(result).toBe("fallback-stream");
    expect(fallback.doStream).toHaveBeenCalledWith({ prompt: [] });
    warn.mockRestore();
  });

  it("does not hide real errors such as a bad request", async () => {
    const fallback = { doStream: vi.fn(), doGenerate: vi.fn() };
    const mw = fallbackMiddleware(fallback as never);
    await expect(mw.wrapStream!(args(async () => Promise.reject(apiError(400))))).rejects.toThrow("HTTP 400");
    expect(fallback.doStream).not.toHaveBeenCalled();
  });
});
