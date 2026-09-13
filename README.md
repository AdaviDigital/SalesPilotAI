# SalesPilot AI

An AI-powered Sales & CRM SaaS platform — lead management, sales pipeline,
deal intelligence, forecasting, an AI sales assistant with tool-calling,
sales automation, analytics, and multi-tenant team collaboration.

## Architecture

- **Frontend** (`/client`): React + TypeScript + Vite + Tailwind CSS. Builds
  to a plain static `dist/` — no framework-specific server required.
- **Backend** (`/server`): Node.js + TypeScript + Express, REST API. Runs as
  a conventional Node process — no serverless/edge-runtime dependency.
- **Database**: PostgreSQL via Prisma ORM, connected entirely through
  `DATABASE_URL`. Works with Neon, Supabase, Render Postgres, Railway,
  Hostinger-compatible Postgres, or self-hosted.
- **Storage**: pluggable abstraction (`STORAGE_PROVIDER=local|s3`) —
  local disk for development, any S3-compatible provider (AWS S3,
  Cloudflare R2, Backblaze B2, MinIO) for production.
- **AI**: pluggable abstraction (`AI_PROVIDER=openai|anthropic|google|none`).
  Every AI feature (lead scoring, deal intelligence, forecasting, email
  generation, customer summaries, conversation analysis, the chat
  assistant) degrades gracefully to a working demo mode with zero AI keys
  configured — AI is an enhancement, never a single point of failure.
- **Billing**: pluggable abstraction (`BILLING_PROVIDER=stripe|paystack|flutterwave|none`)
  with plan limits and usage tracking wired in; checkout/webhook
  integration is a drop-in addition once you pick a processor.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for how the exact same codebase
deploys to Vercel, Render, and Hostinger Business Hosting.

## Requirements

- Node.js 18.18+
- A PostgreSQL database (local via Docker, or any hosted provider)

## Installation

```bash
npm install
cp .env.example server/.env   # then fill in DATABASE_URL, JWT_SECRET, SESSION_SECRET
```

Generate strong secrets:

```bash
openssl rand -base64 48
```

## Database setup

```bash
npm run db:generate   # generate the Prisma client
npm run db:migrate    # apply migrations
npm run db:seed       # optional: demo organization + leads
```

Demo login after seeding: `owner@demo.salespilot.ai` / `DemoPass123!`

## Development

```bash
npm run dev   # runs client (5173) and server (4000) concurrently
```

Open http://localhost:5173.

## Production build

```bash
npm run build
npm run start   # starts the server; serve client/dist as a static site
```

## Testing

```bash
npm run test       # server unit tests (vitest) + client unit tests
npm run test:e2e   # Playwright end-to-end tests (requires a running dev server + seeded DB)
```

## Docker (local development)

```bash
docker compose up --build
```

Spins up Postgres, the API, and the client. Not required for production —
see DEPLOYMENT.md for platform-native deployment.

## Environment variables

See [`.env.example`](./.env.example) for the full list, grouped by concern
(core, AI provider, storage, email, billing). None are required beyond
`DATABASE_URL`, `JWT_SECRET`, and `SESSION_SECRET` to run the CRM —
everything else (AI, S3 storage, email, billing) is optional and the app
runs in a sensible demo/fallback mode without it.

## Project structure

```
server/
  src/
    config/        env, prisma client, logger
    controllers/    request handlers
    services/       business logic
    repositories/   tenant-scoped Prisma queries
    routes/         Express routers, mounted under /api
    middleware/     auth, tenant isolation, error handling, rate limiting
    schemas/        Zod validation
    ai/             AI provider abstraction, tools, scoring, forecasting, chat
    billing/        billing provider abstraction, plan limits
    storage/        storage provider abstraction (local/S3)
  prisma/           schema.prisma, seed.ts

client/
  src/
    pages/          route-level screens
    layouts/        app shell
    components/     shared UI
    hooks/          useAuth, etc.
    lib/            API client
```

Every CRM module (leads, contacts, companies, deals, tasks, activities)
follows the same **repository → service → controller → routes** pattern —
see `server/src/{repositories,services,controllers,routes}/lead.*` as the
reference implementation.

## Multi-tenancy & security

- Every tenant-scoped query is filtered by `organizationId` at the
  repository layer, not just the route layer.
- JWT-based auth with bcrypt password hashing, rate-limited auth endpoints,
  helmet security headers, centralized error handling that never leaks
  stack traces in production, and an audit log covering logins, CRUD on
  core entities, billing changes, and AI actions.
- AI tool-calling is scoped server-side: the model can request a tool, but
  every tool executor takes `organizationId`/`userId` from the
  authenticated request context, never from model-supplied arguments —
  this is what prevents cross-tenant data access even under prompt
  injection from CRM record content.

## What's implemented vs. scaffolded

Fully implemented: auth (incl. email verification, password reset), leads,
contacts, companies, deals, pipelines/Kanban, tasks, activities, calendar,
analytics, report builder, the full AI layer (scoring, deal intelligence,
forecasting, email assistant, customer summaries, conversation analysis,
chat with tool-calling), automation engine, notifications, billing
(subscription/usage/plan-limits, processor integration pending your
choice of Stripe/Paystack/Flutterwave), organization/user settings.

Scaffolded, not yet built: file uploads (the storage abstraction is ready;
the multipart upload endpoint is not wired), the public marketing/landing
page, OpenAPI/Swagger docs, OAuth/SSO/MFA (auth architecture supports
adding these).
