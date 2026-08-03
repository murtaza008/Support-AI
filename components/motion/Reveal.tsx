"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Scroll-triggered reveal. Unlike a typical "animate once" pattern, this
 * replays every time the element re-enters the viewport (scroll away and
 * back) — kept fast (~0.4s, expo-out) so repeated triggers feel snappy
 * rather than sluggish.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
