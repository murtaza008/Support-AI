import Link from "next/link";
import { Check } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { Story } from "@/components/landing/Story";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { LandingMotion, Reveal } from "@/components/landing/Reveal";
import { TiltShot } from "@/components/landing/TiltShot";
import { ChunkerDemo } from "@/components/landing/demos/ChunkerDemo";
import { CitationDemo } from "@/components/landing/demos/CitationDemo";
import { WidgetDemo } from "@/components/landing/demos/WidgetDemo";
import { TryDemoButton } from "@/components/demo/TryDemoButton";
import { buttonVariants } from "@/components/ui/button";
import { EVERY_PLAN, PLANS } from "@/lib/plans";
import dashboardLight from "@/public/screens/dashboard-light.png";
import dashboardDark from "@/public/screens/dashboard-dark.png";

const HEADLINE = "Answers from your help docs, with the source attached.";

export default function Landing() {
  return (
    <LandingMotion>
      <SmoothScroll />
      <Nav />
      <main id="main">
        <Hero />
        <Story />
        <Features />
        <Facts />
        <Pricing />
        <FAQ />
        <Closing />
      </main>
      <Footer />
    </LandingMotion>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 md:pt-24">
        <div className="max-w-3xl">
          <p className="eyebrow rise">Support assistant for your help centre</p>
          <h1 className="word-reveal mt-4 text-[40px] font-semibold leading-[1.04] tracking-[-0.03em] text-fg sm:text-[54px] md:text-[64px]">
            {HEADLINE.split(" ").map((w, i) => (
              <span key={i} style={{ "--w": i } as React.CSSProperties}>
                {w}
                {i < HEADLINE.split(" ").length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p className="rise mt-6 max-w-2xl text-[17px] leading-relaxed text-fg-muted [animation-delay:380ms]">
            Upload your help docs. SupportAI answers customer questions from them, numbers the passages it used, and
            tells the customer when the docs don&rsquo;t cover something. Put it on your site with one script tag.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:460ms]">
            <Link href="/signup" data-press="" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Start free
            </Link>
            <TryDemoButton label="Open the live demo" size="lg" />
          </div>
          <p className="rise mt-4 text-[13px] text-fg-muted [animation-delay:520ms]">
            The demo is a shared workspace with two sample companies. No sign-up; it resets every day.
          </p>
        </div>

        <Reveal className="mt-14 md:mt-16" delay={0.1}>
          <TiltShot
            light={dashboardLight}
            dark={dashboardDark}
            alt="The SupportAI dashboard for the demo workspace: navigation, workspace overview and assistants"
          />
        </Reveal>
      </div>
    </section>
  );
}

const demos = [
  {
    title: "Your docs, cut into passages",
    body: "This is the chunker the app runs on every upload. Edit the text and watch the passages change.",
    demo: <ChunkerDemo />,
  },
  {
    title: "Every answer shows its sources",
    body: "Point at a number to see the exact passage it came from. Your team sees the same list in Conversations.",
    demo: <CitationDemo />,
  },
  {
    title: "One script tag on your site",
    body: "Pick a brand colour; the bubble and the snippet update. Website chats land in your Conversations list.",
    demo: <WidgetDemo />,
  },
];

function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="border-t border-border bg-surface-2 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Features</p>
          <h2 id="features-title" className="mt-2 text-[30px] font-semibold leading-tight text-fg md:text-[38px]">
            Try the parts that matter, right here.
          </h2>
          <p className="mt-3 text-[16px] text-fg-muted">These run the same logic as the app. Nothing below is a recording.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {demos.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.06} className="panel flex flex-col p-5">
              <h3 className="text-[16px] font-semibold text-fg">{d.title}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-fg-muted">{d.body}</p>
              <div className="mt-4 h-[430px] border-t border-border pt-4">{d.demo}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const facts = [
  { value: "4 + URL", label: "File types: PDF, Word, text, Markdown, or a web page" },
  { value: "500,000", label: "Characters read from each document" },
  { value: "~1,000", label: "Characters per passage, with 150 of overlap" },
  { value: "768", label: "Numbers in each passage's embedding" },
  { value: "6", label: "Passages retrieved for every answer" },
  { value: "1", label: "Script tag to add it to your website" },
];

function Facts() {
  return (
    <section aria-labelledby="facts-title" className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="facts-title" className="eyebrow">
          The numbers behind it
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3 lg:grid-cols-6">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col-reverse justify-end bg-surface p-4">
              <dt className="mt-1 text-[12.5px] leading-snug text-fg-muted">{f.label}</dt>
              <dd className="tabular font-display text-[26px] font-semibold text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-t border-border bg-surface-2 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Pricing</p>
          <h2 id="pricing-title" className="mt-2 text-[30px] font-semibold leading-tight text-fg md:text-[38px]">
            Pay for volume, not for features.
          </h2>
          <p className="mt-3 text-[16px] text-fg-muted">Every plan includes the full product. Plans differ in how much you can store and answer.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.key} delay={i * 0.06} className="panel flex flex-col p-6">
              <h3 className="text-[17px] font-semibold text-fg">{p.name}</h3>
              <p className="mt-1 text-[13.5px] text-fg-muted">{p.summary}</p>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="tabular font-display text-[40px] font-semibold leading-none text-fg">
                  {p.price === 0 ? "Free" : `$${p.price}`}
                </span>
                {p.price > 0 && <span className="text-[13px] text-fg-muted">per month</span>}
              </p>
              <ul className="mt-6 space-y-2 text-[14px] text-fg">
                {Object.values(p.limits).map((l) => (
                  <li key={l} className="flex gap-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
                    {l}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                data-press=""
                className={buttonVariants({ variant: p.key === "STARTER" ? "primary" : "secondary", className: "mt-8 w-full" })}
              >
                {p.price === 0 ? "Start free" : `Start with ${p.name}`}
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-[13.5px] text-fg-muted">
          On every plan: {EVERY_PLAN.join(" · ")}.
        </p>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "How is this different from a general chatbot?",
    a: "It only answers from your documents. Each reply is built from the 6 passages that best match the question and cites them as [1], [2]. When your docs don't cover something, the assistant says so instead of guessing.",
  },
  {
    q: "Which files can I upload?",
    a: "PDF, Word (DOCX), plain text and Markdown, or a page URL. Up to 500,000 characters of text are read from each document. Pages that need JavaScript to show their content may import nearly empty.",
  },
  {
    q: "How do I put it on my website?",
    a: "Each assistant has an Embed button that gives you one script tag. Paste it into your site; a chat bubble in your brand colour appears, and every website conversation shows up in Conversations.",
  },
  {
    q: "Can my team use it together?",
    a: "Yes. Workspaces have owner, admin and member roles. Invite teammates with a link, change roles, or remove access from the Team page.",
  },
  {
    q: "Can I try it without signing up?",
    a: "Open the live demo: a shared workspace with two sample companies, twelve help docs and a month of conversations. Live chat there is limited to 15 messages an hour, and the data resets daily.",
  },
];

function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="mt-2 text-[30px] font-semibold leading-tight text-fg md:text-[38px]">
            Common questions
          </h2>
        </Reveal>
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((f, i) => (
            <details key={f.q} className="group py-4" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-[16px] font-medium text-fg [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-fg-muted transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-prose text-[14.5px] leading-relaxed text-fg-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="border-t border-border bg-surface-2 py-20">
      <Reveal className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[28px] font-semibold leading-tight text-fg md:text-[34px]">Start with the docs you already have.</h2>
          <p className="mt-2 text-[15.5px] text-fg-muted">Create a workspace, upload a document, and ask it a question in the playground.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" data-press="" className={buttonVariants({ variant: "primary", size: "lg" })}>
            Start free
          </Link>
          <TryDemoButton label="Open the live demo" size="lg" />
        </div>
      </Reveal>
    </section>
  );
}
