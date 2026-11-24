import { beforeEach, describe, expect, it, vi } from "vitest";
import { guard, resetGuard } from "./helpers";
import { findGaps, parseCitations, percentChange, topDocuments, uncitedAnswers } from "@/lib/analytics";

const prisma = vi.hoisted(() => ({
  message: { findMany: vi.fn(), count: vi.fn() },
  conversation: { findMany: vi.fn(), count: vi.fn() },
  assistant: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/session", async () => (await import("./helpers")).sessionMock);
vi.mock("@/lib/workspace", async () => (await import("./helpers")).workspaceMock);
vi.mock("@/lib/generated/prisma/client", async () => (await import("./helpers")).prismaClientMock);

const { GET } = await import("@/app/api/analytics/route");
const at = (iso: string) => new Date(iso);
const cite = (id: string, name: string) => ({ documentId: id, documentName: name, similarity: 0.8 });

describe("analytics helpers", () => {
  it("parses only well-formed citations", () => {
    expect(parseCitations(null)).toEqual([]);
    expect(parseCitations([{ documentId: "d", documentName: "D" }, { bad: 1 }, null])).toHaveLength(1);
  });

  it("ranks documents by how many answers cited them", () => {
    const top = topDocuments([
      { citations: [cite("a", "Refunds"), cite("a", "Refunds"), cite("b", "Billing")] },
      { citations: [cite("b", "Billing")] },
      { citations: [cite("b", "Billing"), cite("c", "Shipping")] },
      { citations: null },
    ]);
    expect(top.map((d) => [d.name, d.answers, d.citations])).toEqual([
      ["Billing", 3, 3],
      ["Refunds", 1, 2],
      ["Shipping", 1, 1],
    ]);
  });

  it("pairs uncited answers with the question right before them", () => {
    const answers = [
      { conversationId: "c1", createdAt: at("2026-11-20T10:01:00Z"), citations: [] },
      { conversationId: "c1", createdAt: at("2026-11-20T10:05:00Z"), citations: null },
      { conversationId: "c2", createdAt: at("2026-11-21T09:00:00Z"), citations: [cite("a", "A")] },
      { conversationId: "c3", createdAt: at("2026-11-22T09:00:00Z"), citations: [] },
    ];
    const uncited = uncitedAnswers(answers);
    expect(uncited).toHaveLength(3);
    const gaps = findGaps(
      uncited,
      [
        { conversationId: "c1", createdAt: at("2026-11-20T10:00:00Z"), content: "Do you ship to Iceland?" },
        { conversationId: "c1", createdAt: at("2026-11-20T10:04:00Z"), content: "And   Greenland?\n" },
        { conversationId: "c3", createdAt: at("2026-11-22T08:59:00Z"), content: "Is there a student discount?" },
      ],
      new Map([
        ["c1", "asst-1"],
        ["c3", "asst-2"],
      ]),
    );
    expect(gaps).toEqual([
      { conversationId: "c3", assistantId: "asst-2", question: "Is there a student discount?", at: "2026-11-22T09:00:00.000Z" },
      { conversationId: "c1", assistantId: "asst-1", question: "And Greenland?", at: "2026-11-20T10:05:00.000Z" },
    ]);
  });

  it("computes percentage change, or null with no baseline", () => {
    expect(percentChange(30, 20)).toBe(50);
    expect(percentChange(10, 20)).toBe(-50);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("GET /api/analytics", () => {
  const url = (q: string) => new Request(`http://test/api/analytics?${q}`);

  beforeEach(() => {
    resetGuard();
    prisma.message.findMany.mockImplementation(async (args: { where: { role?: string } }) => {
      if (args.where.role === "USER") {
        return [{ conversationId: "c2", createdAt: at("2026-11-23T10:59:00Z"), content: "Do you sell gift cards?" }];
      }
      return [
        { id: "m1", role: "USER", createdAt: at("2026-11-23T09:59:00Z"), conversationId: "c1", citations: null },
        { id: "m2", role: "ASSISTANT", createdAt: at("2026-11-23T10:00:00Z"), conversationId: "c1", citations: [cite("d1", "Refunds")] },
        { id: "m3", role: "ASSISTANT", createdAt: at("2026-11-23T11:00:00Z"), conversationId: "c2", citations: [] },
      ];
    });
    prisma.message.count.mockResolvedValue(40);
    prisma.conversation.findMany.mockResolvedValue([
      { id: "c1", assistantId: "a1", channel: "WIDGET", createdAt: at("2026-11-23T10:00:00Z"), resolved: true, rating: null },
      { id: "c2", assistantId: "a1", channel: "PLAYGROUND", createdAt: at("2026-11-23T11:00:00Z"), resolved: false, rating: null },
    ]);
    prisma.conversation.count.mockResolvedValueOnce(12).mockResolvedValueOnce(9);
    prisma.assistant.findMany.mockResolvedValue([{ id: "a1", name: "Nimbus" }]);
  });

  it("returns 401 when signed out and 403 for non-members", async () => {
    guard.signedIn = false;
    expect((await GET(url("workspaceId=ws-1"))).status).toBe(401);
    resetGuard();
    guard.member = false;
    expect((await GET(url("workspaceId=ws-1"))).status).toBe(403);
    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it("rejects ranges other than 7, 30 or 90 days", async () => {
    const res = await GET(url("workspaceId=ws-1&days=45"));
    expect(res.status).toBe(400);
  });

  it("keeps the original fields and adds comparison, top documents and gaps", async () => {
    const res = await GET(url("workspaceId=ws-1&days=7"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.days).toBe(7);
    expect(body.messages).toHaveLength(3);
    // Citations stay server-side; the volume list only has what the charts need.
    expect(body.messages[0]).not.toHaveProperty("citations");
    expect(body.conversations).toHaveLength(2);
    expect(body.assistants).toEqual([{ id: "a1", name: "Nimbus" }]);
    expect(body.previous).toEqual({ conversations: 12, messages: 40, resolved: 9 });
    expect(body.answers).toEqual({ total: 2, cited: 1 });
    expect(body.topDocuments).toEqual([{ id: "d1", name: "Refunds", citations: 1, answers: 1 }]);
    expect(body.gaps).toEqual([
      { conversationId: "c2", assistantId: "a1", question: "Do you sell gift cards?", at: "2026-11-23T11:00:00.000Z" },
    ]);
    // Every query is scoped to the workspace.
    for (const call of [...prisma.message.findMany.mock.calls, ...prisma.conversation.findMany.mock.calls]) {
      expect(call[0].where.workspaceId).toBe("ws-1");
    }
  });

  it("defaults to 30 days", async () => {
    const body = await (await GET(url("workspaceId=ws-1"))).json();
    expect(body.days).toBe(30);
  });
});
