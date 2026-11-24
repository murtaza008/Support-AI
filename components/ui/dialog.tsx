"use client";

import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const overlay =
  "fixed inset-0 z-50 bg-[rgba(10,12,13,0.42)] data-[state=open]:animate-[fade-in_160ms_ease-out] dark:bg-[rgba(0,0,0,0.6)]";

/** Centered dialog. Title is required (screen readers announce it). */
export function DialogContent({
  title,
  description,
  children,
  className,
  hideClose,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn(
          "panel-raised fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 p-0 outline-none",
          "data-[state=open]:animate-[pop-in_220ms_var(--ease-out-expo)]",
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <D.Title className="text-base font-semibold text-fg">{title}</D.Title>
            {description && <D.Description className="mt-0.5 text-[13px] text-fg-muted">{description}</D.Description>}
          </div>
          {!hideClose && (
            <D.Close
              aria-label="Close"
              className="-mr-1.5 -mt-0.5 flex size-8 items-center justify-center rounded-md text-fg-subtle hover:bg-sunken hover:text-fg"
            >
              <X className="size-4" />
            </D.Close>
          )}
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}

/** Side sheet (mobile navigation, document reader). */
export function SheetContent({
  title,
  description,
  side = "left",
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(92vw,22rem)] flex-col border-border bg-surface shadow-lg outline-none",
          side === "left"
            ? "left-0 border-r data-[state=open]:animate-[sheet-left_280ms_var(--ease-out-expo)]"
            : "right-0 border-l data-[state=open]:animate-[sheet-right_280ms_var(--ease-out-expo)]",
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <D.Title className="sr-only">{title}</D.Title>
        {description && <D.Description className="sr-only">{description}</D.Description>}
        <D.Close
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-md text-fg-subtle hover:bg-sunken hover:text-fg"
        >
          <X className="size-4" />
        </D.Close>
        {children}
      </D.Content>
    </D.Portal>
  );
}
