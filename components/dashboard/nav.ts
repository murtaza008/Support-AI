import {
  BarChart3,
  Bot,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceSummary } from "@/lib/workspace-summary";
import type { QueryName } from "@/lib/queries";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** What the page is for, shown in the hover card and the command palette. */
  description: string;
  /** Live numbers for the hover card, built from the workspace summary. */
  stats?: (s: WorkspaceSummary) => { label: string; value: string }[];
  /** Data the page reads first; prefetched when the nav item is hovered. */
  prefetch?: QueryName[];
  keywords?: string;
};

export type NavGroup = { label: string; items: NavItem[] };

const n = (v: number) => v.toLocaleString("en-US");

export const navGroups: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        description: "Today at a glance: volume, open conversations and what needs attention.",
        stats: (s) => [
          { label: "Conversations today", value: n(s.conversations.today) },
          { label: "Open (30 days)", value: n(s.conversations.open30d) },
        ],
        prefetch: ["analytics", "assistants"],
        keywords: "home dashboard",
      },
      {
        href: "/conversations",
        label: "Conversations",
        icon: MessagesSquare,
        description: "Every chat from the playground and your website, with the sources each answer used.",
        stats: (s) => [
          { label: "Last 30 days", value: n(s.conversations.last30d) },
          { label: "From your website", value: n(s.conversations.widget30d) },
          { label: "Not resolved", value: n(s.conversations.open30d) },
        ],
        prefetch: ["conversations"],
        keywords: "chats transcripts inbox",
      },
      {
        href: "/analytics",
        label: "Analytics",
        icon: BarChart3,
        description: "Trends over 30 days: messages, resolution rate, channels and assistants.",
        stats: (s) => {
          const { last30d, prev30d } = s.conversations;
          const diff = prev30d > 0 ? Math.round(((last30d - prev30d) / prev30d) * 100) : null;
          return [
            { label: "Conversations, 30 days", value: n(last30d) },
            { label: "vs previous 30 days", value: diff === null ? "No prior data" : `${diff > 0 ? "+" : ""}${diff}%` },
          ];
        },
        prefetch: ["analytics"],
        keywords: "reports charts metrics",
      },
    ],
  },
  {
    label: "Build",
    items: [
      {
        href: "/assistants",
        label: "Assistants",
        icon: Bot,
        description: "Create assistants, set their tone and instructions, test them and get the embed code.",
        stats: (s) => [{ label: "Assistants", value: n(s.assistants) }],
        prefetch: ["assistants"],
        keywords: "bots agents playground embed widget",
      },
      {
        href: "/knowledge",
        label: "Knowledge",
        icon: BookOpen,
        description: "The help docs your assistants answer from. Upload files, paste text or import a URL.",
        stats: (s) => [
          { label: "Documents ready", value: `${n(s.documents.ready)} of ${n(s.documents.total)}` },
          { label: "Indexed chunks", value: n(s.documents.chunks) },
          ...(s.documents.error > 0 ? [{ label: "Failed", value: n(s.documents.error) }] : []),
        ],
        prefetch: ["documents"],
        keywords: "documents docs files upload knowledge base",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        href: "/team",
        label: "Team",
        icon: Users,
        description: "Invite teammates, change roles and remove access.",
        stats: (s) => [
          { label: "Members", value: n(s.members) },
          { label: "Pending invites", value: n(s.pendingInvites) },
        ],
        prefetch: ["members", "invites"],
        keywords: "members invite people roles",
      },
      {
        href: "/billing",
        label: "Billing",
        icon: CreditCard,
        description: "Your plan, what it includes and payment details.",
        keywords: "plan upgrade subscription stripe",
      },
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        description: "Workspace name and the brand colour used by your widget.",
        keywords: "preferences workspace brand colour",
      },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
