import Link from "next/link";
import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-border bg-accent-soft text-fg">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-[13px]">
        <span className="inline-flex items-center gap-1.5">
          <Info aria-hidden className="size-3.5 text-accent-text" />
          You&rsquo;re in the shared demo workspace. Changes are limited and data resets daily.
        </span>
        <Link href="/signup" className="font-medium text-accent-text underline-offset-4 hover:underline">
          Create your own workspace
        </Link>
      </div>
    </div>
  );
}
