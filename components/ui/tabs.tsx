"use client";

import * as T from "@radix-ui/react-tabs";
import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export const TabsContent = T.Content;

/**
 * Tab list with one sliding indicator under the active tab. Radix supplies the
 * correct tablist/tab/tabpanel roles and arrow-key navigation.
 */
export function TabsList({ className, children, ...props }: ComponentProps<typeof T.List>) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (active) setBar({ x: active.offsetLeft, w: active.offsetWidth });
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(list, { subtree: true, attributes: true, attributeFilter: ["data-state"] });
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <T.List ref={ref} className={cn("relative flex gap-1 border-b border-border", className)} {...props}>
      {children}
      {bar && (
        <span
          aria-hidden
          className="absolute -bottom-px left-0 h-0.5 rounded-full bg-accent-text transition-[transform,width] duration-300 ease-[var(--ease-out-expo)]"
          style={{ width: bar.w, transform: `translateX(${bar.x}px)` }}
        />
      )}
    </T.List>
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "relative -mb-px inline-flex h-9 items-center gap-2 px-3 text-[13.5px] font-medium text-fg-muted outline-none transition-colors",
        "hover:text-fg data-[state=active]:text-fg focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-focus",
        className,
      )}
      {...props}
    />
  );
}
