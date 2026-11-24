import { describe, expect, it } from "vitest";
import { duration, timeAgo } from "@/lib/time";

const now = new Date("2026-11-25T12:00:00Z");
const ago = (s: number) => new Date(now.getTime() - s * 1000);

describe("timeAgo", () => {
  it("uses the largest whole unit", () => {
    expect(timeAgo(ago(30), now)).toBe("30 seconds ago");
    expect(timeAgo(ago(5 * 60), now)).toBe("5 minutes ago");
    expect(timeAgo(ago(3 * 3600), now)).toBe("3 hours ago");
    expect(timeAgo(ago(2 * 86400), now)).toBe("2 days ago");
    expect(timeAgo(ago(10 * 86400), now)).toBe("1 week ago");
    expect(timeAgo(ago(70 * 86400), now)).toBe("2 months ago");
  });

  it("handles the future and ISO strings", () => {
    expect(timeAgo(new Date(now.getTime() + 13 * 86400 * 1000).toISOString(), now)).toBe("in 2 weeks");
  });
});

describe("duration", () => {
  it("has no direction and pluralises", () => {
    expect(duration(ago(86400), now)).toBe("1 day");
    expect(duration(ago(90 * 86400), now)).toBe("3 months");
  });
});
