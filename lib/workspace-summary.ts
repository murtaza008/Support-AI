/** Counts returned by GET /api/workspaces/[id]/summary. */
export type WorkspaceSummary = {
  assistants: number;
  documents: { total: number; ready: number; processing: number; error: number; chunks: number };
  conversations: { last30d: number; prev30d: number; today: number; widget30d: number; open30d: number };
  members: number;
  pendingInvites: number;
};
