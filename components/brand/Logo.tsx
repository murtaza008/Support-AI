import { cn } from "@/lib/utils";

/** Mark: a speech bubble holding a citation bracket — answers that show their source. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <rect width="24" height="24" rx="6" fill="var(--accent)" />
      <path
        d="M6.5 7.5h11a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H11l-3.2 2.6V16.5H6.5A1.5 1.5 0 0 1 5 15V9a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="none"
        stroke="var(--accent-fg)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 10h-1v4h1M14 10h1v4h-1" fill="none" stroke="var(--accent-fg)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-fg">SupportAI</span>
    </span>
  );
}
