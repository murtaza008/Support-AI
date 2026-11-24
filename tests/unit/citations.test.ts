import { describe, expect, it } from "vitest";
import { parseCitationsHeader, segments } from "@/lib/citations";

describe("parseCitationsHeader", () => {
  it("decodes the URI-encoded JSON the chat route sends", () => {
    const cites = [{ documentId: "d1", documentName: "Refunds & returns", similarity: 0.81 }];
    expect(parseCitationsHeader(encodeURIComponent(JSON.stringify(cites)))).toEqual(cites);
  });

  it("returns an empty list for a missing or broken header", () => {
    expect(parseCitationsHeader(null)).toEqual([]);
    expect(parseCitationsHeader("%E0%A4%A")).toEqual([]);
    expect(parseCitationsHeader(encodeURIComponent('{"not":"a list"}'))).toEqual([]);
  });
});

describe("segments", () => {
  it("splits single and grouped markers out of the text", () => {
    expect(segments("Refunds take 5 days [1]. See billing [2, 3]")).toEqual([
      "Refunds take 5 days ",
      { nums: [1], tail: "." },
      " See billing ",
      { nums: [2, 3], tail: "" },
    ]);
  });

  it("keeps trailing punctuation with its marker so it never wraps alone", () => {
    expect(segments("Yes [2]).")).toEqual(["Yes ", { nums: [2], tail: ")." }]);
  });

  it("handles adjacent markers and text without markers", () => {
    expect(segments("A[1][2] b")).toEqual(["A", { nums: [1], tail: "" }, { nums: [2], tail: "" }, " b"]);
    expect(segments("No sources here.")).toEqual(["No sources here."]);
  });
});
