import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { demoAssistantSeed } from "@/lib/demo/content";
import { WidgetLoader } from "./WidgetLoader";

export const metadata: Metadata = {
  title: "Widget preview — SupportAI",
  robots: { index: false, follow: false },
};

/**
 * A mock customer website with the real embeddable widget on it. Public, like
 * the widget itself; demo assistants get tailored copy and suggested questions.
 */
export default async function WidgetPreviewPage({
  params,
}: {
  params: Promise<{ assistantId: string }>;
}) {
  const { assistantId } = await params;
  const assistant = await prisma.assistant.findUnique({
    where: { id: assistantId },
    select: { id: true, name: true, description: true, brandColor: true },
  });
  if (!assistant) notFound();

  const seed = demoAssistantSeed(assistant.id);
  const brand = seed?.preview.brand ?? "Your website";
  const headline = seed?.preview.headline ?? "This is how your site looks with SupportAI.";
  const blurb =
    seed?.preview.blurb ??
    assistant.description ??
    "The chat bubble in the corner is the real widget, answering from this assistant's knowledge base.";
  const color = assistant.brandColor;

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <div className="bg-ink text-paper text-xs">
        <div className="max-w-5xl mx-auto px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono-caps text-paper/70">
            SupportAI widget preview · sample website
          </span>
          <Link href="/" className="text-paper/70 hover:text-paper">
            ← Back to SupportAI
          </Link>
        </div>
      </div>

      <header className="border-b border-[#ececec]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-2.5 font-semibold">
          <span
            className="size-7 rounded-md flex items-center justify-center text-white text-sm"
            style={{ background: color }}
          >
            {brand[0]}
          </span>
          {brand}
          <nav className="ml-auto hidden sm:flex gap-6 text-sm font-normal text-[#6b6b70]">
            <span>Product</span>
            <span>Pricing</span>
            <span>Help</span>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight max-w-2xl">
          {headline}
        </h1>
        <p className="mt-5 text-lg text-[#6b6b70] max-w-xl leading-relaxed">{blurb}</p>
        <span
          className="mt-8 inline-block px-5 py-3 rounded-lg text-white font-medium"
          style={{ background: color }}
        >
          Get started
        </span>

        <section className="mt-16 max-w-xl rounded-xl border border-[#ececec] bg-[#fafaf7] p-6">
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color }}>
            Try the assistant
          </div>
          <p className="mt-2 text-[#3a3a3f]">
            Click the chat bubble in the bottom-right corner to talk to{" "}
            <strong>{assistant.name}</strong>. Answers come from its knowledge base, live.
          </p>
          {seed && (
            <ul className="mt-4 space-y-1.5 text-sm text-[#6b6b70]">
              {seed.preview.suggestions.map((s) => (
                <li key={s}>&ldquo;{s}&rdquo;</li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <WidgetLoader assistantId={assistant.id} title={assistant.name} color={color} />
    </div>
  );
}
