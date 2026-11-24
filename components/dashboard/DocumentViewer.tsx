"use client";

import { useQuery } from "@tanstack/react-query";
import * as D from "@radix-ui/react-dialog";
import { FileText, Globe, Type } from "lucide-react";
import { SheetContent } from "@/components/ui/dialog";
import { Skeleton, staggerStyle } from "@/components/ui/primitives";

type DocumentDetail = {
  id: string;
  name: string;
  sourceType: "FILE" | "URL" | "TEXT";
  sourceUrl: string | null;
  status: string;
  charCount: number;
  chunkCount: number;
  createdAt: string;
  chunks: { id: string; chunkIndex: number; content: string; tokenCount: number }[];
};

const sourceIcon = { FILE: FileText, URL: Globe, TEXT: Type } as const;
const sourceLabel = { FILE: "Uploaded file", URL: "Imported from a URL", TEXT: "Pasted text" } as const;

/**
 * Side sheet showing a document's indexed passages. Used from the Knowledge
 * list, from citation chips in Conversations, and from the playground.
 */
export function DocumentViewer({
  documentId,
  fallbackName,
  onClose,
}: {
  documentId: string;
  fallbackName?: string;
  onClose: () => void;
}) {
  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async (): Promise<DocumentDetail> => {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error("Failed to load document");
      return res.json();
    },
    retry: false,
  });

  const Icon = doc ? sourceIcon[doc.sourceType] : FileText;

  return (
    <D.Root open onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={doc?.name ?? fallbackName ?? "Document"} side="right" className="w-[min(96vw,40rem)]">
        <div className="border-b border-border px-5 pb-4 pr-14 pt-5">
          <p className="eyebrow">Source document</p>
          <h2 className="mt-1 text-[19px] font-semibold leading-snug text-fg">{doc?.name ?? fallbackName ?? "Document"}</h2>
          {doc && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-fg-muted">
              <span className="inline-flex items-center gap-1">
                <Icon aria-hidden className="size-3.5" /> {sourceLabel[doc.sourceType]}
              </span>
              <span aria-hidden>·</span>
              <span className="tabular">{doc.chunkCount} passages</span>
              <span aria-hidden>·</span>
              <span className="tabular">{doc.charCount.toLocaleString("en-US")} characters</span>
              <span aria-hidden>·</span>
              <span>Added {new Date(doc.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
            </p>
          )}
          {doc?.sourceUrl && (
            <a
              href={doc.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block max-w-full truncate text-[12.5px] text-accent-text underline-offset-4 hover:underline"
            >
              {doc.sourceUrl}
            </a>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin" tabIndex={0} aria-label="Passages">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          )}
          {isError && (
            <p className="py-10 text-center text-sm text-fg-muted">
              This document is no longer in the knowledge base. It may have been deleted after the answer was given.
            </p>
          )}
          {doc && (
            <ol className="stagger space-y-3">
              {doc.chunks.map((c, i) => (
                <li key={c.id} style={staggerStyle(i)} className="rounded-lg border border-border bg-surface-2 p-4">
                  <p className="text-[12px] text-fg-muted">
                    Passage {c.chunkIndex + 1} · about {c.tokenCount} tokens
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-fg">{c.content}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </D.Root>
  );
}
