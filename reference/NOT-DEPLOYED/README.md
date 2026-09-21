# NOT DEPLOYED — reference implementation only

Nothing in this directory is authority, and nothing here may be applied to a
live system.

## Why it is here and not in `supabase/`

`supabase/migrations/` is the path the Supabase CLI scans. While these files
sat there, `supabase db push` was one command away from a destructive run
against project `vwlzubxshjjonabpeagd`, which already holds the legacy corpus
this schema assumes is absent:

| Live object | Reality | What these migrations would do |
|---|---|---|
| `k_kuts` | **table**, 42,971 rows | `drop view if exists` then create a view of that name — errors on a table, aborting mid-run |
| `m_kut_assets` | **34,251 rows** | `ALTER` in place, adding columns to production data |
| `llf_assets` | unknown | `drop table ... cascade` |

Moving them also satisfies the owner's superseded-artifact rule: bulky
superseded material belongs **outside all active discovery roots**, because
`scripts/discover-pix-kk-batch-source-catalog.mjs` scans `data`, `lib` and
`public` for keyword hits and marks them ready for candidate generation.

`SUPERSEDED_MANIFEST.json` is the breadcrumb: original path, generation commit,
content SHA-256, disposition reason, replacement authority, dependency counts,
rollback locator and retention decision, one entry per file.

## Authority that ranks above everything here

| Rank | Source | State |
|---|---|---|
| 1 | `config/blk-kk-text-generation-freeze.v1.json` | `ACTIVE_OWNER_AUTHORIZED_FREEZE` |
| 2 | ontology · worksheet · exception registry · review gate | all `DRAFT_PENDING_OWNER_LOCK` |
| 3 | `lib/publication-bridge/approvedPublicOptions.ts` | governed runtime eligibility gate |
| 4 | `data/publication-bridge/public-option-records.generated.json` | input only |
| 5 | `data/production/first-production-canary-v1.json` | 2 TRIAGE · **0 STAGE** |

The governed catalog authorizes **zero** public IIs. That is correct, not a gap.

## What is still worth reading here

The design ideas hold up even though the schema must not run:

- **containment** — a child may never escape its parent's audio bounds
- **hash identity** — `[0-9a-f]{64}` parent SHA required; never title-matched
- **floors as data** — a required count lives in a table, not a constant
- **unmeasured ≠ satisfied** — an absent requirement must never read as a met one
- **verify by effect** — an empty `.sql` file applies without error, so asserting
  "the migration ran" proves nothing. That mistake shipped a zero-byte RLS
  migration here, and `migrations.test.ts` now asserts content instead

## What is known wrong

- no NKK/no-NKK ruling exists — neither hierarchy is locked, so neither is buildable
- `theme` is a **column**, which is the theme/identity conflation the GPMx model forbids; it belongs in `gpmx_theme_assignments`
- **7 themes** modelled against **38 Themes and 74 sentiment keys** live
- sentiment, emotion, mood and presentation are collapsed into one field, and must stay independently inspectable
- `keenness_score` is the "numeric-only shortcut" MGS explicitly forbids
- `seed.sql` creates mass candidates, inside the freeze's blocked scope
- TRM / XCLM / VSND are mK forms, not sK forms as the enum has them
- `classifyUnitType()` infers from title, which is forbidden

## The app surfaces

`/kf`, `/api/kf/inventory`, `/llf/[id]` and `/kupid/[id]` are off unless
`NEXT_PUBLIC_KF_REFERENCE_UI=1`. They bypass the governed publication bridge
exactly as the Current-II audit says `/k/[id]` and `/mkut/[id]` already do.
Never enable them in a deployed environment.

```bash
NEXT_PUBLIC_KF_REFERENCE_UI=1 npm run dev   # local inspection only
```
