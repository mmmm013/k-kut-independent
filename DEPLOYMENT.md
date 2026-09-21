# Deployment readiness — what blocks full launch

> ## ⛔ STOP — DO NOT RUN `supabase db push` AGAINST THE LIVE PROJECT
>
> Added 2026-09-21 after reading the owner's Current-II Authority map and the
> BLK/KK text-generation freeze. **The migrations in this repo were written
> against an empty database and are unsafe against project `vwlzubxshjjonabpeagd`.**
>
> | Live object | Reality | What our migrations would do |
> |---|---|---|
> | `k_kuts` | a **table** with 42,971 rows (legacy candidate corpus, held outside public authority) | migrations 200/400/600 `drop view if exists public.k_kuts` then create a view of that name — this **errors on a table**, aborting mid-run and leaving partial schema |
> | `m_kut_assets` | **34,251 live rows** | migrations 400/500 `ALTER` it, adding columns to production data |
> | `llf_assets` | unknown | migration 600 issues `drop table ... cascade` |
>
> **A `BLK/KK text generation` freeze is ACTIVE** (`ACTIVE_OWNER_AUTHORIZED_FREEZE`,
> effective 2026-08-30). It blocks mass candidate creation and automated
> promotion. `supabase/seed.sql` creates mass candidates and is squarely inside
> the blocked scope. All four unlock prerequisites are `DRAFT_PENDING_OWNER_LOCK`.
>
> **The governed catalog authorizes ZERO public IIs** — 2 canary records, both
> `TRIAGE`, `0 STAGE`. The storefront correctly offers nothing.
>
> Nothing here may be applied until the owner's own sequence runs: prepare and
> test in a rollback-only transaction, then separate explicit authorization.

Status as of the KUT Family inventory work. Each item below was **verified
against the code or a real PostgreSQL 16**, not assumed. Ordered by what stops
money and delivery first.

---

## 1. BLOCKER — the current catalog audio cannot be a delivery unit

**This is the one that stops real inventory from existing.**

Every audio file the app plays today lives in the Supabase Storage bucket named
`tracks`:

- `app/page.tsx:24` — `SB_TRACKS = .../storage/v1/object/public/tracks`
- `app/k/[id]/page.tsx:28` — `BASE_TRACKS`, the same bucket

The KUT SSOT safety rule rejects any URL containing `/tracks/`, `pix`, `source`,
`flagship` or `full`. So the existing files are rejected three ways:

| Layer | Result |
|---|---|
| `INSERT` into any asset table | `CHECK` constraint `*_audio_not_source` rejects the row |
| `/api/hug/[id]` | `FORBIDDEN_SOURCE_AUDIO` |
| `/kf`, `/pix/[id]` | listed but never playable |

Verified:

```
select public.kf_is_forbidden_source_url(
  'https://abc.supabase.co/storage/v1/object/public/tracks/kleigh--solace.mp3');
 → t   (blocked)

insert into public.k_kut_assets (... kut_audio_url ...) values (... same url ...);
 → ERROR: violates check constraint "k_kut_assets_audio_not_source"
```

**Fix — pick one, then it unblocks:**

1. **Recommended.** Create a second public bucket for approved renders, e.g.
   `kut-renders`. Cut the section audio into it. `tracks` stays the private
   source-of-truth vault; `kut-renders` holds only delivery units. This is what
   the gate was designed to express and what `supabase/seed.sql` assumes.
2. Rename the delivery bucket to something not on the blocklist and re-point
   `SB_TRACKS` / `BASE_TRACKS`.
3. Narrow the rule in `lib/kf/classify.ts` and
   `public.kf_is_forbidden_source_url()`. **Not recommended** — `/tracks/` is
   on the list precisely because that bucket holds full masters.

> Until this is resolved, no real K-KUT, mK, LLF or K-kUpId row can be stored,
> so the inventory stays empty no matter what else ships.

---

## 2. BLOCKER — nothing can take money

`startCheckout()` (`app/page.tsx:456`) does not charge anything. It redirects:

```js
window.location.href = `/k/${selectedItem.id}`;   // or /mkut/...
```

There is no payment provider, no order table, no receipt, no entitlement check.
The word "purchase" appears in the UI copy and in `app/terms/page.tsx`, but no
code implements it.

**Needed for income:**

- A payment provider (Stripe Checkout is the shortest path) and its webhook.
- An `orders` / `entitlements` table keyed to a `k_kut_codes` row.
- Code issuance on successful payment — today `k_kut_codes.status = 'active'`
  is set by hand, and an active code is all `/k/[id]` requires.
- `/k/[id]` should verify entitlement rather than play on possession of a URL.

---

## 3. BLOCKER — two edge functions are called but not in this repo

| Called from | Function |
|---|---|
| `app/k/[id]/page.tsx:94` | `play-k-kut` |
| `app/mkut/[id]/page.tsx:59` | `play-m-kut` |

Neither exists under `supabase/functions/`. K-KUT playback only works today via
the hardcoded `CATALOG_AUDIO` map (`app/k/[id]/page.tsx:36`); any real code
redemption falls through to the edge function and fails.

**Fix:** write and deploy both, and check them into `supabase/functions/` so
they are versioned with the schema they depend on.

---

## 4. SECURITY — `/admin/play` is public

`app/admin/play/page.tsx` has no authentication, no session check and no role
check. It is reachable by anyone who guesses the path once deployed.

**Fix:** put it behind Supabase Auth with a role check, or behind middleware,
or remove it from the production build.

---

## 5. Migrations are not applied yet

The four migrations in `supabase/migrations/` have been verified against a
local PostgreSQL 16 but not applied to the hosted project. Until they are,
every KUT Family table is missing and `/kf` reports the whole inventory as
unavailable.

> **To confirm in one request**, open the deployed preview and load
> `/api/kf/inventory`. If `unavailable` lists all four tables, the migrations
> have not landed yet. If it comes back with counts, they have.

**Superseded — see the STOP notice at the top of this file.** These migrations
must not be pushed to `vwlzubxshjjonabpeagd`. They assume an empty database;
the live project already holds the legacy corpus they would collide with.

---

## 6. Environment variables — Preview confirmed, Production unverified

`scripts/check-env.mjs` hard-fails the build if either is missing:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Preview is confirmed set.** The Vercel preview deploy for commit `9a6b925`
completed successfully, and it could not have gotten past `prebuild` without
both variables. That build also ran with TypeScript checking newly enabled, so
the `next.config.js` change is validated in real CI, not just locally.

**Production is not confirmed** — no production deploy has run against this
branch. Check Vercel → Settings → Environment Variables before promoting.

`SUPABASE_SERVICE_ROLE_KEY` is Production-only and is read at request time by
`/api/hug/[id]` and `/api/bot/moments`. Both now build without it; both return
a 500 with a clear message if it is absent at runtime.

---

## 7. Housekeeping

| Item | Detail |
|---|---|
| Missing favicon | `app/layout.tsx:9` points at `/logo.png`; `public/logo.png` does not exist, so the icon 404s |
| Dead static files | `index.html` and `public/index.html` both fetch `https://api.k-kut.com/mks`, an API not in this repo. The App Router serves `/` from `app/page.tsx`, so neither file is reachable |
| No ESLint | `next.config.js` still skips lint because the project has no ESLint dependency or config. Add `eslint` + `eslint-config-next`, then flip `ignoreDuringBuilds` |
| Domain | `k-kut.com` per the README. If HUG delivery is meant to live on its own domain, that host is not configured anywhere in this repo |

---

## What is already done

- All four KUT Family containers have tables, RLS, players and inventory.
- Themes are seeded across every container; all seven read as satisfied against
  the seed data.
- The audio gate is enforced at write time, at delivery and at render.
- Type errors fail the build; 23 tests run via `npm test`.

## Shortest path to taking money

**Withdrawn.** This sequence was written before the Current-II Authority map
was available and every step of it is now known to be wrong:

- a `kut-renders` bucket is unnecessary — `kuts` (21 objects), `ii-delivery`
  (3,872) and the private `mk-products` (21,329) already exist; `tracks` holds
  701 objects and is public
- `supabase db push` is unsafe (see the STOP notice)
- "tag each with a theme" conflates theme with element identity, which the
  GPMx model explicitly forbids
- nothing may be released while the freeze is active and zero IIs reach STAGE

The owner's own controlled sequence governs instead: contain the direct routes,
test in a rollback-only transaction, obtain separate explicit authorization,
breadcrumb the superseded artifacts, then reaffirm **one LT-PIX at a time**
through the locked worksheet and review gate.

Steps 1–3 make the inventory real. Step 4 makes it earn.
