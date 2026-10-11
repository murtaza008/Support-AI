"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { X } from "lucide-react";

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

/** Modal showing a knowledge document's indexed chunks. Used from the Knowledge list and from citation pills. */
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-paper rounded-xl shadow-2xl border border-line p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-mono-caps text-signal">Source document</div>
            <h2 className="mt-1 font-display text-2xl font-semibold truncate">
              {doc?.name ?? fallbackName ?? "Document"}
            </h2>
            {doc && (
              <div className="font-mono text-[11px] text-muted-foreground uppercase mt-1">
                {doc.chunkCount} chunks · {(doc.charCount / 1000).toFixed(1)}k chars ·{" "}
                {new Date(doc.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 flex-1 min-h-0 overflow-y-auto space-y-3">
          {isLoading && (
            <div className="p-6 font-mono-caps text-muted-foreground animate-pulse">Loading…</div>
          )}
          {isError && (
            <p className="p-6 text-sm text-muted-foreground text-center">
              This document is no longer in the knowledge base.
            </p>
          )}
          {doc?.chunks.map((c) => (
            <div key={c.id} className="bg-paper-raised hairline rounded-lg p-4">
              <div className="font-mono text-[10px] text-muted-foreground uppercase">
                Chunk {c.chunkIndex + 1} · ~{c.tokenCount} tokens
              </div>
              <div className="mt-2 text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {c.content}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
