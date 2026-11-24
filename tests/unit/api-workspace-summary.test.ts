import { beforeEach, describe, expect, it, vi } from "vitest";
import { guard, idContext, resetGuard } from "./helpers";

const prisma = vi.hoisted(() => ({
  assistant: { count: vi.fn() },
  document: { groupBy: vi.fn(), aggregate: vi.fn() },
  conversation: { count: vi.fn() },
  workspaceMember: { count: vi.fn() },
  workspaceInvite: { count: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/session", async () => (await import("./helpers")).sessionMock);
vi.mock("@/lib/workspace", async () => (await import("./helpers")).workspaceMock);
vi.mock("@/lib/generated/prisma/client", async () => (await import("./helpers")).prismaClientMock);

const { GET } = await import("@/app/api/workspaces/[id]/summary/route");
const req = new Request("http://test/api/workspaces/ws-1/summary");

describe("GET /api/workspaces/[id]/summary", () => {
  beforeEach(() => {
    resetGuard();
    prisma.assistant.count.mockResolvedValue(2);
    prisma.document.groupBy.mockResolvedValue([
      { status: "READY", _count: { _all: 10 } },
      { status: "PROCESSING", _count: { _all: 1 } },
      { status: "PENDING", _count: { _all: 1 } },
      { status: "ERROR", _count: { _all: 2 } },
    ]);
    prisma.document.aggregate.mockResolvedValue({ _sum: { chunkCount: 120 } });
    // last30d, prev30d, today, widget30d, open30d — in call order.
    prisma.conversation.count
      .mockResolvedValueOnce(30)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(9);
    prisma.workspaceMember.count.mockResolvedValue(3);
    prisma.workspaceInvite.count.mockResolvedValue(1);
  });

  it("returns 401 when signed out", async () => {
    guard.signedIn = false;
    const res = await GET(req, idContext("ws-1"));
    expect(res.status).toBe(401);
    expect(prisma.assistant.count).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-member and reads nothing", async () => {
    guard.member = false;
    const res = await GET(req, idContext("ws-1"));
    expect(res.status).toBe(403);
    expect(prisma.conversation.count).not.toHaveBeenCalled();
  });

  it("returns counts scoped to the workspace", async () => {
    const res = await GET(req, idContext("ws-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      assistants: 2,
      documents: { total: 14, ready: 10, processing: 2, error: 2, chunks: 120 },
      conversations: { last30d: 30, prev30d: 20, today: 3, widget30d: 12, open30d: 9 },
      members: 3,
      pendingInvites: 1,
    });
    for (const call of prisma.conversation.count.mock.calls) {
      expect(call[0].where.workspaceId).toBe("ws-1");
    }
    expect(prisma.assistant.count.mock.calls[0][0].where.workspaceId).toBe("ws-1");
  });

  it("treats an empty workspace as zeros", async () => {
    prisma.document.groupBy.mockResolvedValue([]);
    prisma.document.aggregate.mockResolvedValue({ _sum: { chunkCount: null } });
    const body = await (await GET(req, idContext("ws-1"))).json();
    expect(body.documents).toEqual({ total: 0, ready: 0, processing: 0, error: 0, chunks: 0 });
  });
});
