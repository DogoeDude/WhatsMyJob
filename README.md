# WhatsMyJob

Job discovery platform with real authentication (Neon Postgres + Better Auth).

## Setup

### 1. Neon database

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **connection string** (PostgreSQL, with `?sslmode=require`).

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."   # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database schema

```bash
npm run db:push
npm run db:generate
```

### 4. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth

- **Register** at `/register` — creates a `user` role account.
- **Sign in** at `/login` — one form; admins are sent to `/admin`, members to `/` (or a safe callback like `/analytics`).
- **Admin routes** (`/admin`) require `role = admin` on your user.

### Create an admin user

1. Register a normal account with your email.
2. Promote it:

```bash
npm run make-admin -- your@email.com
```

3. Sign in at `/login` — you will land on `/admin` automatically.

## Job listings (APIs)

Listings are synced into Postgres from **public job board APIs** (not scraping):

| Source | Keys required | Notes |
|--------|---------------|--------|
| [Remotive](https://remotive.com/api/remote-jobs) | No | Remote tech jobs |
| [Arbeitnow](https://www.arbeitnow.com/api/job-board-api) | No | EU / remote friendly |
| [Jobicy](https://jobicy.com/api/v2/remote-jobs) | No | Remote jobs (50 per fetch) |
| [RemoteOK](https://remoteok.com/api) | No | Remote jobs |
| [RemoteJobs.org](https://remotejobs.org/api/v1/jobs) | No | Remote jobs (paginated) |
| [Career Nest](https://careernest.cloud/api-docs) | No | Global feed (paginated) |
| **[JSearch](https://www.openwebninja.com/api/jsearch)** | **`JSEARCH_API_KEY` or `RAPIDAPI_KEY`** | **Google for Jobs — set `JSEARCH_COUNTRIES=ph,us` for Philippines + US** |
| **[Reed](https://www.reed.co.uk/developers)** | **`REED_API_KEY`** | **UK job board (optional)** |
| [Adzuna](https://developer.adzuna.com/) | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | US / SG / UK / EU — no PH feed; use `ADZUNA_COUNTRIES=us,sg` |

The home page loads **live API results** when the database is empty. After sync, listings are served from Postgres.

### Recommended setup (`.env.local`)

```env
JSEARCH_API_KEY=your_key
JSEARCH_COUNTRIES=ph,us
ADZUNA_APP_ID=your_id
ADZUNA_APP_KEY=your_key
ADZUNA_COUNTRIES=us,sg
```

**Philippines:** JSearch with `country=ph` is the main source. Adzuna does not support PH; `sg` adds nearby regional listings.

Restart dev server, then **Admin → Sync all sources**.

### Job filters (API)

`GET /api/jobs` supports:

| Param | Example | Description |
|-------|---------|-------------|
| `q` | `?q=react` | Search title, company, location, description |
| `source` | `?source=remotive` | Filter by job board (repeat or comma-separated) |
| `type` | `?type=remote` | Job type contains |
| `location` | `?location=USA` | Location contains |
| `limit` | `?limit=50` | Max results (default 150) |

### First sync

1. Apply schema: `npm run db:push`
2. **Stop the dev server**, then: `npm run db:generate` (fixes Prisma client / “Failed to load jobs”)
3. `npm run dev` → sign in as admin → **Admin** → **Sync all sources**
4. Open **Jobs** (`/`) — live APIs work immediately; sync stores them in Neon

Optional Adzuna vars in `.env.local` — see `.env.example`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Apply Prisma schema to Neon |
| `npm run db:studio` | Open Prisma Studio |
| `npm run make-admin` | Promote user to admin by email |
