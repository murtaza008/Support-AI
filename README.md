# SupportAI

**Turn your help docs into a 24/7 AI support agent — built on a 100% free stack.**

[![Live demo](https://img.shields.io/badge/demo-live-22c55e?style=flat-square)](https://support-ai-murex.vercel.app/)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![pgvector](https://img.shields.io/badge/Neon-Postgres%20%2B%20pgvector-00E599?style=flat-square&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)

**Live demo:** https://support-ai-murex.vercel.app/ — sign up, create a workspace and
an assistant, upload a document, and chat with it in the playground.

SupportAI is a full-stack SaaS platform for businesses that want to automate
customer support with AI. Upload your help docs (PDF, DOCX, TXT, Markdown, or
a URL), and SupportAI creates a chat assistant that answers customer
questions using **Retrieval-Augmented Generation (RAG)**: every answer is
grounded in your actual documentation and cites its sources instead of
hallucinating. Embed it on your website with one script tag, or test it
straight from the built-in playground.

## Contents

- [Why this stack is fully free](#why-this-stack-is-fully-free)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Embedding the chat widget](#embedding-the-chat-widget)
- [Seeding a demo knowledge base](#seeding-a-demo-knowledge-base)
- [How the RAG pipeline works](#how-the-rag-pipeline-works)
- [API routes](#api-routes)
- [Project structure](#project-structure)
- [Deploying to Vercel](#deploying-to-vercel)
- [Known limitations](#known-limitations)
- [Author](#author)
- [License](#license)

## Why this stack is fully free

Every piece of this project runs on a generous free tier, with no credit
card required anywhere in the core product:

| Layer | Choice | Why it's free |
|---|---|---|
| Database | [Neon Postgres](https://neon.tech) | Free serverless Postgres tier, includes the `pgvector` extension |
| ORM | [Prisma 7](https://www.prisma.io) | Open source, connects to Neon via `@prisma/adapter-neon` |
| Auth | [NextAuth.js (Auth.js) v5](https://authjs.dev) | Open source, email/password via bcrypt, no third-party auth bill |
| AI (chat + embeddings) | [Google Gemini](https://aistudio.google.com/apikey) | Free API key: `gemini-flash-latest` for answers, `gemini-embedding-2` (768 dimensions) for embeddings |
| Vector search | Postgres `pgvector` | Runs inside your free Neon database, no separate vector DB service |
| File parsing | `unpdf` + `mammoth` | Open source PDF/DOCX text extraction, no storage bucket needed |
| Payments | [Stripe](https://dashboard.stripe.com/test/apikeys) test mode | Test-mode API keys are free forever, no bank account or business verification needed. Skip it entirely and the app runs in **demo billing mode** automatically |
| Hosting | [Vercel](https://vercel.com) free tier (or anywhere Next.js runs) | — |

If you never add a `STRIPE_SECRET_KEY`, the billing page still works:
"upgrading" a plan just flips the workspace's plan in the database instantly
with a "demo mode" notice, so you can build and demo the whole product
without ever creating a Stripe account.

## Features

- **Auth & workspaces** — email/password sign-up, multi-tenant workspaces with owner/admin/member roles, and a first-run wizard that creates your workspace and first assistant
- **AI assistants** — multiple assistants per workspace, each with its own name, description, tone (friendly / professional / playful) and custom system prompt
- **Knowledge base** — paste text, import a URL, or upload a PDF/DOCX/TXT/Markdown file; documents are chunked, embedded and indexed automatically and shared by every assistant in the workspace. Click a document to read its extracted text
- **RAG chat playground** — streamed answers per assistant, with inline `[1]`, `[2]` citation markers that point at the retrieved snippets
- **Embeddable widget** — a single `<script>` tag drops a floating, brand-coloured chat bubble on any website, backed by the same RAG pipeline (copy the snippet from **Assistants → Embed**)
- **Conversation history** — every playground and widget conversation is logged with full transcripts; each answer lists the source documents it used, and clicking one opens it
- **Analytics dashboard** — 30-day messages per day and conversations handled per assistant, with headline stats, charted with Recharts
- **Team management** — invite teammates by shareable link, change roles, revoke invites and remove members
- **Billing** — Starter / Pro / Agency plans with real Stripe Checkout + Customer Portal (test mode) or automatic demo-mode fallback
- **Dark mode** — light / dark / system theme toggle (`next-themes`)
- **Editorial design system** — Fraunces serif + Inter + JetBrains Mono, a paper/ink colour palette, and `motion` animations throughout, including scroll-triggered reveals that **replay every time a section re-enters view** and a type/erase cursor effect on the homepage headline

## Tech stack

- **Framework:** Next.js 16 (App Router, Route Handlers, `proxy.ts`), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4, `motion` for animation, `next-themes` for dark mode
- **Database:** Neon Postgres + Prisma 7 (via the `@prisma/adapter-neon` driver adapter) + pgvector (`vector(768)` column, queried with raw SQL)
- **Auth:** NextAuth.js v5, Credentials provider, JWT sessions, bcrypt password hashing
- **AI:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react` `useChat`) + Google Gemini
- **Payments:** Stripe Checkout + Billing Portal (test mode) with a demo-mode fallback
- **Data fetching:** TanStack Query against the app's own Next.js Route Handlers
- **Charts:** Recharts · **Icons:** lucide-react · **Toasts:** sonner

## Getting started

**Prerequisites:** Node.js **20.9+**, a free Neon database, a free Gemini API key.

### 1. Clone and install

```bash
git clone https://github.com/murtaza008/Support-AI.git
cd Support-AI
npm install        # also runs `prisma generate` (postinstall)
```

Create a `.env` file in the project root with this template; the next steps
fill it in:

```bash
# Neon → Connect → pooled connection string
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# openssl rand -base64 32
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# https://aistudio.google.com/apikey (free)
GOOGLE_GENERATIVE_AI_API_KEY=""

# Optional: leave blank for demo billing mode
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_PRO=""
STRIPE_PRICE_AGENCY=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"
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

Skip this entirely if you don't need real checkout; billing falls back to
demo mode automatically. To wire up real (test-mode, free) Stripe Checkout:

1. Create a free account at [stripe.com](https://stripe.com).
2. Grab your **test** secret key (`sk_test_...`) from the [API keys page](https://dashboard.stripe.com/test/apikeys).
3. Create two recurring Prices in test mode (Pro, Agency) and copy their price IDs.
4. Fill in `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_AGENCY` in `.env`.
   (Checkout is a server-side redirect, so no publishable key is needed.)
5. For webhooks locally, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and paste the printed secret into `STRIPE_WEBHOOK_SECRET`.
   The webhook handles `checkout.session.completed`, `customer.subscription.updated` and `customer.subscription.deleted`.

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

### npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | `next build` (does not change the database schema) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx prisma db push` | Sync `prisma/schema.prisma` (and the `vector` extension) to the database |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | Neon Postgres connection string (pooled is fine) |
| `NEXTAUTH_SECRET` | **yes** | Signs session JWTs (`AUTH_SECRET` also works with Auth.js v5) |
| `NEXTAUTH_URL` | local only | Base URL; not needed on Vercel |
| `GOOGLE_GENERATIVE_AI_API_KEY` | **yes** | Gemini chat + embeddings; nothing can be ingested or answered without it |
| `NEXT_PUBLIC_APP_URL` | for Stripe | Base URL for Stripe Checkout / Portal redirects |
| `STRIPE_SECRET_KEY` | no | Real Stripe Checkout; empty = demo billing mode |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Verifies webhook signatures |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_AGENCY` | with Stripe | Recurring Price IDs |
| `SEED_USER_EMAIL` | no | Default account for the seed script |

## Embedding the chat widget

Open **Assistants**, click **Embed** on an assistant, and copy the snippet. It looks like this:

```html
<script
  src="https://support-ai-murex.vercel.app/api/public/widget/embed.js"
  data-assistant="YOUR_ASSISTANT_ID"
  data-title="Chat with us"
  data-color="#ff5a36"></script>
```

| Attribute | Required | Meaning |
| --- | --- | --- |
| `src` | yes | `embed.js` served by **your** deployment; the widget calls the API on the same origin |
| `data-assistant` | yes | The assistant's id (note: `data-assistant`, not `data-assistant-id`) |
| `data-title` | no | Header text of the chat panel (default "Chat with us") |
| `data-color` | no | Brand colour for the bubble, header and send button (default `#FF5A36`) |

The widget is plain JavaScript with no dependencies. It keeps an anonymous visitor
id in `localStorage` and the conversation id in `sessionStorage`, streams answers
from `POST /api/public/widget/[assistantId]/chat` (CORS-enabled), and every
conversation shows up under **Conversations** with the `WIDGET` channel.

To try it locally, open [`scripts/test-site.html`](scripts/test-site.html), a mock
company page with the snippet already in place. Point its `src` at your running
app and set `data-assistant` to one of your assistant ids.

## Seeding a demo knowledge base

`scripts/seed-knowledge-base.ts` adds a **"Nimbus Support Bot"** assistant with four
help-centre documents from [`scripts/demo-docs/`](scripts/demo-docs) (refund policy,
shipping, warranty, subscriptions) to an **existing** account's workspace, plus
demo conversations. It goes through the real pipeline: documents are chunked and
embedded with Gemini, and the conversation answers are real model output with
real citations. Sign up and finish onboarding first, then:

```bash
npx tsx scripts/seed-knowledge-base.ts you@example.com --dry   # preview, writes nothing
npx tsx scripts/seed-knowledge-base.ts you@example.com         # insert
npx tsx scripts/check-seed.ts you@example.com                  # read-only summary
```

It is safe to re-run (the assistant, documents and conversations are matched and
skipped if they exist). Because it makes real Gemini calls, a free-tier key may hit
its quota part-way; whatever was saved stays, so run it again later to finish.

## How the RAG pipeline works

1. **Ingest** — text is extracted (`unpdf` for PDF, `mammoth` for DOCX, UTF-8 for
   TXT/MD, tag-stripping for URLs; capped at 500,000 characters) and split into
   ~1000-character paragraph-aware chunks with a 150-character overlap
   ([`lib/chunker.ts`](lib/chunker.ts)).
2. **Embed** — chunks are embedded in batches of 50 with Gemini's
   `gemini-embedding-2` model, truncated to **768 dimensions**
   (`outputDimensionality`), and written to a `vector(768)` column on
   `DocumentChunk` ([`lib/rag.ts`](lib/rag.ts)). The document moves from
   `PROCESSING` to `READY`, or to `ERROR` with the message.
3. **Retrieve** — the customer's latest message is embedded and compared against
   the workspace's chunks with cosine distance (`embedding <=> query_vector`).
   Only chunks shared with every assistant (`assistantId` null, which is what the
   UI creates) or attached to *this* assistant via the API are eligible; the **6**
   closest are returned.
4. **Answer** — the chunks are numbered and injected into the system prompt along
   with the assistant's tone, description and custom instructions. The model is
   told to answer only from that context, to say so honestly when the answer is not
   there, and to cite sources as `[1]`, `[2]`. `gemini-flash-latest` streams the
   answer; the user message, the answer and its citations (document + similarity)
   are saved to the conversation.

## API routes

All routes except auth, `public/*` and the Stripe webhook require a session and
check workspace membership (and role where relevant).

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account |
| `POST` | `/api/workspaces` | Create a workspace |
| `GET` | `/api/workspaces/current` | Current workspace and role |
| `PATCH` | `/api/workspaces/[id]` | Update workspace settings |
| `GET` | `/api/workspaces/[id]/members` | Members |
| `PATCH` `DELETE` | `/api/workspaces/[id]/members/[memberId]` | Change role / remove member (Owner, Admin; the owner is protected) |
| `GET` `POST` | `/api/workspaces/[id]/invites` | List / create invite links |
| `DELETE` | `/api/workspaces/[id]/invites/[inviteId]` | Revoke an invite |
| `GET` `POST` | `/api/invites/[token]` | Read / accept an invite |
| `GET` `POST` | `/api/assistants` | List / create assistants |
| `GET` `PATCH` `DELETE` | `/api/assistants/[id]` | Read / update / delete an assistant |
| `GET` `POST` | `/api/documents` | List documents / ingest pasted text |
| `POST` | `/api/documents/upload` | Upload and ingest a PDF / DOCX / TXT / MD file |
| `POST` | `/api/documents/fetch-url` | Fetch a URL and return its text for ingestion |
| `GET` `DELETE` | `/api/documents/[id]` | Read a document's text / delete it |
| `POST` | `/api/chat` | Authenticated streaming RAG chat (playground) |
| `GET` | `/api/conversations` | Conversations in a workspace |
| `GET` | `/api/conversations/[id]/messages` | Messages with citations |
| `GET` | `/api/analytics` | 30-day analytics data |
| `GET` | `/api/public/widget/embed.js` | The embeddable widget script |
| `POST` | `/api/public/widget/[assistantId]/chat` | Public widget chat (CORS, no auth) |
| `POST` | `/api/billing/checkout` | Stripe Checkout, or instant plan switch in demo mode |
| `POST` | `/api/billing/portal` | Stripe Customer Portal |
| `POST` | `/api/webhooks/stripe` | Stripe webhook receiver |

## Project structure

```
support-ai/
  app/
    page.tsx                     # Landing page
    login/, signup/              # Auth pages
    onboarding/                  # First-run workspace + assistant wizard
    invite/[token]/              # Team invite acceptance
    (dashboard)/                 # Protected dashboard route group
      dashboard/, assistants/ (+ [id]/playground), knowledge/,
      conversations/, analytics/, team/, settings/, billing/
    api/
      auth/                      # NextAuth handler + signup endpoint
      workspaces/, assistants/, documents/, conversations/, analytics/, invites/
      chat/                      # Authenticated streaming RAG chat
      public/widget/             # Embeddable widget script + its public chat API
      billing/, webhooks/stripe/ # Stripe checkout, portal, webhook
  components/
    landing/                     # Nav, Footer, Typewriter, TicketCard, FeatureMock
    dashboard/                   # Sidebar, Shell (workspace-aware layout), DocumentViewer
    motion/                      # Reveal (replays on scroll re-entry)
    auth/                        # Shared login/signup form
    theme-toggle.tsx             # Light / dark / system
  lib/
    rag.ts                       # Ingest, retrieve, RAG prompt, citations
    gemini.ts                    # Chat model + embeddings
    chunker.ts, parse-file.ts    # Chunking and PDF/DOCX/TXT/MD extraction
    prisma.ts, auth.ts, auth.config.ts, session.ts, workspace.ts, stripe.ts, utils.ts
    hooks/                       # TanStack Query hooks
  prisma/schema.prisma           # Data model (users, workspaces, assistants, documents,
                                 # vector chunks, conversations, messages, invites)
  scripts/
    seed-knowledge-base.ts, check-seed.ts
    demo-docs/                   # Four demo help-centre documents
    test-site.html               # Mock website for testing the widget
  types/next-auth.d.ts           # Session type augmentation
  proxy.ts                       # Redirects signed-out visitors (Next.js 16 "proxy")
```

## Deploying to Vercel

1. Push the repo to GitHub and [import it into Vercel](https://vercel.com/new). The
   Next.js preset and build command are detected automatically.
2. Add environment variables in **Settings → Environment Variables**:
   `DATABASE_URL`, `NEXTAUTH_SECRET` (a new value), `GOOGLE_GENERATIVE_AI_API_KEY`,
   `NEXT_PUBLIC_APP_URL` (your production URL), and the `STRIPE_*` keys if you use
   real Stripe. `NEXTAUTH_URL` is not needed on Vercel.
3. **Database schema:** the build runs only `next build` and never changes the
   schema (there is no migrations folder; the schema is pushed with
   `npx prisma db push`). Run `npx prisma db push` once against the production
   database before the first deploy, and again after any schema change.
4. Deploy. If you use real Stripe, add a webhook endpoint at
   `https://<your-domain>/api/webhooks/stripe` and put its signing secret in
   `STRIPE_WEBHOOK_SECRET`.
5. Use your **production** domain in the widget snippet. Per-deployment preview URLs
   are usually behind Vercel Deployment Protection, so a widget pointed at one will
   fail on other websites.

## Known limitations

- **Plan limits are not enforced.** Assistant, document and message quotas on the
  pricing table are plan copy; the API does not cap them.
- **The public widget endpoint has no rate limiting.** Anyone with an assistant id
  can send messages, and each one costs a Gemini call. Add rate limiting before
  real production use.
- **Similarity scores are stored but not shown.** Citations (document + similarity)
  are saved on every answer; the Conversations page lists the source documents,
  while the playground and widget show only the inline `[n]` markers.
- **Resolution rate is always 0%.** Conversations have a `resolved` flag that
  analytics counts, but nothing in the app sets it yet.
- **Ingestion is synchronous.** A large document is chunked and embedded inside the
  request; on Vercel, uploads are also limited by the 4.5 MB request body cap.
- **URL import is basic.** The page is fetched server-side and HTML tags are
  stripped; JavaScript-rendered pages may come back nearly empty.

## Author

Built by **Murtaza Mazhar** — [GitHub @murtaza008](https://github.com/murtaza008) ·
[Repository](https://github.com/murtaza008/Support-AI) · [Live demo](https://support-ai-murex.vercel.app/)

## License

MIT — do whatever you want with it.
