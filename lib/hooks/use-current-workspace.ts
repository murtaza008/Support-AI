"use client";

import { useQuery } from "@tanstack/react-query";

export type CurrentWorkspace = {
  id: string;
  name: string;
  slug: string;
  plan: "STARTER" | "PRO" | "AGENCY";
  brandColor: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  /** The shared public demo workspace: read-mostly, reset daily. */
  isDemo: boolean;
};

async function fetchCurrentWorkspace(): Promise<CurrentWorkspace | null> {
  const res = await fetch("/api/workspaces/current");
  if (!res.ok) throw new Error("Failed to load workspace");
  return res.json();
}

export function useCurrentWorkspace() {
  return useQuery({
    queryKey: ["current-workspace"],
    queryFn: fetchCurrentWorkspace,
  });
}
