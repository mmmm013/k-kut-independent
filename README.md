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

## The KUT Family (KF)

Every delivery unit G Putnam Music issues against a PIX (master track) belongs to
one of four unit types. They share one gate, one classifier and one inventory.

| Unit | What it is | Table | Player |
|---|---|---|---|
| **KUT** | Exact contiguous section audio, original order (ASCAP rule) | `k_kut_assets` + `k_kut_codes` | `/k/[code_id]` |
| **mK** | mini-KUT text micro-assets, audio resolved from the parent KUT | `m_kut_assets` | `/mkut/[id]` |
| **LLF** | LineFeel — a single lyric line delivered as audio | `llf_assets` | `/llf/[id]` |
| **KUPID** | K-kUpId — a KUT curated and signed for a romance level | `kupid_assets` | `/kupid/[id]` |

### The gate

A unit is playable only when **all** of these hold:

1. `audio_qc_status = 'pass'` — the silo gate. Nothing leaves the silo before QC.
2. Its audio URL is an approved delivery render, never PIX / source / full-track audio.
3. A KUT additionally needs an **active** row in `k_kut_codes`.

The gate is enforced in three independent places, so bypassing one is not enough:

- **Write time** — `CHECK` constraints backed by `public.kf_is_forbidden_source_url()`,
  plus `approved_for_hug` requiring a QC pass.
- **Delivery** — `public.k_kuts`, the KUT SSOT that HUG reads, contains QC-passed
  units only.
- **Render** — `lib/kf/classify.ts` and `lib/kf/inventory.ts`, shared by every route.

### Themes — and what "satisfied" means

A unit also carries one of seven **themes**, the same seven the home page routes
a fan through:

`love` · `apology` · `gratitude` · `energy` · `hurt` · `hope` · `peace`

> A theme is **satisfied** when it has at least one **playable** unit in
> **every** container.

Playable, not merely present: QC passed, approved delivery audio, and for a
K-KUT an active code. A theme backed only by units held at the gate is *not*
satisfied — reporting it as satisfied would hide exactly the work that remains.

Coverage is computed in two places, to the same definition:

- `lib/kf/inventory.ts` → the `coverage` and `satisfied_themes` fields on
  `/api/kf/inventory`, and the matrix at the top of `/kf`.
- `public.kf_theme_coverage` → the same answer in SQL, for reporting.

An untagged unit reads as `null`, never as a guess. A gap shows as a zero.

### Surfaces

| Route | What it shows |
|---|---|
| `/kf` | **Reference only, off by default.** Theme coverage matrix + the whole KUT Family inventory. Filters: `?pix=`, `?type=KUT\|mK\|LLF\|KUPID`, `?theme=love\|apology\|…`. |
| `/pix/[id]` | One PIX's inventory, all four unit types, in canonical section order. |
| `/api/kf/inventory` | The same data as JSON. Anon key, so RLS decides visibility. |
| `/api/hug/[id]` | HUG delivery. Service role, reads the `k_kuts` SSOT, blocks source audio. |
| `/api/bot/moments` | Public-safe moment feed for the bot. |

Units that fail the gate are **listed but not playable**, with the reason shown.
Hiding them would make the inventory look complete when it is not.

---

## Tests

```bash
npm test        # KUT Family classification + inventory gate tests
npm run typecheck
```

`npm test` compiles `lib/kf` with `tsconfig.test.json` and runs Node's built-in
test runner against the output — no test framework to install.

---

## Database migrations

> **The KUT Family schema is not deployed.** It was moved to
> `reference/NOT-DEPLOYED/kf-schema/` because `supabase/migrations/` is the
> Supabase CLI's scan path and these files are unsafe against the live project.
> Read `reference/NOT-DEPLOYED/README.md` before touching any of it.

This project uses Supabase for the database.

```
supabase/
  migrations/
    20260921000100_kut_family_schema.sql   tables, indexes, source-audio CHECK constraints
    20260921000200_k_kuts_ssot_view.sql    public.k_kuts — the KUT SSOT HUG delivery reads
    20260921000300_kut_family_rls.sql      RLS policies and grants
    20260921000400_kut_family_themes.sql   themes on every container + kf_theme_coverage
  seed.sql                                 local-dev sample data (NOT run by `db push`)
```

All three migrations are idempotent — re-applying them is a no-op — so they are
safe to run ahead of the deploy that needs them.

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

To load the sample PIX — all seven themes in all four containers, so every
theme reads as satisfied, plus a few units deliberately held at the gate —
**locally**:

```bash
supabase db reset   # runs the migrations, then supabase/seed.sql
```

> `supabase/seed.sql` is sample data for local development. `supabase db push`
> does not run it, and it should never be run against production.

Check coverage at any time:

```sql
select * from public.kf_theme_coverage;
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
