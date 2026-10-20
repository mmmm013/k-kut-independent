# Naming — one name per thing

Every Meant kind has one public name, spelled one way. Each also has one
short code for the database and the code. Every other spelling is retired.
Code still accepts the retired spellings as aliases (`MEANT_TYPE_ALIASES` in
`lib/kf/meants/catalog.ts`), so old rows still resolve. New copy uses only the
names below.

## 1. The umbrella word

| Use | Retire |
|---|---|
| **Meant** / **Meants** | Element, "song mo-meant", "mo-meant" (GOVERNANCE.md §8), "delivery unit" in public copy |

**Meants are HUGs, TUGs and BUGs, and nothing else** (owner, 2026-10-20).
Each Meant is exactly one of the three, fixed by the kind it is cut as:

| Meant | Cut as | Code | Rule |
|---|---|---|---|
| **HUG** | K-KUT, an exact song section | `KK` | Themes, Emotions, Scenarios |
| **TUG** | short-KUT, a line, pair, hook or saying | `SK` | Themes, Emotions, Scenarios |
| **BUG** | mini-KUT, a word up to a short phrase | `MK` | None of them. On demand only |

This matches the live rule in `gpmc_sk_form_factor_ee`: "sK/TUG layer; never
mK/BUG".

## 1b. How names are kept uniform

- **Outward in.** The public name comes first, from what the User sees. Code
  and database names follow it.
- **Codes never change.** `KK`, `SK`, `MK`, `KUPID` and the rest stay fixed
  even if a public name changes, so a rename is a one-line edit here, not a
  data migration.
- **One registry.** Old spellings are accepted when reading
  (`resolveMeantType`) and never written.
- **Poka-yoke.** `npm test` fails if any page in `app/` uses a retired
  spelling.

## 2. The kinds a Meant is cut as

| Public name | Code | What it is | Retired spellings |
|---|---|---|---|
| **K-KUT** | `KK` | An exact song section, full audio | KUT, K-kut, k-kut |
| **short-KUT** | `SK` | Less than a section: a line, pair, hook, saying… | sK, S-KUT, SHORT-KUT, s-kut, and LineFeel / LLF / line feel (a one-liner is just short-KUT subtype `1LNR`, not its own kind) |
| **mini-KUT** | `MK` | Word- to phrase-size, from a single word to a hook | mK, M-KUT, MICRO-KUT, m-kut, Mini KUT, mini-K |
| **K-kUpId** | `KUPID` | Signed for a romance level (Interest → Forever). Its tier is not settled, so it is not yet a Meant | KUPID, k-kupid, kkupid, K-KUPID |

The live registry (`slds_kut_type_registry`) has more codes. Each one resolves
to one of the kinds above:

| Live code | Live formal name | Live public label | Resolves to |
|---|---|---|---|
| `KK` | K-KUT | KUT | K-KUT → HUG |
| `LINEFEEL` | LineFeeL | KUT | short-KUT `1LNR` → TUG |
| `LINEPAIR` | LinePair | KUT | short-KUT `LNPR` → TUG |
| `PHRZ` | Phrase | KUT | short-KUT `PHRZ` → TUG |
| `RIME` | RIME | KUT | short-KUT → TUG |
| `MINI_KUT` | mini-KUT | **ShortKUT** | mini-KUT → BUG |
| `TRMZ` | Terms | tinyKUT | mini-KUT `TRM` → BUG |
| `EXCLM` | Exclamation | tinyKUT | mini-KUT `XCLM` → BUG |
| `SNDS` | Sounds | tinyKUT | mini-KUT `VSND` → BUG |
| `HUG`, `TUG` | HUG, TUG | HUG, TUG | the tiers themselves |

## 3. Internal only (never shown to Users)

| Name | Code | Role |
|---|---|---|
| DKK | `DKK` | Lineage layer between K-KUT and NKK |
| NKK | `NKK` | Parent of short-KUTs and naked sKs |
| naked sK | `NAKED_SK` | Parent of mini-KUTs |
| LT-PIX | — | The master. Never sold, never a Meant |

## 4. Product Tiers

See §1: the tier is the Meant. HUG ranks 1, TUG 2 and BUG 3.

## 5. Still open

- **ShortKUT clash.** The live registry labels mini-KUT (`MINI_KUT`) as
  "ShortKUT" and prices it `SHORTKUT_499`. The live sK forms call sK
  "shortKUT". The same word names both a BUG and a TUG, so one of them has to
  change.
- **No BUG row.** The live registry has `HUG` and `TUG` rows but no `BUG`.
- **K-kUpId's tier** is not settled.
- **The seven kinds.** This repo names four: K-KUT, short-KUT, mini-KUT and
  K-kUpId. The other three are not named anywhere in the repo. LineFeel is
  not one of them: it is a short-KUT one-liner.
- **mini-KUT and full audio.** `/invention` calls a mini-KUT "text
  micro-assets (NOT audio)", and `types.ts` says its audio comes from a parent
  K-KUT. A Meant is always full audio, so the copy on `/invention` needs
  updating once that is confirmed.

## 6. Trademark notes

These are not legal advice, and no search or clearance has been done here.

- Applications are filed with the USPTO: https://www.uspto.gov/trademarks/apply.
- Coined marks are the strongest candidates: **K-KUT**, **K-kUpId**,
  **mini-KUT**, **short-KUT**.
- **MEANT** and **HUG** / **TUG** / **BUG** are ordinary English words. Expect
  descriptiveness or likelihood-of-confusion questions, so a knockout search
  first is worth it.
- File each mark exactly as spelled in §2, with the same capitalization on
  every page and package.
