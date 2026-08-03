"use client";

import { useEffect, useState } from "react";

/**
 * Sequential type → pause → erase → pause → type-next loop. The next word
 * never starts appearing until the current one has fully erased.
 */
export function Typewriter({
  words,
  typingSpeed = 55,
  deletingSpeed = 28,
  pauseAfterType = 1400,
  pauseAfterDelete = 300,
  className,
}: {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseAfterType?: number;
  pauseAfterDelete?: number;
  className?: string;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");

  useEffect(() => {
    const current = words[wordIndex % words.length];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (text.length < current.length) {
        timer = setTimeout(
          () => setText(current.slice(0, text.length + 1)),
          typingSpeed,
        );
      } else {
        timer = setTimeout(() => setPhase("deleting"), pauseAfterType);
      }
    } else {
      if (text.length > 0) {
        timer = setTimeout(
          () => setText(current.slice(0, text.length - 1)),
          deletingSpeed,
        );
      } else {
        timer = setTimeout(() => {
          setWordIndex((i) => (i + 1) % words.length);
          setPhase("typing");
        }, pauseAfterDelete);
      }
    }
    return () => clearTimeout(timer);
  }, [
    text,
    phase,
    wordIndex,
    words,
    typingSpeed,
    deletingSpeed,
    pauseAfterType,
    pauseAfterDelete,
  ]);

  // Reserve width for the longest word so surrounding text never shifts
  // while this erases down to nothing or types back up.
  const maxChars = Math.max(...words.map((w) => w.length));

  return (
    <span
      className={`inline-block text-left ${className ?? ""}`}
      style={{ minWidth: `${maxChars}ch` }}
    >
      {text}
      <span className="inline-block w-[2px] h-[0.9em] align-text-bottom bg-current ml-0.5 animate-pulse" />
    </span>
  );
}
