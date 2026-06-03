# WhatsMyJob

Search remote and on-site roles from multiple public job boards in one place. Browse with filters and categories, open full descriptions in a split view, and apply on the original listing.

Built with **Next.js**, **Neon Postgres**, and **Better Auth**.

---

## Features

- **Multi-source search** — Remotive, Arbeitnow, Jobicy, RemoteOK, and more (see [Job sources](#job-sources))
- **Split-pane UI** — Job list, filters sidebar, and detail panel that fill the viewport
- **Search & filters** — Title, company, location, job type, category, and source
- **Live + cached listings** — Live APIs when the DB is empty; faster reads from Postgres after sync
- **Company logos** — Resolved from provider data, direct URLs, or favicon fallbacks
- **Auth** — Register, sign in, role-based access (`user` / `admin`)
- **Admin sync** — Pull all configured sources into Neon from `/admin`
- **Analytics** — Signed-in stats at `/analytics` (when enabled)

---

## Tech stack

| Layer | Tools |
|--------|--------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| UI | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/) |
| Database | [Neon](https://neon.tech) Postgres + [Prisma](https://www.prisma.io/) |
| Auth | [Better Auth](https://www.better-auth.com/) |

---

## Quick start

```bash
git clone https://github.com/DogoeDude/WhatsMyJob.git
cd WhatsMyJob
npm install
cp .env.example .env.local   # then edit values
npm run db:push
npm run db:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Tip:** Several sources work with no API keys. Add [JSearch](#recommended-env-for-philippines--us) for Google-for-Jobs coverage (e.g. Philippines + US).

---

## Setup (step by step)

### 1. Database (Neon)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **PostgreSQL connection string** (include `?sslmode=require`).

### 2. Environment variables

Copy `.env.example` to `.env.local` and set at minimum:

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."          # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

See `.env.example` for optional job API keys.

### 3. Schema & Prisma client

```bash
npm run db:push
npm run db:generate
```

If `db:generate` fails on Windows with a file-lock error, stop the dev server and run it again.

### 4. Run locally

```bash
npm run dev
```

### 5. First data load

1. Register at `/register`, then promote yourself (see [Admin access](#admin-access)).
2. Sign in → **Admin** → **Sync all sources**.
3. Open **Jobs** (`/`) — listings appear from the DB; use **Refresh** for live API results.

---

## Admin access

| Step | Action |
|------|--------|
| 1 | Register at `/register` (default role: `user`) |
| 2 | Run `npm run make-admin -- your@email.com` |
| 3 | Sign in at `/login` — admins are redirected to `/admin` |

`/admin` and sync APIs require `role = admin`.

---

## Job sources

Listings are ingested via **official public APIs** (not HTML scraping).

| Source | API keys | Notes |
|--------|----------|--------|
| [Remotive](https://remotive.com/api/remote-jobs) | — | Remote tech |
| [Arbeitnow](https://www.arbeitnow.com/api/job-board-api) | — | EU / remote friendly |
| [Jobicy](https://jobicy.com/api/v2/remote-jobs) | — | Remote (50 per fetch) |
| [RemoteOK](https://remoteok.com/api) | — | Remote |
| [RemoteJobs.org](https://remotejobs.org/api/v1/jobs) | — | Paginated remote |
| [Career Nest](https://careernest.cloud/api-docs) | — | Global feed |
| [JSearch](https://www.openwebninja.com/api/jsearch) | `JSEARCH_API_KEY` or `RAPIDAPI_KEY` | Google for Jobs aggregator |
| [Reed](https://www.reed.co.uk/developers) | `REED_API_KEY` | UK (optional) |
| [Adzuna](https://developer.adzuna.com/) | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | US / SG / UK / EU (no PH) |

**Behavior:** If Neon has no rows, the app can show **live** results from providers. After **Sync all sources**, the home page prefers the database for speed; **Refresh** on the jobs UI requests live data again.

### Recommended env for Philippines + US

```env
JSEARCH_API_KEY=your_key
JSEARCH_COUNTRIES=ph,us
ADZUNA_APP_ID=your_id
ADZUNA_APP_KEY=your_key
ADZUNA_COUNTRIES=us,sg
```

Philippines-focused search relies mainly on **JSearch** (`country=ph`). Adzuna has no PH feed; `sg` adds regional listings.

---

## Jobs API

`GET /api/jobs`

| Parameter | Example | Description |
|-----------|---------|-------------|
| `q` | `?q=react` | Search title, company, location, description |
| `source` | `?source=remotive` | Filter by board (repeat or comma-separated) |
| `type` | `?type=remote` | Job type (substring) |
| `location` | `?location=Manila` | Location (substring) |
| `category` | `?category=it` | Category id |
| `limit` | `?limit=50` | Page size |
| `offset` | `?offset=50` | Pagination |
| `refresh` | `?refresh=1` | Prefer live provider fetch |

Other routes: `GET /api/jobs/[id]`, `POST /api/jobs/sync` (admin), `GET /api/jobs/stats`, etc.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply Prisma schema to Neon |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run make-admin` | Promote user to admin by email |
| `npm run test:jobs` | Test job provider fetch (requires `.env.local`) |

---

## Project layout

```
app/
  page.tsx              # Jobs home (split view)
  admin/                # Sync dashboard
  analytics/            # Stats (auth)
  login/ register/       # Auth pages
  api/jobs/             # Listings, sync, detail
components/
  jobs-home.tsx         # Main jobs UI
  jobs-sidebar.tsx      # Search & filters
  job-detail-panel.tsx  # Detail pane
lib/jobs/               # Providers, query, sync, logos
prisma/schema.prisma    # Database models
scripts/                # make-admin, test-providers
```

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| **Failed to load jobs** / Prisma errors | Stop dev server → `npm run db:generate` → restart |
| **Only one source on page 1** | Use **Refresh** or run admin sync; mixed ordering is applied in the service layer |
| **Letter avatars instead of logos** | Logos use direct URLs + favicon fallback; some boards block server-side image fetch |
| **Stale listings** | Admin **Sync all sources** or jobs UI **Refresh** (`refresh=1`) |
| **Push rejected on GitHub** | `git pull --rebase origin main` then `git push` |

---

## License

Private project — all rights reserved unless stated otherwise.
