# SupportAI

**Turn your help docs into a 24/7 AI support agent — built on a 100% free stack.**

SupportAI is a full-stack SaaS platform for businesses that want to automate
customer support with AI. Upload your help docs (PDF, DOCX, TXT, Markdown, or
a URL), and SupportAI creates a chat assistant that answers customer
questions using **Retrieval-Augmented Generation (RAG)** — every answer is
grounded in your actual documentation and cites its sources, instead of
hallucinating. Embed it on your website with one script tag, or test it
straight from the built-in playground.

## Why this stack is fully free

Every piece of this project runs on a generous free tier, with no credit
card required anywhere in the core product:

| Layer | Choice | Why it's free |
|---|---|---|
| Database | [Neon Postgres](https://neon.tech) | Free serverless Postgres tier, includes the `pgvector` extension |
| ORM | [Prisma 7](https://www.prisma.io) | Open source, connects to Neon via `@prisma/adapter-neon` |
| Auth | [NextAuth.js (Auth.js) v5](https://authjs.dev) | Open source, email/password via bcrypt — no third-party auth bill |
| AI (chat + embeddings) | [Google Gemini](https://aistudio.google.com/apikey) | Free API key, `gemini-2.5-flash` + `text-embedding-004` |
| Vector search | Postgres `pgvector` | Runs inside your free Neon database — no separate vector DB service |
| File parsing | `unpdf` + `mammoth` | Open source PDF/DOCX text extraction, no storage bucket needed |
| Payments | [Stripe](https://dashboard.stripe.com/test/apikeys) test mode | Test-mode API keys are free forever — no bank account or business verification needed. Skip it entirely and the app runs in **demo billing mode** automatically |
| Hosting | [Vercel](https://vercel.com) free tier (or anywhere Next.js runs) | — |

If you never add a `STRIPE_SECRET_KEY`, the billing page still works —
"upgrading" a plan just flips the workspace's plan in the database instantly
with a "demo mode" notice, so you can build and demo the whole product
without ever creating a Stripe account.

## Features

- **Auth & workspaces** — email/password sign-up, multi-tenant workspaces with owner/admin/member roles
- **AI assistants** — create multiple assistants per workspace, each with its own tone, description, and system prompt
- **Knowledge base** — paste text, paste a URL, or upload a PDF/DOCX/TXT/Markdown file; documents are chunked, embedded, and indexed automatically
- **RAG chat playground** — streamed answers with inline citations `[1]`, `[2]` back to the exact source document and similarity score
- **Embeddable widget** — a single `<script>` tag drops a floating chat bubble on any website, backed by the same RAG pipeline
- **Conversation history** — every playground and widget conversation is logged with full transcripts and citations
- **Analytics dashboard** — 30-day message/conversation volume and per-assistant breakdown, charted with Recharts
- **Team management** — invite teammates by shareable link, manage roles, revoke access
- **Billing** — Starter / Pro / Agency plans with real Stripe Checkout (test mode) or automatic demo-mode fallback
- **Editorial design system** — Fraunces serif + Inter + JetBrains Mono, a paper/ink color palette, and Framer Motion animations throughout, including scroll-triggered reveals that **replay every time a section re-enters view** and a type/erase cursor effect on the homepage headline

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4, `motion` (Framer Motion) for animation
- **Database:** Neon Postgres + Prisma 7 (via the `@prisma/adapter-neon` driver adapter) + pgvector
- **Auth:** NextAuth.js v5, Credentials provider, JWT sessions, bcrypt password hashing
- **AI:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`) + Google Gemini
- **Payments:** Stripe Checkout + Billing Portal (test mode) with a demo-mode fallback
- **Data fetching:** TanStack Query against the app's own Next.js Route Handlers
- **Charts:** Recharts · **Icons:** lucide-react · **Toasts:** sonner

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a free Neon Postgres database

1. Sign up at [neon.tech](https://neon.tech) (free, no card required).
2. Create a project, then copy its connection string.
3. Paste it into `.env` as `DATABASE_URL`.

### 3. Get a free Google Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and sign in with any Google account.
2. Create a free API key.
3. Paste it into `.env` as `GOOGLE_GENERATIVE_AI_API_KEY`.

### 4. Generate an auth secret

```bash
openssl rand -base64 32
```

Paste the result into `.env` as `NEXTAUTH_SECRET`.

### 5. (Optional) Stripe test mode

Skip this entirely if you don't need real checkout — billing falls back to
demo mode automatically. To wire up real (test-mode, free) Stripe Checkout:

1. Create a free account at [stripe.com](https://stripe.com).
2. Grab your **test** keys from the [API keys page](https://dashboard.stripe.com/test/apikeys) (`sk_test_...` / `pk_test_...`).
3. Create two recurring Prices in test mode (Pro, Agency) and copy their price IDs.
4. Fill in `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_AGENCY` in `.env`.
5. For webhooks locally, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and paste the printed secret into `STRIPE_WEBHOOK_SECRET`.

### 6. Push the database schema

```bash
npx prisma db push
```

This creates all tables and enables the `vector` extension on your Neon
database. (If extension auto-creation ever fails on your Postgres version,
run `CREATE EXTENSION IF NOT EXISTS vector;` once in the Neon SQL editor —
takes five seconds.)

### 7. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, create a
workspace, create an assistant, upload a document, and chat with it in the
playground.

## Project structure

```
support-ai/
  app/
    page.tsx                     # Landing page
    login/, signup/               # Auth pages
    onboarding/                   # First-run workspace + assistant wizard
    invite/[token]/                # Team invite acceptance
    (dashboard)/                  # Protected dashboard route group
      dashboard/, assistants/, knowledge/, conversations/,
      analytics/, team/, settings/, billing/
    api/
      auth/                       # NextAuth handler + signup endpoint
      workspaces/, assistants/, documents/, conversations/, analytics/
      chat/                       # Authenticated streaming RAG chat
      public/widget/               # Public embeddable widget + its chat API
      billing/, webhooks/stripe/   # Stripe checkout, portal, webhook
  components/
    landing/                      # Nav, Hero visuals, Reveal, Typewriter, TicketCard, FeatureMock
    dashboard/                    # Sidebar, Shell (workspace-aware layout)
    auth/                         # Shared login/signup form
  lib/
    prisma.ts, auth.ts, auth.config.ts, session.ts, workspace.ts
    gemini.ts, chunker.ts, rag.ts, parse-file.ts, stripe.ts, utils.ts
  prisma/schema.prisma            # Full data model (users, workspaces, assistants,
                                   # documents, vector chunks, conversations, invites)
```

## How the RAG pipeline works

1. **Ingest** — a document's text is split into ~1000-character paragraph-aware
   chunks with a 150-character overlap (`lib/chunker.ts`).
2. **Embed** — each chunk is embedded with Gemini's free `text-embedding-004`
   model (768 dimensions) and stored in a `pgvector` column.
3. **Retrieve** — when a customer asks a question, the question itself is
   embedded and compared against stored chunks using cosine distance
   (`embedding <=> query_vector`), returning the 6 closest matches.
4. **Answer** — those chunks are injected into the system prompt along with
   the assistant's tone and instructions, and `gemini-2.5-flash` streams back
   an answer that cites its sources as `[1]`, `[2]`, etc.

## Deployment

Deploy anywhere Next.js runs (e.g. [Vercel](https://vercel.com), free tier).
Set the same environment variables from `.env.example` in your hosting
provider's dashboard, then run `npx prisma db push` once against your
production database before first deploy.

## License

MIT — do whatever you want with it.
