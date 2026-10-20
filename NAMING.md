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
| **TUG** | an sK: a line, pair, hook or saying | `SK` | Themes, Emotions, Scenarios |
| **BUG** | mini-KUT: a TRM (one word), a PHRZ of fewer than 4 words, an XCLM or a VSND | `MK` | None of them. On demand only |

A phrase of 4 or more words is a TUG (owner, 2026-10-20). This matches the live rule in `gpmc_sk_form_factor_ee`: "sK/TUG layer; never
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
| **TUG** | `SK` | Less than a section: a line, pair, hook, saying… | short-KUT, ShortKUT, shortKUT, sK (in public copy), S-KUT, SHORT-KUT, s-kut, and LineFeel / LLF / line feel (a one-liner is just TUG subtype `1LNR`, not its own kind) |
| **mini-KUT** | `MK` | Word- to phrase-size, from a single word to a hook | mK, M-KUT, MICRO-KUT, m-kut, Mini KUT, mini-K |
| **K-kUpId** | `KUPID` | Signed for a romance level (Interest → Forever). Its tier is not settled, so it is not yet a Meant | KUPID, k-kupid, kkupid, K-KUPID |

The live registry (`slds_kut_type_registry`) has more codes. Each one resolves
to one of the kinds above:

| Live code | Live formal name | Live public label | Resolves to |
|---|---|---|---|
| `KK` | K-KUT | KUT | K-KUT → HUG |
| `LINEFEEL` | LineFeeL | KUT | TUG `1LNR` |
| `LINEPAIR` | LinePair | KUT | TUG `LNPR` |
| `PHRZ` | Phrase | KUT | under 4 words: BUG `PHRZ`; 4+ words: TUG |
| `RIME` | RIME | KUT | TUG |
| `MINI_KUT` | mini-KUT | TUG (was ShortKUT until 2026-10-20) | TUG, priced `TUG_499` (see §5) |
| `TRMZ` | Terms | tinyKUT | mini-KUT `TRM` → BUG |
| `EXCLM` | Exclamation | tinyKUT | mini-KUT `XCLM` → BUG |
| `SNDS` | Sounds | tinyKUT | mini-KUT `VSND` → BUG |
| `HUG`, `TUG` | HUG, TUG | HUG, TUG | the tiers themselves |

## 3. Internal only (never shown to Users)

| Name | Code | Role |
|---|---|---|
| DKK | `DKK` | Lineage layer between K-KUT and NKK |
| NKK | `NKK` | Parent of TUGs and naked sKs |
| naked sK | `NAKED_SK` | Parent of mini-KUTs |
| LT-PIX | — | The master. Never sold, never a Meant |

## 4. Product Tiers

See §1: the tier is the Meant. HUG ranks 1, TUG 2 and BUG 3.

## 5. Still open

- **ShortKUT is dropped** (owner, 2026-10-20: "drop ShortKUT. Most, if not
  all, will become TUGs"). The repo now calls an sK a TUG, and no page may
  use short-KUT, ShortKUT or shortKUT. The live `MINI_KUT` type is a TUG at
  4.99 (owner, 2026-10-20): its public label is now "TUG" and its price code
  `TUG_499` (it was ShortKUT / `SHORTKUT_499`). BUGs are single words at
  1.99. The live tinyKUT BUG codes are still priced `TINYKUT_299`, which
  does not match 1.99 yet. Also, the three sK form definitions
  that said shortKUT now say TUG (owner: "change all"). No live type or form
  row uses the word any more. All 9,188
  approved mini-KUTs are single words, and the owner chose to keep them
  BUGs (2026-10-20), matching the live rule "one word is a BUG, not a TUG".
  Only multi-word cuts that pass 4PE/KKr become TUGs.
- **No BUG row.** The live registry has `HUG` and `TUG` rows but no `BUG`.
- **K-kUpId's tier** is not settled.
- **The seven kinds.** This repo names four: K-KUT, TUG, mini-KUT and
  K-kUpId. The other three are not named anywhere in the repo. LineFeel is
  not one of them: it is a TUG one-liner.
- **mini-KUT and full audio.** `/invention` calls a mini-KUT "text
  micro-assets (NOT audio)", and `types.ts` says its audio comes from a parent
  K-KUT. A Meant is always full audio, so the copy on `/invention` needs
  updating once that is confirmed.

## 6. Trademark notes

These are not legal advice, and no search or clearance has been done here.

- Applications are filed with the USPTO: https://www.uspto.gov/trademarks/apply.
- Coined marks are the strongest candidates: **K-KUT**, **K-kUpId**,
  **mini-KUT**. short-KUT is dropped, so it is not a candidate.
- **MEANT** and **HUG** / **TUG** / **BUG** are ordinary English words. Expect
  descriptiveness or likelihood-of-confusion questions, so a knockout search
  first is worth it.
- File each mark exactly as spelled in §2, with the same capitalization on
  every page and package.
