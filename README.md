# K-KUT — Independent

> **K-KUT** is a G Putnam Music invention. Own an exact excerpt of a song section — legally, permanently, and playably.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Styling | Tailwind CSS |
| Backend / DB | [Supabase](https://supabase.com) (PostgreSQL + Edge Functions + Storage) |
| Hosting | [Vercel](https://vercel.com) |
| Analytics | [Vercel Web Analytics](https://vercel.com/analytics) |

---

## Local development

### Prerequisites
- Node.js 20+
- npm 10+

### 1 — Clone and install

```bash
git clone https://github.com/mmmm013/k-kut-independent.git
cd k-kut-independent
npm install --legacy-peer-deps
```

### 2 — Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the real values from your Supabase project:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project → Settings → API → `service_role` key (**server-only, never expose to browser**) |

### 3 — Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

### First-time setup

1. Push this repo to GitHub (already done).
2. Go to [vercel.com/new](https://vercel.com/new) and import `mmmm013/k-kut-independent`.
3. Leave the **Framework Preset** as **Next.js** and the **Root Directory** as `./`.
4. **Before clicking Deploy**, add the environment variables (see next section).
5. Click **Deploy**.

### Setting environment variables in Vercel

1. Open your Vercel project.
2. Go to **Settings → Environment Variables**.
3. Add each variable listed in `.env.example` with real values:

   | Variable | Environments |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production only (server-side scripts) |

4. Click **Save**, then go to **Deployments** and redeploy.

> **Note:** If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, the prebuild check will fail with a clear message (no secrets are logged).

### Connecting a custom domain

1. Vercel project → **Settings → Domains**.
2. Add `k-kut.com` (and `www.k-kut.com`).
3. Follow the DNS instructions Vercel shows (usually an `A` record or CNAME).
4. Vercel will provision a free TLS certificate automatically.

---

## Database migrations

This project uses Supabase for the database. Migrations live in `supabase/migrations/` (if present).

### Safe migration workflow (no broken deploys)

1. **Write backward-compatible migrations** — add columns/tables rather than dropping or renaming while the old code is still deployed.
2. Push migrations **before** deploying the Next.js code that depends on them.
3. Use the Supabase Dashboard SQL editor for one-off changes, or:

```bash
# Link to your project (one-time)
supabase link --project-ref <your-project-ref>

# Preview what would run
supabase db push --dry-run

# Apply migrations
supabase db push
```

> **Tip:** If the Supabase CLI fails to parse `.env.local`, check for backslashes or special characters in variable values. Use plain ASCII values or quote them.

---

## Analytics

[Vercel Web Analytics](https://vercel.com/analytics) is installed via `@vercel/analytics`.

- `<Analytics />` is rendered in `app/layout.tsx` (runs on every page).
- Enable it in your Vercel project under **Analytics → Enable**.
- Real-time visitor data appears within ~60 seconds of the first pageview.

---

## Build audio manifest (optional)

The `scripts/build-audio-manifest.mjs` script lists all MP3s in the Supabase Storage `tracks` bucket and writes `audio-manifest.json`. Run it manually — it is **not** part of the normal Next.js build.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> \
node scripts/build-audio-manifest.mjs
```

---

## Environment variable reference

See [`.env.example`](.env.example) for the full list with descriptions.
