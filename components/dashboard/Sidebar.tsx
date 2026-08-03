"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  MessagesSquare,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/assistants", label: "Assistants", icon: Bot },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ workspaceName }: { workspaceName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 border-r border-line bg-paper-raised flex flex-col">
      <div className="p-5 border-b border-line">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-ink flex items-center justify-center text-paper text-sm">
              ✦
            </div>
            <span className="font-display text-lg font-semibold text-ink">
              SupportAI
            </span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="mt-4 px-2 py-1.5 rounded-md hairline bg-paper">
          <div className="font-mono-caps text-muted-foreground">Workspace</div>
          <div className="text-sm font-medium text-ink truncate mt-0.5">
            {workspaceName}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                active
                  ? "bg-ink text-paper"
                  : "text-ink/70 hover:text-ink hover:bg-paper"
              }`}
            >
              <Icon
                className={`size-4 ${active ? "text-signal" : "text-ink/50 group-hover:text-ink/80"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-line">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-ink/70 hover:text-ink hover:bg-paper transition-colors"
        >
          <LogOut className="size-4 text-ink/50" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
