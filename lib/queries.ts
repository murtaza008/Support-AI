"use client";

import { queryOptions, type QueryClient } from "@tanstack/react-query";
import type { ActivityEvent } from "@/lib/activity";
import type { WorkspaceSummary } from "@/lib/workspace-summary";

/**
 * Shared query definitions. Pages and the shell use the same keys, so hovering
 * a nav item can prefetch exactly what the page will read.
 */

export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type AssistantRow = {
  id: string;
  name: string;
  tone: string;
  description: string | null;
  systemPrompt?: string | null;
  brandColor: string;
  workspaceId: string;
  createdAt: string;
  updatedAt?: string;
};

export type DocumentRow = {
  id: string;
  name: string;
  sourceType: "FILE" | "URL" | "TEXT";
  sourceUrl: string | null;
  status: "PENDING" | "PROCESSING" | "READY" | "ERROR";
  error: string | null;
  sizeBytes?: number;
  charCount: number;
  chunkCount: number;
  createdAt: string;
  updatedAt?: string;
  assistant: { name: string } | null;
};

export type ConversationRow = {
  id: string;
  assistantId: string;
  channel: "PLAYGROUND" | "WIDGET" | "API";
  visitorId: string | null;
  resolved: boolean;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  assistant: { name: string } | null;
};

export type AnalyticsData = {
  messages: { id: string; role: string; createdAt: string; conversationId: string }[];
  conversations: {
    id: string;
    assistantId: string;
    channel: string;
    createdAt: string;
    resolved: boolean;
    rating: number | null;
  }[];
  assistants: { id: string; name: string }[];
};

export type MemberRow = {
  id: string;
  userId: string;
  role: Role;
  createdAt: string;
  user: { displayName: string | null; email: string; avatarUrl: string | null };
};

export type InviteRow = {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  createdAt?: string;
};

async function getJson<T>(url: string, what: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${what}`);
  return res.json() as Promise<T>;
}

export const q = {
  assistants: (wsId: string) =>
    queryOptions({
      queryKey: ["assistants", wsId],
      queryFn: () => getJson<AssistantRow[]>(`/api/assistants?workspaceId=${wsId}`, "assistants"),
    }),
  documents: (wsId: string) =>
    queryOptions({
      queryKey: ["documents", wsId],
      queryFn: () => getJson<DocumentRow[]>(`/api/documents?workspaceId=${wsId}`, "documents"),
    }),
  conversations: (wsId: string) =>
    queryOptions({
      queryKey: ["conversations", wsId],
      queryFn: () => getJson<ConversationRow[]>(`/api/conversations?workspaceId=${wsId}`, "conversations"),
    }),
  analytics: (wsId: string) =>
    queryOptions({
      queryKey: ["analytics", wsId],
      queryFn: () => getJson<AnalyticsData>(`/api/analytics?workspaceId=${wsId}`, "analytics"),
    }),
  members: (wsId: string) =>
    queryOptions({
      queryKey: ["members", wsId],
      queryFn: () => getJson<MemberRow[]>(`/api/workspaces/${wsId}/members`, "members"),
    }),
  invites: (wsId: string) =>
    queryOptions({
      queryKey: ["invites", wsId],
      queryFn: () => getJson<InviteRow[]>(`/api/workspaces/${wsId}/invites`, "invites"),
    }),
  summary: (wsId: string) =>
    queryOptions({
      queryKey: ["summary", wsId],
      queryFn: () => getJson<WorkspaceSummary>(`/api/workspaces/${wsId}/summary`, "summary"),
      staleTime: 30_000,
    }),
  activity: (wsId: string) =>
    queryOptions({
      queryKey: ["activity", wsId],
      queryFn: () => getJson<ActivityEvent[]>(`/api/workspaces/${wsId}/activity`, "activity"),
      staleTime: 60_000,
      refetchInterval: 120_000,
    }),
};

export type QueryName = keyof typeof q;

/** One typed prefetcher per query, so callers can prefetch by name. */
export const prefetchers: Record<QueryName, (qc: QueryClient, wsId: string) => Promise<void>> = {
  assistants: (qc, id) => qc.prefetchQuery(q.assistants(id)),
  documents: (qc, id) => qc.prefetchQuery(q.documents(id)),
  conversations: (qc, id) => qc.prefetchQuery(q.conversations(id)),
  analytics: (qc, id) => qc.prefetchQuery(q.analytics(id)),
  members: (qc, id) => qc.prefetchQuery(q.members(id)),
  invites: (qc, id) => qc.prefetchQuery(q.invites(id)),
  summary: (qc, id) => qc.prefetchQuery(q.summary(id)),
  activity: (qc, id) => qc.prefetchQuery(q.activity(id)),
};
