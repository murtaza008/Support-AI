"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";

export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useCurrentWorkspace();

  useEffect(() => {
    if (!isLoading && data === null) {
      router.push("/onboarding");
    }
  }, [isLoading, data, router]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="font-mono-caps text-muted-foreground animate-pulse">
          Loading workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      <Sidebar workspaceName={data.name} />
      <main className="flex-1 min-w-0">
        {data.isDemo && <DemoBanner />}
        {children}
      </main>
    </div>
  );
}
