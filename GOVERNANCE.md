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

## 2. The governed lineage — corrected 2026-09-21

The capture rooms carry the operative chain, and it is deeper than either
earlier document showed:

```
LT-PIX → KK → DKK → NKK → naked sK → sK → mK
```

verbatim from `66_mK_AUDIO_CAPTURE_ROOM.html`:

> PARENT AUTHORITY: sK ← NKK ← DKK ← KK
> **NEVER: LT-PIX → sK directly. NEVER: LT-PIX → mK directly.**
> LOCK: mK derives from naked sK. sK derives from NKK.

**DKK and "naked sK" appear in no other document supplied.** They are real
objects with real ids in the queue — `DKK_KK_PARENT_AWAKE_BLK1_1dd6609ea3aa794a`,
`NAKED_sK_000001`, `NKK_000001`, `sK_000001`, `mKQ_000001`.

This settles the earlier open question: **NKK is real.** It also means both
prior diagrams were incomplete — the V010 gate's `LT-PIX → KK → NKK → N-sK → N-mK`
omits DKK and naked sK, and the Improved GPMx model's `SSOT → KK → sK → mK`
omits three layers.

`nkk_assets` in the reference schema is therefore directionally right and still
wrong in shape: no DKK, no naked-sK, and children hung off the wrong parent.

**Containment still holds:** a child may never escape its parent's bounds.

## 3. Identity is by hash, never by title

> Resolve the exact GPMCC clone by object ID and SHA-256, **never by title**.
> Divergence is quarantined, never title-matched.

Every object carries `lt_pix_id`, `authority_src_id`, `source_audio_path` and
`source_audio_sha256`. `freeze_lineage_failures()` rejects a row whose parent
SHA is not `[0-9a-f]{64}`; the same constraint now applies here.

Anything title-matched is not lineage. Do not add a title-based join.

---

## 4. Creation order is gated because sK is a residual

From `write_phase_gates()`:

| Stage | Gate | Rule |
|---|---|---|
| KK | freeze must complete | `13_MK_STAGE_GATE.json` = PASS only when `KK_FREEZE_COMPLETE` |
| mK | created only from frozen approved KKs | retain LT-PIX/SRC/KK/path/SHA, stay inside source-KK bounds |
| sK | follows the mK freeze | `MK_OBJECT_FREEZE_REQUIRED_BEFORE_SK_CREATION` |

The KK review room agrees: `SK_PROCESSING: DEFERRED`, `FULL_KKs ONLY`.

**This gate is not an obstruction. It is the definition.** GD, production note:

> When KKr deems an II to be either a KK or an mK, then it cannot be an sK.

**sK is short-KUT: everything that is neither a KK nor an mK.** A residual
cannot be computed until its claimants are settled, so sK creation *must*
follow the KK and mK freezes. It was never capable of running in parallel, and
an earlier revision of this document was wrong to describe it as "BLOCKED" or
to call the ordering a consequence for the floor.

**What the freeze is for:** it stops tight-line fights — boundary contests
where a KK and an mK both claim the same line of audio. Freeze the claimants,
and the boundaries stop moving.

**The floor** lives in `public.kf_theme_minimums`, per theme and per container,
never as a constant in code. Raise a row and the shortfall recomputes with no
deploy. A theme with no row (Holidays) requires nothing and reports as
*unmeasured*, never as satisfied: an absent requirement must not read as a met
one.

Current issued floors:

| Container | Floor | Denominator | Note |
|---|---|---|---|
| KK | **3** | per theme | typical yield 5–7; any number of contiguous KKs may exist |
| sK | — | — | **the 13-per-theme floor is nixed** (GD) |
| mK | — | none possible | mK does not work with Themes, so no per-theme floor can exist |

**The 13-per-theme floor is withdrawn.** It was issued, then nixed by GD. Only
the KK floor of 3 per theme stands. Any code or seed that still carries 13 is
stale.

**Exempt from KUT minimums entirely:** Holidays, **Anniversary**, and
**Birthday**. They carry no floor row, and report as *unmeasured* — never as
satisfied. An absent requirement must not read as a met one.

38 Themes x 3 = **114 KKs** minimum. 36 currently show `DEPLOYABLE_INVENTORY`.

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

## 5b. Candidate ≠ approval — the control point

From `03_GD_THEME_VETTING_ROOM.html`, verbatim:

> Every LT-PIX / KK selected for any theme remains **CANDIDATE ONLY** until GD
> vets it. Theme match ≠ approval. Tag match ≠ approval. MetaGrab match ≠
> approval. MGS match ≠ approval. **Audio boundary pass ≠ approval.**

That last clause names the exact defect in this repo's KUT Family surfaces:
they treat `audio_qc_status = 'pass'` — an audio boundary pass — as playable.
It is not approval and never was. The surfaces are now off by default behind
`NEXT_PUBLIC_KF_REFERENCE_UI`; see `reference/NOT-DEPLOYED/README.md`.

GD decisions in the vetting room: `APPROVE THEME FIT` · `HOLD` · `REPLACE` ·
`WRONG THEME`.

## 5c. 13HUGz is the send-use vocabulary

Not emotions — **send occasions**, multi-valued and weighted per object:

> Top 13HUGz use: Just Because Care (100%)
> Other possible uses: Just Because Care (100%) | Friends (100%) |
> Thinking of You (69%) | Just Because Smile (62%) | Long Week (59%) |
> New Baby (55%)

Observed so far: Just Because Care · Friends · Thinking of You · Long Week ·
New Baby · Bad Day Support · Miss Them · Just Because Smile · First Day Nerves ·
Make It Right. The seed catalog is 13 containers × 8 seeds = 104 candidates, so
three more names exist beyond the sample.

A Top-50 send-reason ranking sits above this; rank 1 is *"I'm thinking of you"* →
theme **Thinking of You**. Each theme carries `public_need`, `positive_signals`
and `blocked_signals` in the 13HUGZ rules CSV.

**The seven themes in the reference schema match none of this vocabulary.**

## 5d. The real bottleneck is audio, not schema

From `01_GD_AUDIO_FIRST_NKK_SEND_USE_REVIEW_ROOM.html`:

> Playable rows: **25** | No-audio rows held: **4,040**

Of 4,065 review objects, 25 have playable audio. Counts in that room:
**429 LT-PIX · 2,611 KK · 3,040 objects**.

**These are one room's numbers, at one date.** Later snapshots are far larger
and differently scoped:

| Date | Source | Count |
|---|---|---|
| 2026-09-01 | Invention Delta, live Supabase read | 710 parent tracks · 42,971 K-KUT rows · 22,005 distinct IIs |
| 2026-09-01 | same | HUG 36 · TUG 661 · BUG 21,308 distinct IIs |
| 2026-08-31 | prior assistant report | 21,308 playable / audio-QC-pass mKs |
| 2026-09-21 | `START_HERE.md` | 9,188 approved mKs within 9,808 approved IIs, 85 families |

**Never add these together.** They have different scopes, different dates and
different admission criteria. 9,188 approved mKs is not 9,188 purchasable
three-send packages, and HTTP 200 on an audio URL establishes neither correct
audio nor successful delivery.

Whatever the scope, capture is the constraint: no floor in units is reachable
faster than audio can be captured and proven.

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

## 9. CORE and C-OP — the shared architecture

**CORE is the central source. Every platform is fed from CORE.**
**C-OP is Central Operations.** They are two things, not one name for one
thing. An earlier revision of this document did not carry either, and treated
`C-OP` as an undefined term. That was wrong.

**No platform is its own architecture.** Platform implementations are
described *within* the shared architecture, as implementations of it. A
platform is a projection of CORE, never a second authority and never a second
audio lineage.

This is already specified in `Improved_GPMx_model`, planes 6 and 7:

> No raw table should directly determine public availability.
> element -> release eligibility evaluation -> release package -> platform projection

> Multiple platforms should consume the same release package rather than
> querying internal tables independently.

Each projection carries `platform`, `release_package_id`, `external_product_key`,
`external_asset_key`, `projection_state`, `last_published_hash`,
`last_published_at`, `error_state` — which is what makes publishing idempotent
and keeps one audio hash identical across every platform.

### Platforms, as implementations of the shared architecture

| Platform | Audience | Serves | Status against CORE |
|---|---|---|---|
| `gputnammusic.com` | music supervisors (SUPEs), MIP 2s | industry catalogue | next, after KUT deployment |
| `2kleigh.com` | listeners | KLEIGH vocal streaming, Stripe tiers | **queries Supabase directly** |
| K-KUT buyer surface (Vercel) | fans | HUG / TUG / BUG | contained, surfaces disabled |
| `i-meant.com` | senders | **the BUG platform** — BUG and Story BUG | shared CORE; deployment not freshly verified |
| `13HUGz.com` | senders | the send-use vocabulary | not yet described here |
| DISCO | licensing | catalogue of record | vendor platform |

`2kleigh.com` is the live exception and the clearest case for CORE. It reaches
Supabase through its own edge function — `/functions/v1/mood-proxy/stream?mood=`
— calling `fetchTracksByMood()` from `MoodGrid.tsx`. That is a platform
querying internal tables independently, which plane 7 forbids. Evidence:
*G Putnam Music — Operational Excellence Framework (BIC 6-Sigma v1.0)*, GPM
Vault.

### Five vocabularies. None of them blend.

Each describes a different thing for a different audience. They may be
co-observed and cross-tabulated. They are never summed, merged, or substituted
for one another.

| Vocabulary | Source | Describes |
|---|---|---|
| Mood/feel · Lyric themes | DISCO | the **record** — for sync licensing |
| sentiment · emotion · mood · presentation · expression-function | **KKr MetaGrab** | the **send** — suitability, the humanizing layer |
| 13HUGz | GPM | the **occasion** — weighted, multi-valued |
| KF themes | K-KUT surface | the **shared sentiment** a buyer is sending |
| MOODs (MELANCHOLY · ETHEREAL · FOCUS · UPLIFTING · HIGH ENERGY) | `2kleigh.com` | the **listening vibe** |

KKr alone performs matching. Every other vocabulary is supporting evidence,
used for what it is, and never votes in a match.

**BIC** = Best-in-Class: the 6-Sigma continuous-improvement framework with RACI
assignment that governs GPM operations. **VOC aims; DMAIC improves.** DMAIC
returns approved learning to MIAL, LLBP and BIC governance.

## 10. What each container carries — and what it sheds

Issued by GD. Mandatory, always.

### Delivery binds to element, one to one

| Tier | Provides |
|---|---|
| HUG | KK |
| TUG | sK |
| BUG | mK |

A tier is packaging and delivery. It is never a source authority and never
creates a second audio lineage. **KK / sK / mK is what the element *is*.
HUG / TUG / BUG is how it is *packaged and delivered*.**

### FM enters structured; KK reflects its sections

**FM enters as a structured song.** KKs reflect **sections of that arranged
song** — they are not arbitrary cuts, they follow the arrangement.

**BLK is its own item, practice and technique.** It is not a lineage stage.
**sBLK** is a sub-block, standing in for sub-verses — `V1a`, `V1b`.

### Sequence, and where it stops mattering

| | Sequence |
|---|---|
| LT-PIX → KK | holds |
| KK → sK | **no longer matters** |
| mK | ignored entirely |

### Themes

**sKs work with Themes. mKs do not.** There is no mK theme axis, which is why
no per-theme mK floor can exist.

### The strip, the pod, and MetaGrab Sets

**Once stripped, a KK drops all descriptive metadata.** The stripped element
stores in a **pod**. That pod sits alongside **KKr pods of metadata**. The
pods together are **MetaGrab Sets**.

This is the no-blending law made physical: audio in one pod, meaning in
another, joined as a Set. Never fused into one record, always co-located.

**BUGs remain free from such governance.**

### The frontend / backend split — critical

**sK and mK do NOT stay tied to SSOT on the frontend. Only on the backend.**

> **ALL IIs retain backend legal, business and proprietary information and
> data on the backend. ALWAYS.**

On the frontend an sK or mK stands free of its SSOT tie. On the backend the
lineage, rights, legal and business data are never absent. This is the same
boundary the Permanent Laws draw from the other side: raw source paths and
source WAV URLs must never be returned by a buyer-facing delivery function.

## 11. The three offers — commerce

What a buyer pays for, and what the payment is for. Element law is §10;
nothing here overrides it. A tier is packaging and delivery, never a
source authority.

### BUG has two types

Locked by GD. Reconciled against *BUG and Story BUG — complete recovered
handoff*, 2026-09-22.

| | Ordinary / Repeat BUG | Story BUG / Sequenced Story BUG |
|---|---|---|
| Inventory | mini-KUT (mK) | mini-KUTs (mKs) |
| Package | three total timed sends | three total timed sends forming a story |
| Content | the **same exact** BUG in all three | three **different, related** BUGs |
| Price | **$1.99 total** | **$2.98 total** |
| Upgrade | none | **+$0.99** over the $1.99 base |
| Sequencing | repeat the selected immutable item | successive, randomized yet sequenced, building a story |
| Domain | `i-meant.com` | same platform, shared CORE |

**Both products must remain available. Story BUG is an optional upgrade, not
a replacement.**

**Do not** charge $1.99 per send, or $2.98 plus another $0.99, or substitute
HUG/TUG pricing. Server-side totals are **199 cents** and **298 cents**.

### The canonical price lock

Set by GD. Element name and tier name are two names for the same priced
thing — the lock names the element, the offer law names the tier. They do not
disagree.

| Cents | Element (price lock) | Tier (offer law) | In checkout |
|---|---|---|---|
| **199** | `mKUT` | BUG | yes |
| **499** | `sBLK` | TUG | yes |
| **799** | `BLK` | HUG | yes |
| **1199** | `PROMOTIONAL_HUG` | — | **absent** |
| **1499** | `STANDARD_HUG` | — | **absent** |
| **99** | `VOCAL_NOTE_OR_TYPED_MESSAGE_ADDON` | — | **absent** |

Source: `lib/kkr-canonical-pricing.ts` in `mmmm013/k-kut`, a mirror of
`KKR_CANONICAL_PRODUCT_PRICE_LOCK_V001.md`. That file states: *an amendment
requires an explicit GD decision and a new numbered lock version; silent edits
are prohibited.*

**Three priced items are absent from checkout** — `PROMOTIONAL_HUG`,
`STANDARD_HUG` and the `VOCAL_NOTE_OR_TYPED_MESSAGE_ADDON`. They are locked
prices with no way to charge them. `app/checkout/route.ts` carries three
offers only: HUG 799, TUG 499, BUG 199.

**The lock file is imported by nothing.** The only file referencing
`KKR_CANONICAL_PRICING` is itself. The prices it locks are enforced elsewhere,
in `lib/productOfferLaw.ts` and `app/checkout/route.ts`, which agree with it.

`KKR_STRUCTURAL_LAW` in the same file states **`mKUT_is_sBLK: false`**, and
defines `sBLK` as *one identified structural segment of a BLK, such as Verse
1a, Verse 1b, Verse 2a, or Verse 2b.*

### $2.98 — settled

**Story BUG is three different, related BUGs sent in sequence.**

`$1.99 base + $0.99 Story upgrade = $2.98 total.`

**The Story upgrade is not the vocal-note / typed-message add-on.** They are
both 99 cents and they are different offerings. *Equal prices do not make two
things the same thing* — the same law that keeps five vocabularies from
blending keeps two identically priced items from collapsing into one.

**Consequence for the price lock:** it carries a single 99-cent entry,
`VOCAL_NOTE_OR_TYPED_MESSAGE_ADDON`. The Story upgrade is a **second, distinct**
99-cent item that the lock does not carry. Adding it is an amendment, and that
file's own rule applies — an explicit GD decision and a new numbered lock
version. Not a silent edit.

### Eligible BUG classes

**TRM, VSND and XCLM.** An earlier TRM/VSND-only restriction was broadened by
owner direction. **TWIST is separate and is not BUG.** The classification
definitions themselves come from the governing ontology — they are not to be
inferred from the abbreviations.

A matching word or phrase from another recording, or another occurrence of the
same word, remains a distinct choice. **Text equality alone is not
duplication.**

### Story construction — a recoverable contract, not proven deployed

From the August 22 design. Preserve it to inspect; it is not evidence of
current deployed behavior.

- Select eligible **related** clips at package assembly.
- Arrange **Hook → Build → Payoff**.
- **Permanently lock** the selected clip identities and their order for that package.
- **One billing event** for the package.
- Durable scheduling for the successive sends.
- Idempotency key `packageId:sendIndex`.
- A retry must **not** rerandomize the story, substitute a clip, or advance a step.

"Randomized yet sequenced" is an **assembly** decision. It is not permission to
shuffle a purchased story on every play or send. **"Related" means meaningful
contextual progression**, not three mKs sharing one broad tag. **Family
affection must never automatically receive romantic material.**

The package is **three delivery events**. A single stitched audio file does not
substitute for them, and each component keeps its own source lineage.

### Three different quantities — never multiplied together

| Quantity | Value |
|---|---|
| timed sends per package | **3** |
| shares | **2** |
| plays per share | **3** |

Three sends are not three permitted plays. Do not combine these into an
invented entitlement or promise unlimited replays.

### Presentation rules on record

| Item | Rule |
|---|---|
| personal text note | **13 characters** |
| audio logo | **Twinkle MEDIUM at 75%** per II; canonical source CC preserved separately |
| lyrics display | brown background, tan text, amber highlighting |
| delivery | **no download**; do not inherit URU audio-download behaviour |

### The identified repair

Issued by GD from the inspection of `mmmm013/k-kut` at `d9af6da`.

| # | Repair | State |
|---|---|---|
| 1 | **Connect the numbered price lock to server-side offer validation**, so drift is caught. Today `kkr-canonical-pricing.ts` is imported by nothing and agrees with checkout only by coincidence of authorship. | **done** |
| 2 | **Add purchase paths** for `PROMOTIONAL_HUG` $11.99, `STANDARD_HUG` $14.99, and the **separate** message add-on $0.99. All three are locked prices with no way to charge them. | **blocked — see below** |
| 3 | **Implement Story BUG's $2.98 checkout and three-part delivery.** Display copy alone is insufficient — $2.98 currently exists in one line of markup on the Comin' True page and nowhere else. | **done** |
| 4 | **Preserve both element names and tier names.** Neither naming is the real one; they name the same priced thing from two sides. | **done** |

Repair 3 honours the story-construction contract recorded above: locked
identities and order, one billing event, `packageId:sendIndex`, and a retry
that never rerandomizes, substitutes or advances a step. Delivered on branch
`claude/offer-law-and-story-bug`. Five hand-typed copies of the prices were
found in total, the fifth in the paid-side check that decides whether money
already taken matches an approved offer; all five now derive from the lock.

A Story BUG has no audio of its own, since it is three delivery events rather
than one stitched file. What it proves instead is its parts: all three
component BUGs must be approved and purchasable. Holding any one component
removes the whole package.

### Repair 2 — what blocks it

Not a technical limitation. Each of the three items is blocked by a different
thing, and neither can be resolved without GD.

**The $0.99 note/message add-on is held by an existing governance document.**
`K_KUT_2611_REGULAR_HUG_MAPPING_V001.md` lists the *"`$0.99` personal-note
add-on"* under **Continuing Holds** — *"held until separately authorized and
proven"* — and states in the same document: *"The optional 13-word written
note remains included in the `$7.99` catalog HUG. It is not a separate
charge."* Building a purchase path for it would contradict a live rule.
**GD must lift that hold before the path can exist.**

**`PROMOTIONAL_HUG` and `STANDARD_HUG` have a price and nothing else.** Every
offer that can be built has four things: a canonical II form, a price, a
discovery placement, and its source restrictions. The offer law's customer
table carries exactly three rows — HUG $7.99 / KK or KOMBO, TUG $4.99 / sK,
BUG $1.99 / mK. These two appear only in the lock's `prices_cents`, with no
structural-law entry, no II form, no discovery placement, and no description
anywhere in either repository.

To build them, **GD must supply**, for each of the two:

1. what II form it delivers, and how many;
2. how it differs from the $7.99 HUG, which is the BLK price;
3. where it is discovered, and whether a HUGz Card may house it.

Related but separate: a **$12.99 Big HUG** appears in
`K_KUT_2611_REGULAR_HUG_MAPPING_V001.md` and
`K_KUT_HOME_3_PRODUCT_RELEASE_V001.md`, while the offer law requires that
*"no obsolete $12.99 offer is displayed or sold."* Whether the two locked HUG
prices supersede that tier is also GD's to say.

Note that the offer law's own development boundary states it does not
authorize **Stripe product creation** or **Stripe price creation**. Two new
priced offerings would need that boundary moved as well.

### VOC — the two layers

GD's note to the system / 4PE:

> **VOC offers 2 MAIN layers of info: user behavior + system activity &
> written feedback.**

VOC aims; DMAIC improves. 4PE's KKr is required to evolve itself on VOC and
Admin — these two layers are what it evolves on. They are two layers of one
source, read separately. They do not blend, and neither blends with any of
the five vocabularies.

### The personal note — 13 words, not 13 characters

Settled against the source. `K_KUT_2611_REGULAR_HUG_MAPPING_V001.md` states
**maximum 13 words**, with **160 characters as a technical safety cap**. The
code matches: `PERSONAL_NOTE_WORD_LIMIT = 13` and
`PERSONAL_NOTE_CHARACTER_LIMIT = 160`. An earlier reading of "13 characters"
was wrong. No change required.

## Terms still undefined here

Named upstream or in conversation but not resolvable from the supplied files —
not guessed at anywhere in this codebase:

the three unobserved 13HUGz container names · whether `13HUGz.com` is the
storefront for that vocabulary · what an II physically *is*, as distinct from
how it is keyed · `MIP 2s`, the supervisor surface on `gputnammusic.com` ·
`LLBP` and `KUPID`

Resolved since: **VOC** = Voice of Customer (the Listen rooms capture and save
VOC decisions; a reported issue earns one free corrected element). **MGS** =
multi-gated semantic — 13 dimensions, ≥30 confirmed assertions, ≥3 congruent
user-visible tags, contraindication review, no numeric-only shortcut.
**GPMx** is the enterprise; **4PE is its governed operating system**.
**DKK** and **naked sK** are lineage layers, newly evidenced. **CORE** is the
central source feeding every platform; **C-OP** is Central Operations (§9).
**BIC** = Best-in-Class 6-Sigma with RACI. **GPEx** is the company-scale
platform built around 4PE; GPEx and SSOT are the authority plane.

**FM** enters as a structured song; KKs reflect sections of that arrangement
(§10). **`ii_key`** is one part of the four-part placement key —
`platform + ii_key + theme_id + sentiment_key` — which is what lets several
sentiments live inside one Theme, and several Themes attach to one II, without
collision. **TUG** delivers sK at $4.99, the `sBLK` line of the price lock
(§11). **BUG's two types are resolved** (§11): BUG and Story BUG.

`TEXT Loop Runs` are partially resolved: they are where sK candidates are
found, and `sk_assets.text_loop_run_id` records which run surfaced each one.
The run mechanics themselves are still upstream and undescribed here.
