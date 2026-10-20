# Meants — KKr working copies of every GPM Element Type

**Meant** is the collective term for every Element. A Meant is always and only
a full-audio copy grabbed from an original SSOT clone, sent through multiple
Text Loops of humanizing, and defined by KKr instructions across three Product
Tiers: **HUGs, TUGs, BUGs**.

Code: `lib/kf/meants/` · Tests: `lib/kf/__tests__/meants.test.ts`

This is types and rules only. It creates no rows, touches no database, and
originates nothing. GPMC stays the write authority (GOVERNANCE.md §1) and the
BLK/KK text-generation freeze stays in force.

---

## 1. What was cloned — strictly

Every Element Type found in this repo, with every attribute, constraint and
enum value, copied verbatim from the file it lives in. A test reads the
reference schema and fails if the clone is missing a column or invents one.

| KKr code | Element | Parent (LOCK) | Source | Attributes | Subtypes |
|---|---|---|---|---|---|
| `KKr-KK` | K-KUT | LT-PIX | `k_kut_assets` | 21 | 10 song sections |
| `KKr-DKK` | DKK | KK | GOVERNANCE.md §2, no schema | 7 (lineage identity + bounds) | — |
| `KKr-NKK` | NKK | DKK | `nkk_assets` | 21 | — |
| `KKr-NAKED_SK` | naked sK | NKK | GOVERNANCE.md §2, no schema | 7 (lineage identity + bounds) | — |
| `KKr-SK` | short-KUT | NKK | `sk_assets` | 25 | 20 (TWST … OTHER) |
| `KKr-MK` | mini-KUT | naked sK | `m_kut_assets` | 20 | 8 (mK-verb … mK-hook) |
| `KKr-KUPID` | K-kUpId | **unresolved** | `kupid_assets` | 24 | 5 levels (INT … FVR) |

LT-PIX is the SSOT source, not a Meant. LineFeel/LLF resolves to `KKr-SK`
subtype `1LNR`, never a separate type.

**Strict means defects are cloned too.** Where upstream says an attribute is
wrong, it is still copied and carries an `upstreamFlag`: `keenness_score`
(numeric-only shortcut MGS forbids), `emotion_level` (four things in one
field), `theme` as a column (theme/identity conflation, 7 vs 38 live),
`approved_for_hug` (an audio pass is not approval), NKK hung off KK instead of
DKK, mK hung off NKK instead of naked sK, and TRM / TERM_CUT / XCLM sitting in
sK when upstream calls them mK forms.

## 2. The rules every Meant is checked against

`validateMeant()` returns every violation at once.

| Rule | Check |
|---|---|
| Working copy only | `authority` is always `KKR_WORKING_COPY`; a clone never carries approval |
| SSOT origin | SSOT clone id + SHA-256, parent SHA-256, LT-PIX and SRC ids all present |
| Hash, never title | `matched_by` must be `object_id_and_sha256` |
| Vocals never lost | `audio.vocals` must be true |
| Instrumentals never lost | `audio.instrumentals` must be true |
| Full audio | variant must be `VOCAL_MUSIC`; `MUSIC_ONLY` drops a layer |
| Not the master | the audio URL may never be PIX / source / full-track |
| TPs | InTP ordered; VTP inside InTP |
| Boundaries | InTP inside the parent's bounds |
| Multiple Text Loops | `HUMANIZED` needs ≥ 2 distinct Text Loop runs |
| All 3 tiers | HUG, TUG and BUG each defined, each with ≥ 1 KKr strategy |
| Strategy granularity | `WORD → TERM → PHRASE → LINE → LINE_SET → SONG_SECTION`, limited to what the type can carry |
| HUGs & TUGs | work with Themes, Emotions, Scenarios (at least one present) |
| BUGs | never any Theme, Emotion or Scenario |
| BUGs on demand | `canDeliverTier('BUG', …)` is true only for `user_request` |

## 3. Platforms never sell

`lib/kf/meants/conduct.ts`

- `PlatformAction` is `GUIDE | GIVE_FREE | REPLACE_FREE | STEP_BACK`. There is
  no sell action to call.
- `nextBestAction()` — asked to stop → step back; reported an issue → replace
  free; leery → give free (even if they had one before); otherwise guide.
- `honorUserVerdict()` — **the User / Recipient is always right.** Every
  verdict comes back `accepted: true` and is saved as VOC for the next Text
  Loop. There is no dispute branch.
- `findSalesLanguage()` — catches sales-rep copy ("buy now", "only 3 left",
  "limited time", …). A test runs it over every page in `app/`; all pass today.

## 4. Defaults picked where the ask left things open

| Open point | Default | Why |
|---|---|---|
| "Full audio" vs. the rule that a delivery unit is strictly less than PIX | Full audio = vocals **and** instrumentals intact inside the Meant's bounds. Never the full master. | Keeps both the owner's rule and GOVERNANCE.md §7 |
| What "multiple" Text Loops means | ≥ 2 | Smallest number that is "multiple"; one constant to change |
| HUG vs TUG | HUG = Tier 1, TUG = Tier 2, same sentiment rules | The repo only records TUG as "Tier 2" |
| Strategy granularity per sK / mK subtype | e.g. `WORD_CUT`/`XCLM`/mK-noun = WORD, `HOOK`/`1LNR` = LINE, `LNPR`/`3RHYM` = LINE_SET | No upstream mapping exists; table in `catalog.ts` |
| Parents for sK, naked sK, mK | sK ← NKK, naked sK ← NKK, mK ← naked sK | The capture-room LOCK, verbatim |
| K-kUpId's parent | left unresolved | GOVERNANCE.md says not to guess |
| Themes / Emotions / Scenarios vocab | free strings, three separate fields | Upstream holds 38 Themes and 74 sentiment keys; none are in this repo |

## 5. What this does not do

- No database writes, no migrations, no seed rows — the freeze blocks
  candidate generation and this repo is a publication mirror.
- No route is switched over yet. Next step: have `/api/hug/[id]` call
  `validateMeant()` and `canDeliverTier()` once real Meant rows exist.
- The actual Text Loop mechanics and KKr instruction content live upstream.
  The structures to hold them are here.
