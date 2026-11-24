import { beforeEach, describe, expect, it, vi } from "vitest";
import { guard, idContext, resetGuard } from "./helpers";
import { buildActivity, ACTIVITY_LIMIT } from "@/lib/activity";

const prisma = vi.hoisted(() => ({
  document: { findMany: vi.fn() },
  conversation: { findMany: vi.fn() },
  workspaceMember: { findMany: vi.fn() },
  workspaceInvite: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/session", async () => (await import("./helpers")).sessionMock);
vi.mock("@/lib/workspace", async () => (await import("./helpers")).workspaceMock);
vi.mock("@/lib/generated/prisma/client", async () => (await import("./helpers")).prismaClientMock);

const { GET } = await import("@/app/api/workspaces/[id]/activity/route");
const req = new Request("http://test/api/workspaces/ws-1/activity");

const at = (iso: string) => new Date(iso);

describe("buildActivity", () => {
  it("merges sources newest first and hides the viewer's own join", () => {
    const feed = buildActivity(
      {
        documents: [
          { id: "d1", name: "Refunds.md", status: "READY", error: null, chunkCount: 4, updatedAt: at("2026-11-20T10:00:00Z") },
          { id: "d2", name: "Broken.pdf", status: "ERROR", error: "No text found", chunkCount: 0, updatedAt: at("2026-11-22T10:00:00Z") },
        ],
        widgetConversations: [
          { id: "c1", createdAt: at("2026-11-23T09:00:00Z"), assistant: { name: "Nimbus Help Bot" }, messages: [{ content: "Can I export my boards to CSV?\nThanks" }] },
        ],
        members: [
          { id: "m1", userId: "user-1", role: "OWNER", createdAt: at("2026-11-23T12:00:00Z"), user: { displayName: "Me", email: "me@x.example" } },
          { id: "m2", userId: "user-2", role: "ADMIN", createdAt: at("2026-11-21T08:00:00Z"), user: { displayName: null, email: "sam@x.example" } },
        ],
        invites: [{ id: "i1", email: "new@x.example", role: "MEMBER", createdAt: at("2026-11-19T08:00:00Z") }],
      },
      "user-1",
    );

    expect(feed.map((e) => e.type)).toEqual([
      "conversation.widget",
      "document.error",
      "member.joined",
      "document.ready",
      "invite.created",
    ]);
    expect(feed[0]).toMatchObject({
      title: "Can I export my boards to CSV?",
      detail: "Website chat · Nimbus Help Bot",
      href: "/conversations?c=c1",
    });
    expect(feed[1]).toMatchObject({ title: "Broken.pdf failed to index", detail: "No text found" });
    expect(feed[2]).toMatchObject({ title: "sam@x.example joined", detail: "Added as admin" });
    expect(feed[3].detail).toBe("Indexed into 4 chunks");
  });

  it("caps the feed", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      id: `c${i}`,
      createdAt: new Date(Date.UTC(2026, 10, 1, 0, i)),
      assistant: null,
    }));
    const feed = buildActivity({ documents: [], widgetConversations: many, members: [], invites: [] }, "u");
    expect(feed).toHaveLength(ACTIVITY_LIMIT);
    expect(feed[0].id).toBe("conv-c49");
  });

  it("is empty for an empty workspace", () => {
    expect(buildActivity({ documents: [], widgetConversations: [], members: [], invites: [] }, "u")).toEqual([]);
  });
});

describe("GET /api/workspaces/[id]/activity", () => {
  beforeEach(() => {
    resetGuard();
    prisma.document.findMany.mockResolvedValue([]);
    prisma.conversation.findMany.mockResolvedValue([
      { id: "c1", createdAt: at("2026-11-23T09:00:00Z"), assistant: { name: "Bloom & Co Support" } },
    ]);
    prisma.workspaceMember.findMany.mockResolvedValue([]);
    prisma.workspaceInvite.findMany.mockResolvedValue([]);
  });

  it("returns 401 when signed out", async () => {
    guard.signedIn = false;
    expect((await GET(req, idContext("ws-1"))).status).toBe(401);
  });

  it("returns 403 for a non-member and reads nothing", async () => {
    guard.member = false;
    expect((await GET(req, idContext("ws-1"))).status).toBe(403);
    expect(prisma.conversation.findMany).not.toHaveBeenCalled();
  });

  it("queries only this workspace and only widget conversations", async () => {
    const res = await GET(req, idContext("ws-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].type).toBe("conversation.widget");
    const where = prisma.conversation.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ workspaceId: "ws-1", channel: "WIDGET" });
    expect(prisma.workspaceInvite.findMany.mock.calls[0][0].where).toMatchObject({ workspaceId: "ws-1", acceptedAt: null });
  });
});
