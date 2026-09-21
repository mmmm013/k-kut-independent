# KUT Family governance — what this web app is allowed to do

Extracted from the GPM tooling, not invented here:

- `GPMX_4PE_KKR_CC_FINISH_MK_GATE_V010.py` — the mK stage gate, freeze and
  lineage-failure rules, and the locked GPMC/GPMCC/EE control model
- `GPM_ALL_TRACK_KK_REVIEW_V001.command` — the full-KK review room
  (two uploaded copies; they are byte-identical)

Where this document and the code disagree, **the upstream tooling wins** and the
code is the bug.

---

## 1. This database is not the source of truth

> GPMC is the canonical write authority for every LT-PIX object. GPMCC is the
> real-time, hash-verified operational clone… Elevator Editor (EE) is the admin
> control plane. Every create, edit, approve, hold, reject, or lineage action
> routes through EE to GPMC, then replicates to GPMCC.

So:

| System | Role |
|---|---|
| **GPMC** | canonical write authority for LT-PIX objects |
| **GPMCC** | hash-verified clone, co-SSOT only under a single-writer rule |
| **EE** (Elevator Editor) | admin control plane — all actions route through it |
| **This Supabase project** | downstream **publication mirror**. Read-only with respect to authority |

Nothing in this app may originate a delivery object, approve one, or edit a
boundary. It publishes what GPMC has already frozen. Earlier migrations called
`public.k_kuts` "the KUT SSOT" — that was wrong and is corrected.

---

## 2. The governed lineage

```
LT-PIX  ->  KK  ->  NKK  ->  N-sK  ->  N-mK
```

> No mK or sK may lose its exact NKK, KK, and LT-PIX ancestry. **No direct
> KK-to-sK or KK/NKK-to-mK shortcut is authoritative.**

Migrations 100–400 pointed `m_kut_assets`, `llf_assets` and `kupid_assets`
straight at `k_kut_assets` — exactly the forbidden shortcut — and had no NKK
layer. Migration 500 adds `nkk_assets` and re-parents the children onto it.

**Containment:** a child may never escape its parent's bounds. Upstream rejects
`APPROVED_BOUNDARY_OUTSIDE_SOURCE_KK`, and the mK rule is
`MK_MUST_RETAIN_LTPIX_SRC_KK_PATH_SHA_AND_MAY_NOT_ESCAPE_SOURCE_KK_BOUNDS`.
Enforced here by the `nkk_assets_within_parent` trigger.

---

## 3. Identity is by hash, never by title

> Resolve the exact GPMCC clone by object ID and SHA-256, **never by title**.
> Divergence is quarantined, never title-matched.

Every object carries `lt_pix_id`, `authority_src_id`, `source_audio_path` and
`source_audio_sha256`. `freeze_lineage_failures()` rejects a row whose parent
SHA is not `[0-9a-f]{64}`; the same constraint now applies here.

Anything title-matched is not lineage. Do not add a title-based join.

---

## 4. Creation order is gated and sequential

From `write_phase_gates()`:

| Stage | Gate | Rule |
|---|---|---|
| KK | freeze must complete | `13_MK_STAGE_GATE.json` = PASS only when `KK_FREEZE_COMPLETE` |
| mK | created only from frozen approved KKs | retain LT-PIX/SRC/KK/path/SHA, stay inside source-KK bounds |
| sK | **currently BLOCKED** | `MK_OBJECT_FREEZE_REQUIRED_BEFORE_SK_CREATION` |

The KK review room agrees: `SK_PROCESSING: DEFERRED`, `FULL_KKs ONLY`.

**Consequence for the 13-floor:** KK, sK and mK cannot be filled in parallel
today. sK creation is gated behind mK freeze, which is gated behind KK freeze.
The floor is a target; the pipeline is a queue.

**The floor itself** lives in `public.kf_theme_minimums` — 13 per theme for
KUT, sK and mK — never as a constant in code. Raise a row and the shortfall
recomputes with no deploy. A theme with no row (Holidays) requires nothing and
reports as *unmeasured*, never as satisfied: an absent requirement must not
read as a met one.

---

## 5. The containers

**sK is short-KUT — everything that is neither a KK nor an mK.**

`is_explicit_small_kut()` enumerates the small-item patterns:

| Pattern | Reading |
|---|---|
| `TRM`, `TERM-CUT` | term cut |
| `XCLM` | exclamation |
| `PHRZ` | phrase |
| `1LNR` | one-liner |
| `WORD-CUT` | word cut |
| `S-KUT`, `SHORT-KUT` | sK proper |
| `M-KUT`, `MICRO-KUT` | mK (distinct — not an sK) |

### sK subtypes, found in TEXT Loop Runs

| Code | Meaning |
|---|---|
| `TWST` | twist |
| `HOOK` | hook |
| `MTa4` | metaphor |
| `PHRZ` / `PHRZ_LNG` | phrase / common longer phrase |
| `SAYING` | common saying |
| `ALTR` | alliteration |
| `1LNR` | one-liner — **LineFeel lands here** |
| `CNTRST` | compare & contrast |
| `OXY` | oxymoron |
| `CLSHA` | cliché |
| `LNTRIO` / `LNPR` | line trio / line pair |
| `3RHYM` / `4RHYM` | three-rhyme / four-rhyme |
| `TRM`, `TERM_CUT`, `WORD_CUT`, `XCLM` | small-item codes recognized upstream |
| `OTHER` | surfaced in a run, not yet classified |

Each sK carries `text_loop_run_id`, so `kf_sk_subtype_yield` can answer the
DMAIC **Measure** question: which pattern classes actually produce sellable
units, per theme, at what QC pass rate.

**LineFeel (LLF) is a one-liner, so LLF is an sK, not a peer container.** Done:
`sk_assets` carries every sK with an `sk_subtype`, LineFeel rows migrated in as
`1LNR`, and `llf_assets` remains as a compatibility view so `/llf/[id]` keeps
working. Renaming that route to `/sk/[id]` is the only piece left, held back
because it changes a public URL.

**K-kUpId is unresolved.** It is described in-app as "a standalone K-KUT
invention", which would make it a KK rather than an sK. Not guessed at.

---

## 6. Per-KK gates upstream

A KK is reviewable only when both pass:

- **NO-CUTOFF GATE** — `cutoff_gate` starts with `PASS`
- **LYRIC GATE** — `lyric_status == 'EXACT_KK_LYRIC_EVIDENCE'`

Decisions: `APPROVE_KK` · `HOLD` / `HOLD_TRIAGE` · `REJECT` ·
`INSTRO_DISQUALIFIED` · `NEEDS_GD_REVIEW`.

Instrumentals are excluded from the lyric-KK run. Boundaries move from **InTP**
(original) to **VTP** (verified), and an approved VTP must lie inside the
original InTP.

**Decision authority:** the newest completed export by source-file mtime
(nanoseconds) wins for a repeated exact KK id. Older exports are immutable
history filling non-conflicting gaps only.

> Newness can supersede a decision or VTP, but **can never override an LT-PIX,
> SRC, audio-SHA, or lineage conflict.**

---

## 7. Rights scope

Every worked object is `GPM_RIGHTS_CONTROLLED_LT_PIX` — "ALL WORKED LT-PIX ARE
GPM RIGHTS-CONTROLLED".

This is why `kf_is_forbidden_source_url()` exists and why the `tracks` bucket is
blocked: **LT-PIX is the master; a delivery unit is strictly less than PIX.**
Serving the full master is not a delivery unit, it is the source.

---

## 8. Naming

From `write_song_momeant_positioning()`:

- Main promise: **Send the moment in the song.**
- Product description: **A song section chosen to say what you mean.**
- Branded noun: **song mo-meant** · CTA: **Send this mo-meant.**
- Use plain "song moment" in explanatory copy until the branded spelling lands.

This is why `/api/bot/moments` is named as it is.

> No domain availability, trademark clearance, purchase, or ownership claim is
> created by that note.

---

## Terms still undefined here

Named upstream or in conversation but not resolvable from the supplied files —
not guessed at anywhere in this codebase:

`FM` · `MGS` · `TUGs` · `VOC` · `13HUGz.com` · the exact relationship of
`GPMx` (pipeline namespace) to `GPMC` (write authority)

`TEXT Loop Runs` are partially resolved: they are where sK candidates are
found, and `sk_assets.text_loop_run_id` records which run surfaced each one.
The run mechanics themselves are still upstream and undescribed here.
