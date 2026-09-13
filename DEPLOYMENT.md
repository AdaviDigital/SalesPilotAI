# Deploying SalesPilot AI

The same source code deploys to Vercel, Render, or Hostinger Business
Hosting without any application-logic changes. What changes between
platforms is only **how you invoke the build/start commands and where you
point environment variables** — never the code in `/server` or `/client`.

The backend is a plain Node.js/Express process. The frontend is a plain
static build (Vite output). Neither depends on a platform-specific runtime,
serverless function format, or proprietary storage/database service.

---

## 1. Database (required first, same for every target)

Provision a standard PostgreSQL database from any provider:

- [Neon](https://neon.tech) (serverless Postgres, generous free tier)
- [Supabase](https://supabase.com)
- Render's managed Postgres
- Railway
- A self-hosted/Hostinger-provided Postgres instance

Copy the connection string into `DATABASE_URL`. Then, from `/server`:

```bash
npm run db:migrate   # applies migrations (prisma migrate deploy)
npm run db:seed      # optional demo data
```

---

## 2. Vercel

Vercel is used here purely as a **static host for the frontend** plus a
place to run the backend as a **conventional long-running Node process**
via a custom server entry — not Vercel Edge/serverless functions, per the
portability requirement.

**Frontend (`/client`):**
1. New Project → root directory `client`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set `VITE`-consumed env at build time if you introduce any; currently the
   client talks to `/api`, so set up a rewrite (`vercel.json`) or point
   `client/vite.config.ts`'s dev proxy target at your deployed API URL for
   local dev, and configure the production API base via a reverse proxy or
   by hosting the API on a separate Vercel project / Render / your own VM.

**Backend (`/server`):** Vercel's Node "serverless functions" model doesn't
suit a long-running Express app with in-process rate limiting and DB
pooling well. Recommended: deploy `/server` to **Render** (below) and point
the Vercel-hosted frontend's `/api` calls at that URL via `CORS_ORIGIN` +
an `VITE`/runtime API base, OR use Vercel's "Other" framework preset with a
custom build that runs `node dist/index.js` behind Vercel's Node runtime if
your plan supports persistent Node processes.

---

## 3. Render

Render is the most direct fit for the Express backend as-is.

**Backend — Web Service:**
1. New → Web Service → connect the repo, root directory `server`.
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Environment variables: copy every key from `.env.example`, using your
   real `DATABASE_URL`, generated `JWT_SECRET`/`SESSION_SECRET`, and
   `CORS_ORIGIN` set to your frontend's URL.
5. Health check path: `/api/health`.

**Frontend — Static Site:**
1. New → Static Site, root directory `client`.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Add a rewrite rule so `/api/*` proxies to your Render backend URL (Render
   Static Sites support rewrites in `render.yaml` or the dashboard).

**Database:** Render's managed Postgres works as-is — just paste its
connection string into `DATABASE_URL`.

**Scheduled jobs (automation inactivity sweep):** Add a Render Cron Job
that calls `POST /api/automation/run-inactivity-check` (with a service
auth token) on whatever cadence you want deals checked.

---

## 4. Hostinger Business Hosting

Hostinger Business Hosting supports Node.js applications through hPanel's
"Setup Node.js App" tool.

**Backend:**
1. In hPanel → Advanced → Node.js, create an application pointed at the
   `server` directory, Node version 18+.
2. Set the startup file to `dist/index.js`.
3. Run `npm install && npm run build` via the provided SSH/terminal access
   (or Hostinger's build hook if available).
4. Set every `.env.example` variable in the Node.js app's environment
   variables panel.
5. Start/restart the app from hPanel.

**Frontend:**
1. Run `npm run build` in `client` locally or via SSH.
2. Upload the contents of `client/dist` to `public_html` (or a subdomain's
   document root) via File Manager or FTP.
3. Point `/api` requests at your Node app's assigned port/domain — Hostinger
   typically proxies the Node app to a subdomain; configure the client's
   API base accordingly, or add an `.htaccess` proxy rule if using Apache
   in front of the Node app.

**Database:** if Hostinger's plan includes PostgreSQL, use its connection
string directly. Otherwise use any of the external Postgres providers
listed in step 1 — Hostinger only needs outbound network access, which
conventional Node hosting provides.

---

## 5. What never changes between targets

- `server/src/**` — no `req.headers['x-vercel-*']`, no Vercel KV/Blob, no
  Edge-only APIs, no Firebase/Supabase-specific SDK calls in business logic.
- `client/src/**` — plain Vite/React, builds to static `dist/`.
- Database access — always through `DATABASE_URL` via Prisma.
- File storage — always through the `StorageProvider` abstraction
  (`STORAGE_PROVIDER=local|s3`); switching hosts never requires touching a
  controller or service.
- AI provider — always through the `AIProvider` abstraction
  (`AI_PROVIDER=openai|anthropic|google|none`).

If a deployment step ever asks you to add platform-specific code to
`server/src` or `client/src` to make something work, that's a sign to
reach for an environment variable or a reverse-proxy/rewrite rule instead —
not a code change.
