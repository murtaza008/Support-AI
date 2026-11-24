# SupportAI

**Turn your help docs into a 24/7 AI support agent — built on a 100% free stack.**

[![Live demo](https://img.shields.io/badge/demo-live-22c55e?style=flat-square)](https://support-ai-murex.vercel.app/)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![pgvector](https://img.shields.io/badge/Neon-Postgres%20%2B%20pgvector-00E599?style=flat-square&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)

**Live demo:** https://support-ai-murex.vercel.app/ — click **Open the live demo** to
explore a fully seeded workspace with no sign-up, or create your own account, upload a
document, and chat with it in the playground.

SupportAI is a full-stack SaaS platform for businesses that want to automate
customer support with AI. Upload your help docs (PDF, DOCX, TXT, Markdown, or
a URL), and SupportAI creates a chat assistant that answers customer
questions using **Retrieval-Augmented Generation (RAG)**: every answer is
grounded in your actual documentation and cites its sources instead of
hallucinating. Embed it on your website with one script tag, or test it
straight from the built-in playground.

<p align="center">
  <img src="public/screens/landing-light.png" alt="SupportAI landing page" width="49%" />
  <img src="public/screens/dashboard-dark.png" alt="SupportAI dashboard in dark mode" width="49%" />
</p>

## Contents

- [Why this stack is fully free](#why-this-stack-is-fully-free)
- [Features](#features)
- [Screenshots](#screenshots)
- [Design system](#design-system)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Embedding the chat widget](#embedding-the-chat-widget)
- [Public demo mode](#public-demo-mode)
- [Seeding a demo knowledge base](#seeding-a-demo-knowledge-base)
- [How the RAG pipeline works](#how-the-rag-pipeline-works)
- [API routes](#api-routes)
- [Testing](#testing)
- [Performance](#performance)
- [Project structure](#project-structure)
- [Deploying to Vercel](#deploying-to-vercel)
- [Known limitations](#known-limitations)
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

- **Auth & workspaces** — email/password sign-up, multi-tenant workspaces with owner/admin/member roles, and a two-step first-run wizard (workspace, then first assistant)
- **AI assistants** — multiple assistants per workspace, each with its own name, description, tone (friendly / professional / playful), custom instructions and widget colour, all editable from **Assistants → ⋯ → Edit settings**; owners and admins can delete them
- **Knowledge base** — paste text, import a URL, or drag in a PDF/DOCX/TXT/Markdown file; documents are chunked, embedded and indexed automatically and shared by every assistant in the workspace. Filter by status, search, hover a name for its details, click to read its passages
- **RAG chat playground** — streamed answers where every `[1]`, `[2]` marker is a chip: hover for the document and match strength, click to read it. A sources panel ranks the passages each answer was built from
- **Embeddable widget** — a single `<script>` tag drops a floating, brand-coloured chat bubble on any website, backed by the same RAG pipeline (copy it from **Assistants → Embed**)
- **Conversation history** — every playground and widget conversation with full transcripts, filters by status and channel, citation chips and the sources each answer retrieved
- **Dashboard & analytics** — a personal overview with KPIs (vs the previous period), a needs-attention list, per-assistant performance, the most cited documents and the **questions your docs didn't answer**; analytics adds a 7/30/90-day range, channel split and a weekday × hour heatmap. Every chart has a table view
- **Shell** — grouped sidebar with live hover cards, a command palette (Ctrl/⌘ K) for pages, assistants and documents, and notifications built from real workspace events
- **Team management** — invite by shareable link, change roles, revoke invites, remove members or leave, with a permissions table that matches the API's checks
- **Billing** — Starter / Pro / Agency plans with real Stripe Checkout + Customer Portal (test mode) or automatic demo-mode fallback
- **Public demo mode** — one-click "Try demo" into a seeded, read-mostly workspace with two assistants, twelve help docs, a month of conversations and analytics; destructive actions are locked, live chat is rate limited, and a daily cron resets it
- **Landing page** — a 3D scroll story of the RAG pipeline (CSS 3D transforms, so it runs in every browser without WebGL), live demos that run the real chunker, and only true numbers
- **Light, dark and system themes** — applied before first paint, switched with a circular reveal

## Screenshots

| | Light | Dark |
|---|---|---|
| Dashboard | ![Dashboard, light](public/screens/dashboard-light.png) | ![Dashboard, dark](public/screens/dashboard-dark.png) |
| Playground | ![Playground, light](public/screens/playground-light.png) | ![Playground, dark](public/screens/playground-dark.png) |
| Analytics | ![Analytics, light](public/screens/analytics-light.png) | ![Analytics, dark](public/screens/analytics-dark.png) |
| Landing (3D story) | ![Landing 3D, light](public/screens/landing-3d-light.png) | ![Landing 3D, dark](public/screens/landing-3d-dark.png) |

Regenerate them with `npm run screens` (needs a production build and the demo account; see [Testing](#testing)).

## Design system

- **Tokens:** every colour is a CSS variable in [`app/globals.css`](app/globals.css) with a light and a dark value (warm neutral surfaces, one terracotta accent, crimson for errors). Tailwind utilities read the variables, so one class works in both themes. `npm run check:contrast` checks every text/background pair against WCAG AA.
- **Charts:** a categorical order (terracotta, blue, plum) validated for colour-blind separation; single-series charts use the accent; every chart has a table view.
- **Type:** Schibsted Grotesk for headings, Inter for text, JetBrains Mono for labels and code.
- **Depth:** 1px borders, layered surfaces and small shadows, with an inset top highlight in dark mode.
- **Components:** [`components/ui/`](components/ui) — Button (press feedback via the Web Animations API, pointer input only), HoverCard (the one hover preview used everywhere), AnimatedNumber (counts up; the final value is always in `data-value`), Dialog/Sheet, Menu, Tabs, Segmented, form controls.
- **Motion:** page changes use React `<ViewTransition>`; lists rise in staggered (capped at 15); bars grow from their baseline; easing is expo-out, 150–450 ms; everything turns off with `prefers-reduced-motion`. The playground has no entry animations so chatting stays instant.

## Tech stack

- **Framework:** Next.js 16 (App Router, Route Handlers, `proxy.ts`), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4 with CSS-variable tokens, Radix primitives, `next-themes` for light/dark/system
- **3D & motion:** CSS 3D transforms for the landing scroll story (no WebGL, works on any GPU or driver), Lenis (landing only), Motion's `LazyMotion` (landing only), CSS + Web Animations API in the app
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
git clone <your-repo-url> support-ai
cd support-ai
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

# Optional: public demo account (see "Public demo mode")
# node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
DEMO_PASSWORD=""
CRON_SECRET=""
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
| `npm run typecheck` | `tsc --noEmit` (strict TypeScript) |
| `npm test` | Vitest unit and API route tests |
| `npm run test:e2e` | Playwright e2e + axe accessibility scans (after `npm run build`) |
| `npm run check:contrast` | WCAG AA check of every colour-token pair, light and dark |
| `npm run verify` | All of the above, in order |
| `npm run bundle:report` | First-load JS per route from a running production server |
| `npm run screens` | Regenerate the screenshots in `public/screens` |
| `npm run seed:demo` | Create or reset the public demo workspace (see [Public demo mode](#public-demo-mode)) |
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
| `STRIPE_ALLOW_LIVE_KEYS` | no | Live `sk_live_` keys are refused unless this is `true`; test mode is the default |
| `DEMO_PASSWORD` | for the demo | Random password of the shared demo account; "Try demo" signs in with it server-side |
| `CRON_SECRET` | for the demo | Protects `/api/cron/demo-reset`; Vercel Cron sends it automatically |
| `SEED_USER_EMAIL` | no | Account for `scripts/seed-knowledge-base.ts` if you don't pass one |

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
company page with the snippet already in place (pointed at the public demo assistant).
Point its `src` at your running app and set `data-assistant` to one of your assistant ids.
Or click **Widget** on any assistant card: `/widget-preview/[assistantId]` loads the real
widget on a sample website.

## Public demo mode

Visitors can click **Open the live demo** on the landing page or the login page and land
in a fully seeded workspace without signing up. The button posts to `/api/demo/login`,
which signs in to the shared account `demo@supportai.demo` on the server using
`DEMO_PASSWORD`, so the password never reaches the browser.

**What's seeded** ([`lib/demo/`](lib/demo)): an Agency-plan workspace with two assistants,
*Nimbus Help Bot* (a fictional project-management SaaS) and *Bloom & Co Support* (a fictional
skincare store), each with its own tone, prompt, brand colour and six Markdown help docs that
are chunked and embedded through the normal pipeline. There are also 30 conversations
(1-3 turns each, with citations) spread over the last 30 days, and two extra teammates. All
names, emails and domains are fictional (`.demo` / `.example`).

**Protections** (enforced in the API, shown in the UI as a friendly toast):

- Blocked for the demo account: deleting or editing assistants, adding/uploading/importing
  or deleting documents, changing workspace settings, inviting or removing teammates and
  changing roles, joining or creating other workspaces, Stripe checkout and the billing portal.
- Allowed: browsing everything, creating up to 6 assistants, and live chat in the playground
  and the widget, rate limited to **15 messages per hour per visitor** (by hashed IP) and
  300 per hour for the whole demo.
- Sign-up refuses the reserved `@supportai.demo` domain.

**Seeding and the daily reset.** `npm run seed:demo` (needs `DEMO_PASSWORD`) creates or resets
the demo. It only touches the `supportai-demo` workspace and the `@supportai.demo` users.
[`vercel.json`](vercel.json) schedules `GET /api/cron/demo-reset` daily at 05:00 UTC; it runs
the same reset, guarded by `CRON_SECRET`. Embeddings are reused: a document is only embedded
again if its seed text changes, so a normal reset makes no Gemini calls. To run a reset by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/demo-reset
```

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
   answer (when Google reports that model overloaded, the same request goes to
   `gemini-flash-lite-latest` instead of failing); the user message, the answer and its citations (document + similarity)
   are saved to the conversation.

## API routes

All routes except auth, `public/*` and the Stripe webhook require a session and
check workspace membership (and role where relevant).

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account |
| `POST` | `/api/workspaces` | Create a workspace |
| `GET` | `/api/workspaces/current` | Current workspace and role |
| `GET` | `/api/workspaces/[id]/summary` | Counts for the shell (assistants, documents by status, conversations today / 30 days / open, members, invites) |
| `GET` | `/api/workspaces/[id]/activity` | Real recent events for notifications (documents indexed or failed, website chats, teammates, invites) |
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
| `GET` | `/api/analytics?days=7|30|90` | Volume, previous-period comparison, most-cited documents and uncited questions (default 30 days) |
| `POST` | `/api/demo/login` | "Try demo": sign in to the demo account server-side |
| `GET` | `/api/cron/demo-reset` | Daily demo reset (Vercel Cron, `CRON_SECRET`) |
| `GET` | `/api/public/widget/embed.js` | The embeddable widget script |
| `POST` | `/api/public/widget/[assistantId]/chat` | Public widget chat (CORS, no auth) |
| `POST` | `/api/billing/checkout` | Stripe Checkout, or instant plan switch in demo mode |
| `POST` | `/api/billing/portal` | Stripe Customer Portal |
| `POST` | `/api/webhooks/stripe` | Stripe webhook receiver |

## Testing

```bash
npm run verify     # contrast, lint, typecheck, unit tests, build, e2e
```

- **Unit (Vitest):** analytics, activity, citation parsing, scene layouts, and the
  `/api/analytics`, `/api/workspaces/[id]/summary` and `/api/workspaces/[id]/activity`
  routes (sign-in, membership and workspace scoping), with Prisma mocked.
- **E2E (Playwright):** runs against a production build. Signed-in tests use the public
  demo account (`DEMO_PASSWORD` in `.env`) and **only read data**; dialogs are opened
  and cancelled, never submitted, and `/api/chat` is mocked so no Gemini calls are made.
- **Accessibility:** an axe WCAG 2.1 AA scan of every page and every dialog, menu and
  sheet, in both light and dark themes.
- Locally the suite uses the installed Google Chrome; in CI run
  `npx playwright install chromium` and set `CI=1`. It runs with 2 workers and one
  retry because every request goes to a remote database.

## Performance

First-load JavaScript per route (gzip), measured with `npm run bundle:report` against a
production build, before and after the redesign:

| Route | Before | After | Change |
|---|---|---|---|
| `/` | 255.9 kB | 272.3 kB | +16.4 kB |
| `/login` | 248.7 kB | 228.6 kB | -20.1 kB |
| `/signup` | 248.7 kB | 228.6 kB | -20.1 kB |
| `404 page` | 203.2 kB | 218 kB | +14.8 kB |
| `/dashboard` | 253.9 kB | 286.9 kB | +33 kB |
| `/assistants` | 257.6 kB | 287.2 kB | +29.6 kB |
| `/assistants/[id]/playground` | 373 kB | 405 kB | +32 kB |
| `/knowledge` | 258.3 kB | 287.4 kB | +29.1 kB |
| `/conversations` | 256.8 kB | 285.4 kB | +28.6 kB |
| `/analytics` | 363.7 kB | 285.7 kB | -78 kB |
| `/team` | 255.7 kB | 285 kB | +29.3 kB |
| `/billing` | 255 kB | 282.8 kB | +27.8 kB |
| `/settings` | 254.6 kB | 283.1 kB | +28.5 kB |

The app pages carry the new shell (command palette, hover cards, menus and dialogs); analytics is smaller because charts now load lazily, and sign-in is smaller because it no longer ships the old animation library.

- The landing story is CSS 3D (96 elements moved with `translate3d`/`rotate` in one
  animation-frame loop outside React), so it needs no WebGL and no 3D library download.
  It updates only while on screen, and a still image is in the server HTML until it mounts.
- Recharts loads with the first chart; the command palette loads on idle or on hover of
  the search button.
- Every page's code is prefetched while the browser is idle after sign-in, and hovering a
  nav item prefetches that page's data.

## Project structure

```
support-ai/
  app/
    page.tsx                     # Landing page
    login/, signup/              # Auth pages
    onboarding/                  # First-run workspace + assistant wizard
    invite/[token]/              # Team invite acceptance
    widget-preview/[assistantId]/ # Sample website running the real widget
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
    ui/                          # Design-system components (button, hover card, dialog, menu, …)
    dashboard/                   # Shell, Sidebar, Topbar, CommandPalette, Notifications, DocumentViewer
    data/                        # KPI tile, sparkline, bar list, heatmap, lazy trend chart
    landing/                     # Landing sections, scroll story, demos
      scene/                     # CSS 3D scene: stage layouts, content, renderer
    layout/, brand/, auth/       # Standalone-page layout, logo, sign-in form
    theme-toggle.tsx             # Light / dark / system with circular reveal
  lib/
    rag.ts                       # Ingest, retrieve, RAG prompt, citations
    gemini.ts                    # Chat model + embeddings
    chunker.ts, parse-file.ts    # Chunking and PDF/DOCX/TXT/MD extraction
    chat.ts                      # Shared chat-route helpers (history caps, conversation ownership)
    queries.ts                   # Shared TanStack Query definitions (also used for hover prefetch)
    analytics.ts, analytics-view.ts # Analytics derivations (server + client), unit tested
    activity.ts, citations.ts, plans.ts, press.ts
    demo/                        # Demo seed content, reset, rate limit
    prisma.ts, auth.ts, auth.config.ts, session.ts, workspace.ts, stripe.ts, utils.ts
    hooks/                       # TanStack Query hooks
  prisma/schema.prisma           # Data model (users, workspaces, assistants, documents,
                                 # vector chunks, conversations, messages, invites)
  prisma/seed-demo.ts            # `npm run seed:demo`
  vercel.json                    # Daily demo-reset cron
  scripts/
    seed-knowledge-base.ts, check-seed.ts
    demo-docs/                   # Four demo help-centre documents
    test-site.html               # Mock website for testing the widget
    check-contrast.mjs, bundle-report.mjs, screens.mjs
  tests/unit/, tests/e2e/        # Vitest and Playwright suites
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
5. For the public demo, add `DEMO_PASSWORD` and `CRON_SECRET`, run `npm run seed:demo`
   once against the production database (with the same `DEMO_PASSWORD`), and the cron in
   `vercel.json` keeps it fresh. The cron can also create the demo from scratch on first run.
6. Use your **production** domain in the widget snippet. Per-deployment preview URLs
   are usually behind Vercel Deployment Protection, so a widget pointed at one will
   fail on other websites.

## Known limitations

- **Plan limits are not enforced.** Assistant, document and message quotas on the
  pricing table are plan copy; the API does not cap them.
- **The public widget endpoint is only rate limited for the demo assistants.** For
  your own assistants, anyone with an assistant id can send messages, and each one
  costs a Gemini call. Add rate limiting before real production use.
- **The widget shows only inline `[n]` markers.** The playground and Conversations
  show each citation's document and match strength; the embeddable widget does not.
- **Live conversations are never marked resolved.** Conversations have a `resolved`
  flag that analytics counts (the demo data sets it), but nothing in the app sets it yet.
- **Ingestion is synchronous.** A large document is chunked and embedded inside the
  request; on Vercel, uploads are also limited by the 4.5 MB request body cap.
- **URL import is basic.** The page is fetched server-side and HTML tags are
  stripped; JavaScript-rendered pages may come back nearly empty.

## License

MIT — do whatever you want with it.
