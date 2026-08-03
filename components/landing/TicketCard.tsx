"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Convo = {
  question: string;
  answer: string;
  resolvedIn: string;
};

const conversations: Convo[] = [
  {
    question: "Do you offer refunds after 30 days?",
    answer:
      "Refunds are available within 30 days of purchase. After that window, we can offer account credit toward a future plan — want me to start that for you?",
    resolvedIn: "1.8s",
  },
  {
    question: "How do I export all my conversations as CSV?",
    answer:
      "Head to Conversations → click the ⋯ menu in the top right → Export as CSV. The file includes every thread, message, and source citation from the selected date range.",
    resolvedIn: "1.2s",
  },
  {
    question: "Can the assistant handle questions in Spanish?",
    answer:
      "Yes — SupportAI auto-detects 40+ languages including Spanish, and responds in the customer's language. No extra setup needed.",
    resolvedIn: "2.1s",
  },
];

type Phase = "typing-q" | "thinking" | "typing-a" | "resolved" | "fading";

function useTyped(text: string, active: boolean, speed = 22) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) {
      // Deferred so the reset happens outside the effect's synchronous
      // commit phase (avoids chaining a render directly off another render).
      const clear = setTimeout(() => setOut(""), 0);
      return () => clearTimeout(clear);
    }
    let i = 0;
    const reset = setTimeout(() => setOut(""), 0);
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => {
      clearTimeout(reset);
      clearInterval(id);
    };
  }, [text, active, speed]);
  return out;
}

export function TicketCard() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing-q");
  const convo = conversations[idx];

  const question = useTyped(convo.question, phase === "typing-q", 28);
  const answer = useTyped(convo.answer, phase === "typing-a", 14);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing-q") {
      timer = setTimeout(() => setPhase("thinking"), convo.question.length * 28 + 400);
    } else if (phase === "thinking") {
      timer = setTimeout(() => setPhase("typing-a"), 900);
    } else if (phase === "typing-a") {
      timer = setTimeout(() => setPhase("resolved"), convo.answer.length * 14 + 600);
    } else if (phase === "resolved") {
      timer = setTimeout(() => setPhase("fading"), 2400);
    } else if (phase === "fading") {
      timer = setTimeout(() => {
        setIdx((i) => (i + 1) % conversations.length);
        setPhase("typing-q");
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [phase, convo]);

  const isResolved = phase === "resolved" || phase === "fading";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[460px] mx-auto"
      style={{ transformOrigin: "center" }}
    >
      <div className="bg-paper-raised hairline rounded-lg p-6 shadow-[0_18px_50px_-25px_rgba(19,21,26,0.25)]">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="font-mono-caps text-muted-foreground">Ticket #4827</span>
          </div>
          <StatusBadge resolved={isResolved} />
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-6 rounded-full bg-ink text-paper flex items-center justify-center text-[10px] font-medium">
              MJ
            </div>
            <span className="text-sm font-medium text-ink">Maya J.</span>
            <span className="font-mono text-[11px] text-muted-foreground">now</span>
          </div>
          <p className="text-[15px] leading-relaxed text-ink min-h-[24px]">
            {question}
            {phase === "typing-q" && (
              <span className="inline-block w-[2px] h-[1em] align-text-bottom bg-ink ml-0.5 animate-pulse" />
            )}
          </p>
        </div>

        <AnimatePresence>
          {(phase === "thinking" ||
            phase === "typing-a" ||
            phase === "resolved" ||
            phase === "fading") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: phase === "fading" ? 0 : 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="size-6 rounded-full bg-signal text-white flex items-center justify-center text-[11px]">
                  ✦
                </div>
                <span className="text-sm font-medium text-ink">SupportAI</span>
              </div>
              {phase === "thinking" ? (
                <ThinkingDots />
              ) : (
                <p className="text-[15px] leading-relaxed text-muted-foreground min-h-[60px]">
                  {answer}
                  {phase === "typing-a" && (
                    <span className="inline-block w-[2px] h-[1em] align-text-bottom bg-muted-foreground ml-0.5 animate-pulse" />
                  )}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isResolved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "fading" ? 0 : 1 }}
              transition={{ duration: 0.25, delay: 0.08 }}
              className="mt-5 pt-4 border-t border-line flex items-center justify-between"
            >
              <span className="font-mono text-[11px] text-muted-foreground">
                Resolved in {convo.resolvedIn}
              </span>
              <span className="font-mono-caps text-moss">3 sources cited</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StatusBadge({ resolved }: { resolved: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        key={resolved ? "resolved" : "open"}
        initial={{ scale: 1 }}
        animate={{ scale: resolved ? [1, 1.6, 1] : 1 }}
        transition={{ duration: 0.4 }}
        className="size-2 rounded-full"
        style={{ backgroundColor: resolved ? "var(--moss)" : "var(--signal)" }}
      />
      <span
        className="font-mono-caps"
        style={{ color: resolved ? "var(--moss)" : "var(--signal)" }}
      >
        {resolved ? "Resolved" : "Open"}
      </span>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 h-[60px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
    </div>
  );
}
