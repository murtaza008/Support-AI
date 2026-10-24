import Link from "next/link";
import { Sparkles } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-signal/30 bg-signal/10 text-ink">
      <div className="px-6 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-signal" />
          You&rsquo;re viewing a demo account. Data resets daily.
        </span>
        <Link href="/signup" className="font-medium text-signal hover:underline">
          Create your own workspace →
        </Link>
      </div>
    </div>
  );
}
