/**
 * Workspace activity feed: real events derived from rows that already exist
 * (documents finishing ingestion, widget conversations, teammates joining,
 * invites). Nothing here is synthetic; an empty workspace has an empty feed.
 */

export type ActivityType =
  | "document.ready"
  | "document.error"
  | "conversation.widget"
  | "member.joined"
  | "invite.created";

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  at: string;
  title: string;
  detail: string | null;
  href: string;
};

export type ActivitySource = {
  documents: {
    id: string;
    name: string;
    status: "PENDING" | "PROCESSING" | "READY" | "ERROR";
    error: string | null;
    chunkCount: number;
    updatedAt: Date;
  }[];
  widgetConversations: {
    id: string;
    createdAt: Date;
    assistant: { name: string } | null;
    /** First customer message, if any (at most one row). */
    messages?: { content: string }[];
  }[];
  members: {
    id: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    createdAt: Date;
    user: { displayName: string | null; email: string };
  }[];
  invites: { id: string; email: string; role: "OWNER" | "ADMIN" | "MEMBER"; createdAt: Date }[];
};

export const ACTIVITY_WINDOW_DAYS = 14;
export const ACTIVITY_LIMIT = 20;

const roleLabel = { OWNER: "owner", ADMIN: "admin", MEMBER: "member" } as const;

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function firstLine(text: string | undefined): string | null {
  if (!text) return null;
  const line = text.trim().split("\n")[0];
  return line.length > 80 ? `${line.slice(0, 79).trimEnd()}…` : line;
}

/** Merge the source rows into one newest-first feed. `viewerId` hides your own join. */
export function buildActivity(src: ActivitySource, viewerId: string): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const d of src.documents) {
    if (d.status === "READY") {
      events.push({
        id: `doc-ready-${d.id}`,
        type: "document.ready",
        at: d.updatedAt.toISOString(),
        title: `${d.name} is ready`,
        detail: `Indexed into ${plural(d.chunkCount, "chunk")}`,
        href: "/knowledge",
      });
    } else if (d.status === "ERROR") {
      events.push({
        id: `doc-error-${d.id}`,
        type: "document.error",
        at: d.updatedAt.toISOString(),
        title: `${d.name} failed to index`,
        detail: d.error,
        href: "/knowledge",
      });
    }
  }

  for (const c of src.widgetConversations) {
    events.push({
      id: `conv-${c.id}`,
      type: "conversation.widget",
      at: c.createdAt.toISOString(),
      title: firstLine(c.messages?.[0]?.content) ?? "New conversation from your website",
      detail: `Website chat${c.assistant ? ` · ${c.assistant.name}` : ""}`,
      href: `/conversations?c=${c.id}`,
    });
  }

  for (const m of src.members) {
    if (m.userId === viewerId) continue;
    events.push({
      id: `member-${m.id}`,
      type: "member.joined",
      at: m.createdAt.toISOString(),
      title: `${m.user.displayName ?? m.user.email} joined`,
      detail: `Added as ${roleLabel[m.role]}`,
      href: "/team",
    });
  }

  for (const i of src.invites) {
    events.push({
      id: `invite-${i.id}`,
      type: "invite.created",
      at: i.createdAt.toISOString(),
      title: `Invite sent to ${i.email}`,
      detail: `Joins as ${roleLabel[i.role]}`,
      href: "/team",
    });
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, ACTIVITY_LIMIT);
}
