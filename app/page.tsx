"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { TicketCard } from "@/components/landing/TicketCard";
import { Reveal } from "@/components/motion/Reveal";
import { Typewriter } from "@/components/landing/Typewriter";
import {
  MockKnowledge,
  MockAnswer,
  MockAnalytics,
  MockTeam,
} from "@/components/landing/FeatureMock";

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav />
      <Hero />
      <LogoStrip />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20 md:pb-32">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono-caps text-signal mb-6"
            >
              AI Support, Resolved Instantly
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[40px] md:text-[64px] leading-[1.05] font-bold text-ink"
              style={{ letterSpacing: "-0.02em" }}
            >
              Your customers ask.{" "}
              <span className="italic font-medium text-signal">
                <Typewriter words={["SupportAI"]} />
              </span>{" "}
              answers.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              Drop in your help docs. Get a chat agent that reads them, answers in
              seconds, and cites its sources. No prompt engineering. No training data.
              No babysitting.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 px-5 py-3 bg-signal text-white rounded-md font-medium hover:bg-[#e84a26] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(255,90,54,0.5)] transition-all duration-150"
              >
                Start free trial
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-5 py-3 text-ink hover:text-signal transition-colors duration-150"
              >
                Watch demo
              </a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-8 flex items-center gap-6 font-mono text-[11px] text-muted-foreground"
            >
              <span>FULLY FREE STACK</span>
              <span className="text-line">·</span>
              <span>NO CREDIT CARD</span>
              <span className="text-line">·</span>
              <span>5-MIN SETUP</span>
            </motion.div>
          </div>

          <div className="relative" id="demo">
            <TicketCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const logos = ["Northwind", "Hyperion", "Lumina", "Verdant", "Quill", "Strand"];
  return (
    <Reveal>
      <section className="border-y border-line bg-paper-raised/40">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="font-mono-caps text-muted-foreground text-center mb-5">
            Trusted by support teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
            {logos.map((l) => (
              <span
                key={l}
                className="font-display text-xl text-ink/40 hover:text-ink/70 transition-colors"
                style={{ letterSpacing: "-0.01em" }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

const features = [
  {
    eyebrow: "RAG · CITATIONS · STREAMING",
    title: "Answers grounded in your docs — never made up.",
    body: "Every reply is built from chunks of your knowledge base, with a similarity score and source citation. When your docs don't have the answer, SupportAI says so instead of hallucinating.",
    mock: <MockAnswer />,
  },
  {
    eyebrow: "PDF · DOCX · MD · URL",
    title: "Upload anything. We handle the rest.",
    body: "Drag in a PDF, a Word doc, or paste a URL. SupportAI extracts text, chunks it at paragraph boundaries, embeds it, and re-indexes — usually under a minute per document.",
    mock: <MockKnowledge />,
  },
  {
    eyebrow: "REAL-TIME ANALYTICS",
    title: "See what your customers actually ask.",
    body: "Track resolution rate, response volume, and the questions your docs don't yet cover. Every missed answer becomes a content gap you can fix in one click.",
    mock: <MockAnalytics />,
  },
  {
    eyebrow: "WORKSPACES · ROLES",
    title: "Bring your whole support team.",
    body: "Invite teammates with owner, admin, and member roles. Share assistants across a workspace and keep customer data scoped to your organization.",
    mock: <MockTeam />,
  },
];

function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="max-w-2xl mb-20">
            <div className="font-mono-caps text-signal mb-4">What&rsquo;s inside</div>
            <h2
              className="font-display text-[40px] md:text-5xl leading-[1.1] font-semibold text-ink"
              style={{ letterSpacing: "-0.015em" }}
            >
              A real product, not a wrapper.
            </h2>
          </div>
        </Reveal>

        <div className="space-y-24 md:space-y-32">
          {features.map((f, i) => {
            const reverse = i % 2 === 1;
            return (
              <Reveal key={f.title}>
                <div
                  className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${
                    reverse ? "md:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div>
                    <div className="font-mono-caps text-muted-foreground mb-4">
                      {f.eyebrow}
                    </div>
                    <h3
                      className="font-display text-3xl md:text-4xl font-semibold text-ink leading-[1.15]"
                      style={{ letterSpacing: "-0.015em" }}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-5 text-muted-foreground leading-relaxed text-lg">
                      {f.body}
                    </p>
                  </div>
                  <div>{f.mock}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Starter",
    price: 0,
    tagline: "Kick the tires. Free forever.",
    features: ["1 assistant", "10 documents", "500 messages / month", "Community support"],
    highlight: false,
  },
  {
    name: "Pro",
    price: 79,
    tagline: "Most teams pick this one.",
    features: [
      "5 assistants",
      "50 documents",
      "10,000 messages / month",
      "Remove SupportAI branding",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Agency",
    price: 199,
    tagline: "Multi-client, white-label, unlimited.",
    features: [
      "Unlimited assistants",
      "200 documents per assistant",
      "50,000 messages / month",
      "Custom domains",
      "Dedicated CSM",
    ],
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 bg-paper-raised/40 border-y border-line">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="font-mono-caps text-signal mb-4">Pricing</div>
            <h2
              className="font-display text-[40px] md:text-5xl leading-[1.1] font-semibold text-ink"
              style={{ letterSpacing: "-0.015em" }}
            >
              Honest pricing. Cancel any time.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Every plan includes RAG, citations, embed widget, and analytics.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <PlanCard plan={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <div
      className={`relative h-full rounded-lg p-7 transition-all duration-200 hover:-translate-y-1 ${
        plan.highlight
          ? "bg-paper-raised border-2 border-signal shadow-[0_24px_60px_-30px_rgba(255,90,54,0.45)]"
          : "bg-paper hairline hover:border-ink/40"
      }`}
    >
      {plan.highlight && (
        <div className="absolute -top-3 left-7 font-mono-caps text-signal bg-paper-raised px-2 py-0.5 border border-signal rounded">
          Most popular
        </div>
      )}
      <h3 className="font-display text-2xl font-semibold text-ink">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl font-semibold text-ink tracking-tight">
          {plan.price === 0 ? "Free" : `$${plan.price}`}
        </span>
        {plan.price !== 0 && (
          <span className="font-mono text-sm text-muted-foreground">/ MO</span>
        )}
      </div>
      <ul className="mt-6 space-y-3 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-ink">
            <span className="text-moss mt-0.5">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`mt-8 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md font-medium transition-colors duration-150 ${
          plan.highlight
            ? "bg-signal text-white hover:bg-[#e84a26]"
            : "bg-ink text-paper hover:bg-signal"
        }`}
      >
        {plan.price === 0 ? "Get started free" : "Start free trial"}
      </Link>
    </div>
  );
}

const testimonials = [
  {
    quote:
      "We shut down our $400/mo helpdesk subscription the day SupportAI hit 78% resolution. Customers can't tell the difference, except it's faster.",
    name: "Priya Shah",
    role: "Head of Support, Northwind",
  },
  {
    quote:
      "Set up in an afternoon. The citations are what sold our legal team — every answer points to the exact paragraph in our docs.",
    name: "Marcus Reid",
    role: "Operations, Hyperion",
  },
  {
    quote:
      "I run support for 12 e-commerce clients. SupportAI handles tier-1 questions across all of them. My evenings are mine again.",
    name: "Sasha Okafor",
    role: "Founder, Verdant CX",
  },
];

function Testimonials() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="font-mono-caps text-signal mb-4">From the field</div>
          <h2
            className="font-display text-[40px] md:text-5xl leading-[1.1] font-semibold text-ink max-w-3xl"
            style={{ letterSpacing: "-0.015em" }}
          >
            Support teams that stopped firefighting.
          </h2>
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <figure className="h-full bg-paper-raised hairline rounded-lg p-7 flex flex-col">
                <blockquote className="font-display text-lg leading-relaxed text-ink flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-line">
                  <div className="text-sm font-medium text-ink">{t.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                    {t.role}
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "How is this different from a generic ChatGPT bot?",
    a: "SupportAI only answers from your documents. Every reply is grounded in retrieved chunks with similarity scores you can audit. When your docs don't cover a question, the assistant says so instead of guessing.",
  },
  {
    q: "How long does setup take?",
    a: "Most teams are live in under 30 minutes: create a workspace, upload your docs (usually <60s per file to index), customize tone and brand color, paste the embed script into your site. That's it.",
  },
  {
    q: "Is it really free to run?",
    a: "Yes — Neon Postgres, Google Gemini, and Stripe test mode all have generous free tiers. You can run the entire stack without paying for anything.",
  },
  {
    q: "Can I export conversations?",
    a: "Every conversation is stored with full transcripts and citations, browsable from the Conversations tab on any plan.",
  },
  {
    q: "What languages does it support?",
    a: "40+ out of the box, auto-detected. Reply language matches the customer's language regardless of what your docs are written in.",
  },
  {
    q: "What if I want to cancel?",
    a: "One click in billing settings. You keep your data, no questions asked, no retention emails.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 bg-paper-raised/40 border-y border-line">
      <div className="max-w-3xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <div className="font-mono-caps text-signal mb-4">FAQ</div>
            <h2
              className="font-display text-[40px] md:text-5xl leading-[1.1] font-semibold text-ink"
              style={{ letterSpacing: "-0.015em" }}
            >
              Questions, answered.
            </h2>
          </div>
        </Reveal>
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((f, i) => (
            <FAQItem key={f.q} item={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ item, index }: { item: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="font-display text-lg font-medium text-ink group-hover:text-signal transition-colors">
          {item.q}
        </span>
        <span
          className="font-mono text-xl text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}
        >
          +
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="pt-3 text-muted-foreground leading-relaxed">{item.a}</p>
      </motion.div>
    </div>
  );
}

function CTA() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <Reveal>
          <div className="bg-ink text-paper rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, var(--signal) 0%, transparent 40%), radial-gradient(circle at 80% 70%, var(--moss) 0%, transparent 40%)",
              }}
            />
            <div className="relative">
              <div className="font-mono-caps text-signal mb-5">Ready when you are</div>
              <h2
                className="font-display text-4xl md:text-5xl font-semibold leading-[1.1]"
                style={{ letterSpacing: "-0.02em" }}
              >
                Stop answering the same question{" "}
                <span className="italic font-medium">a hundred times</span>.
              </h2>
              <p className="mt-5 text-paper/70 text-lg max-w-xl mx-auto">
                Free forever to start. Your first assistant in five minutes.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-signal text-white px-6 py-3 rounded-md font-medium hover:-translate-y-0.5 transition-all"
                >
                  Start free trial →
                </Link>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 text-paper/80 hover:text-paper px-6 py-3 transition-colors"
                >
                  See pricing
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
