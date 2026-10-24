"use client";

import { useEffect } from "react";

/** Loads the real embed script exactly as a customer's site would, and removes it on unmount. */
export function WidgetLoader({
  assistantId,
  title,
  color,
}: {
  assistantId: string;
  title: string;
  color: string;
}) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/api/public/widget/embed.js";
    script.async = true;
    script.setAttribute("data-assistant", assistantId);
    script.setAttribute("data-title", title);
    script.setAttribute("data-color", color);
    document.body.appendChild(script);
    return () => {
      script.remove();
      document.querySelectorAll(".sai-root").forEach((node) => node.remove());
    };
  }, [assistantId, title, color]);

  return null;
}
