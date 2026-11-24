"use client";

import * as T from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

/** Short label for icon-only controls. Keyboard focus shows it too. */
export function Tooltip({
  label,
  children,
  side = "bottom",
}: {
  label: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <T.Provider delayDuration={300}>
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded-md bg-inverse px-2 py-1 text-[12px] font-medium text-inverse-fg shadow-md"
        >
          {label}
        </T.Content>
      </T.Portal>
    </T.Root>
    </T.Provider>
  );
}
