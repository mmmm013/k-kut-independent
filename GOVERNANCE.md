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

### The $12.99 Big HUG — destroyed

GD ruling: *"A $12.99 Big HUG - Destry it!!!!!"*

**Destroyed is not retired.** A retired price is one nothing currently sells.
A destroyed one is forbidden to come back. Recorded in **price lock V003**
under `destroyed_prices_cents`, never again as a live price.

The two documents that still authorised the tier —
`K_KUT_2611_REGULAR_HUG_MAPPING_V001.md` and
`K_KUT_HOME_3_PRODUCT_RELEASE_V001.md` — are marked destroyed rather than
rewritten, so the revocation stays legible next to what it revokes. The offer
law's older wording, *"no obsolete $12.99 offer is displayed or sold,"* is now
backed by an audit that hunts the amount through everything that ships.

This also settles the open question from repair 2: the $12.99 tier does not
compete with `PROMOTIONAL_HUG` or `STANDARD_HUG`. It is gone.

### LAW — no system tool adopts a track title

GD: *"NO system tool can adopt track title name."*

A song is **inventory**. A route, page, script, workflow, module, constant or
npm script is a **tool**. A tool named after a song can only ever serve that
song: dropping the song means deleting code, and adding another means copying
it. **Tools are named for what they do and take the song from data.**

| Is a tool — must not name a track | Is data — may name its own track |
|---|---|
| routes and pages · scripts · workflows · modules and constants · npm script names | delivery-registry manifests · lyric authority files · audio asset paths |

Dropping a page is therefore a **data** change: a family manifest declares the
route it publishes on, and one declaring none publishes nothing. Code never
names a page.

Enforced by `scripts/audit-no-track-title-in-system-tools.mjs`, first in
prebuild. It reads titles from data, so a new song is covered the moment its
data lands.

**Eight pre-existing violations remain**, all for one other track — live admin
routes, their API routes, and a workflow. They are pinned exactly: a new
violation fails the build, and so does a pinned entry that quietly disappears.
The list can only shrink. **Renaming live admin routes is GD's call**, so they
were not renamed as a side effect of landing the law.

Two further titles name tools — `a-love-like-that` and `dont-call-it-love` in
audit and materialize script names. The audit does not yet see them because
those titles are not declared in the delivery registry or lyric authority.
**Their data must declare its title before the law can reach them.**

### OPERATIONS — all artist contact routes through GD

**ALL contact with KLEIGH, Michael Clay and Clayton Michael Gunn runs through
GD, in BOTH directions, routed to `KLEIGH@gputnammusic.com`.**

They are one person in three identities. No platform, page, EPK, gallery or
inquiry form may publish a direct address for any of them, and no reply path
may bypass that routing. An inquiry about a painting, a booking or a licence
reaches the artist only through GD.

### TLC — The Love Charger

**TLC = The Love Charger.** That is the name. The earlier title is gone and is
not carried forward anywhere.

**TLC is the ONE destination.** Themes are not a rival destination — they are
how TLC is organised. There is one place governed inventory is presented, and
Themes is the shape it takes inside it.

| Element | In TLC |
|---|---|
| **KK** | seeded |
| **sK** | seeded |
| **mK** | **on request — reachable, never blanket-seeded** |

`on_request` is a position, not an absence: the inventory exists and can be
reached. mKs are never seeded because **mKs do not work with Themes**, and
seeding them would assert a relationship that does not exist.

**TLC references canonical inventory.** It never creates a replacement source
recording and never mints a duplicate KUT identity.

#### The earlier generation run — recovered, and withdrawn

The handoff records the four output manifests as 404 and their totals as
unrecoverable. They are recoverable from git history, and what they show
matters.

| | |
|---|---|
| Commit | `0c71a78` (romance inventory manifests) |
| Generated | 2026-09-08T14:43:54Z |
| KK | **410** |
| mK | **134** |
| sK | **1,640** |
| Reported | `delivery_integrity_status: PASS` |
| Checksum | `253f57b7…` |
| Branch | `copilot/generate-romance-kut-inventory` |

**Eighteen minutes later, commit `78a354c` replaced that generation with an
authority-gated, fail-closed flow and deleted all four.**

So the totals exist, and they are **not a catalogue**. They are the output of
a run that was withdrawn the same hour for not being authority-gated. Anyone
finding these numbers should read them as *what an ungated run produced*,
never as approved inventory. The `PASS` in that summary is the run's own
claim about delivery integrity, not an approval.

#### The six promotional phrases are not in the code

*Find YOUR Feelings · Who should know? · Old words; New ways · Say it like
never before! · Make it personal · Follow-up Feelings*

Searched across **all 131 branches**, by exact phrase: **none of the six
appears anywhere.** The historical report that the engine and six promos were
"validated and deployed to Preview" is not supported by anything in this
repository. The phrases are preserved here because GD directed they be
retained — but they must be treated as **copy to implement, not code to find**.

### The free offer — three clocks that must never merge

| Clock | Meaning |
|---|---|
| **Promotion window** | when an eligible user may obtain a free offering |
| **Recipient access period** | how long a granted item stays available |
| **BUG send schedule** | when each of the three package sends occurs |

Merging them is the standing danger: **recipient access must not expire merely
because the acquisition window closed**, and a pending BUG send due after the
promotion ends is still owed. **Orders legitimately granted free remain free
— never retroactively charged.**

Do not combine August's Monday, September's Monday and "48 hours" into one
invented campaign. Both historical Mondays are past, and no new activation
date has been given.

**Current state: no timer runs.** `K_KUT_FREE_PASS_START_DATE` is unset, which
is the closed state.

### The mental-health reference is 988

Historical "985" text is an error. **988** is the intended U.S. reference.
Verify the current official wording when implementing it. **GPM is not a
clinical service and must never present itself as one.**

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

---

## 13 · KLEIGH EPK — audited, then rebuilt (2026-09-22)

The material supplied out of the Dropbox Transfer link ("T") was audited against
the ten acceptance criteria: **7 FAIL, 2 PARTIAL.** `EPK.pdf` proved to be a
one-page placeholder dated 9/21/25 whose entire text is *"EPK (placeholder) /
Use previous v2.7 / v2.6 EPK if needed."*

GD's ruling: **"just Build new. WHY NOT? We do NOT NEED OLD."** and
**"still, kreate new!"** The new kit is `epk/index.html`. The old pages are not
reproduced and v2.7 / v2.6 are not sought.

Three findings are recorded here because they outlive the page:

1. **The contact routing rule is now printed on the artist-facing page itself.**
   All press, sync, booking and artwork enquiries for KLEIGH, Michael Clay and
   Clayton Michael Gunn go to `KLEIGH@gputnammusic.com`, in both directions.
   The old page published `info@musicmaykers.com`, which breaks that rule.
2. **The entity is unsettled.** The old pages footed "©2025 musicmaykers, llc".
   The new page foots "© 2026 G Putnam Music, LLC". GD confirms which one the
   representation agreement names.
3. **`download=true` on both DISCO players was carried over untouched.** It is a
   decision nobody is recorded as having made. Press-audio download rights are a
   separate question from the consumer no-download rule, and are GD's to settle.

**`KLIEGH EPK PDF.pdf`** — an EPK DRAFT from Clayton Gunn dated 2026-01-08,
Gmail message `19ba061960520f10` — is nine months newer than the placeholder and
is the likely home of the biography, track titles and credits. It is not in
Drive and not in Dropbox, Gmail attachments cannot be downloaded from this
session, and both `www.dropbox.com` and `www.canva.com` are blocked by the
network egress proxy. It remains unread.

### 13.1 · LAW — the banned display name (2026-09-22)

> **"MUSIC MAYKERS IS BANNED FROM UI DISPLAY. ALWAYS & ONLY G PUTNAM MUSIC."**
> — GD

This ranks with the track-title law. The banned name may not appear in any
surface a visitor can see: rendered text, alt text, page titles, link hrefs,
embed sources, image filenames, or data that feeds a UI. Guarded by
`scripts/audit-banned-ui-names.mjs` (`npm run audit:banned-ui-names`), which
exits 1 on any occurrence. Only `GOVERNANCE.md`, `epk/README.md` and the audit
itself are exempt, because naming the ban is how the ban is kept.

**First casualty: the two DISCO playlist embeds.** The player renders
"By Music Maykers, LLC" inside its own frame, in our page, to every visitor —
account branding that cannot be overridden from our markup — and the host
`musicmaykers.disco.ac` carried the name again in the `src` and in every
fallback link. The embeds are out of `epk/index.html`. Listening points at
`gputnammusic.com`. To restore embedded players, rename the DISCO workspace or
serve the player from a G Putnam Music domain; nothing else must change.

**Known surfaces still carrying the banned name, outside this repo:**
`musicmaykers.net` (the Vocal Showcase page renders "By Music Maykers, LLC"),
the DISCO workspace branding, and the `musicmaykers.disco.ac` host itself.
None are reachable from this repository.

### 13.2 · Downloads — settled (2026-09-22)

GD on the `download=true` default: *"NO IDEA. FIX IT."* Settled: **nothing
downloads off the EPK.** Streaming lives at `gputnammusic.com`; downloadable
reference audio for press, sync and supervision is released on request, so every
file leaves with its writer, performer and publisher credits and its usage terms
attached. This is the rule the press materials already follow and it agrees with
the stated principle on the stream surface — *stream first, save what you love
when it is available.* Reversible on GD's word.

### 13.3 · Dropbox Transfer links are not reachable, and why

GD: *"i cannot believe T is NOT part & parcel w/ ALL AI platforms."*

Two separate walls, neither of them a judgement call:

1. **The Dropbox connector covers files in a Dropbox account.** A Transfer
   (`dropbox.com/t/…`) is not a file or a shared link — it is a separate
   delivery product with no entry in the API the connector speaks. Asking for
   it returns `SHARED_LINK_NOT_FOUND`, which is accurate: there is no shared
   link.
2. **This session's network egress proxy blocks `www.dropbox.com` outright**, so
   the Transfer page cannot be opened as a web page either. `www.canva.com` is
   blocked the same way.

**The workaround, both directions:** save the Transfer into Dropbox proper
("Save to Dropbox" on the Transfer page), or drop the files into any Dropbox
folder. Contents then read normally, including text extraction from PDFs.

### 13.4 · Photographer credit recovered from file metadata (2026-09-22)

The featured KLEIGH portrait carries its own credit in EXIF:
`Copyright: Kristian Dowling 2014`, Nikon D4S, 2014-07-25. The credit is printed
on `epk/index.html`, and the EXIF is preserved in the committed file as the
credit's evidence — it must not be stripped.

**Copyright sits with the photographer.** A printed credit is not a licence;
permitted uses are unconfirmed and must be settled with Kristian Dowling before
the photograph is released to any outlet.

`epk/assets/kleigh-press-01.jpg` carries no embedded credit. Its photographer is
unknown and it is released to no one until that is settled.

### 13.5 · The contributor ethos, and the register it requires (2026-09-22)

GD: *"As in my Ethos, I want ALL who gave their best talent to my mission … to
receive some type reg royalty. Yet, nothing lasts forever."*

`docs/rights/CONTRIBUTOR_AND_RIGHTS_REGISTER.md` is the list that makes the
ethos executable. One row per person, per work; a work with a blank row does not
go out. It was opened because three contributors surfaced by accident in a
single week — one found in EXIF, one named only in a forwarded subject line, one
whose credits list was sent and lost.

Two instruments GD already built, to be reused rather than reinvented: the
**Clayton Michael Gunn Public Story & Privacy Approval Sheet** (the contributor
controls their own wording — extend it to credits), and the **Clayton
representation deal** (30% on money actually received, GPM absorbs its own
costs — the shape a contribution-share should take).

**Searched and not found:** the credits list Michael Clay sent. All 39 threads
to and from `itsclaygunn@gmail.com`, plus searches on Gavin, "Believe It",
interview, credits, filmed, videographer. It is not in the mail this account can
see. `SHORTLIST.zip` from the Gavin and Clay photo shoot sits on Clayton's Drive
and is unreachable from GD's account.

---

## 14 · LAW — the GPMx platform purview (2026-09-22)

> **"GPMx PLATFORMS USE ONLY C-OP PROCESS OPTIMIZATION PURVIEW, KF INVENTORY
> BUILDING, ARCHITECTURE, AND DELIVERY."**
> — GD

Four functions. A GPMx platform does these and nothing else.

1. **C-OP process optimization purview** — supervisory. It may look at
   everything, but only to improve *how* the other three are done. Purview is
   not licence: seeing a thing is not authority to act on it.
2. **KF inventory building** — the single door through which items enter. Items
   are built into inventory, and only there.
3. **Architecture** — how inventory is keyed, placed and related.
4. **Delivery** — handing over an item inventory has already blessed.

### The line this draws

The four functions are **mechanical**: repeatable, auditable, testable. Every
function it excludes is **discretionary** — it needs a decision by an
accountable person. That is the whole distinction, and it names how the rubble
accumulated: an AI will make a discretionary decision on request, and a platform
will happily keep it.

**Not platform work, as of this law:** rights and licensing · credits and
royalties · press, PR and artist materials · pricing · artist relations ·
contracts · entity and brand decisions · anything that authors rather than
places.

### The two failure modes to watch

- **Delivery absorbing authorship.** Delivery hands over what inventory blessed.
  The moment delivery chooses, substitutes, reformats for effect, or fills a gap
  to satisfy a layout, it has become authorship — and the item leaves without
  ever passing inventory. This is the general form of the track-title law, the
  no-blending law, and the sK freeze.
- **Purview becoming licence.** C-OP is the only function with a supervisory
  word in it, so it is the one that expands. It may optimize process. It may not
  widen what the platform does.

### Applied to what already exists here

- `scripts/audit-banned-ui-names.mjs`, the price lock, `lib/kkrScales.ts`,
  `lib/satelliteThemes.ts`, `lib/artMusicMatch.ts` — inventory, architecture and
  delivery integrity. **In purview.**
- `epk/` — press and artist material. **Outside platform purview.** It is label
  business that takes the form of a web page. It is correct work; it is not
  platform work, and it should not sit inside a GPMx platform.
- `docs/rights/CONTRIBUTOR_AND_RIGHTS_REGISTER.md` — rights administration.
  **Outside platform purview**, but a legitimate governance record: it is a
  register, not a platform function. It belongs with governance and CORE.

### The gate

`npm run audit:purview` (`scripts/audit-gpmx-purview.mjs`, classifications in
`config/gpmx-purview.json`). `npm run audit:laws` runs it with the banned-name
audit.

Every module serves C-OP, KF-INVENTORY, ARCHITECTURE or DELIVERY, or is declared
OUT-OF-PURVIEW **with a reason and a named owner**. It fails on:

- a module serving no declared function — **an unclassified new file cannot
  pass**, which forces the decision at creation, the only moment it is cheap;
- an OUT-OF-PURVIEW declaration missing its reason or its owner;
- a rule that matches nothing, so the manifest cannot rot into decoration.

It also prints two standing lists rather than burying them: **declared
inventory-gate bypasses**, and the **standing debt** of what is kept outside
purview on the owner's word.

At the time of writing: 60 modules — C-OP 10, KF-INVENTORY 6, ARCHITECTURE 14,
DELIVERY 12, OUT-OF-PURVIEW 18.

**One bypass is declared.** `app/admin/play/page.tsx` says in its own header:
*"no edge functions, no database, no QC status required."* It can play audio
inventory has not blessed — delivery without the gate, which is the first
failure mode above, already present. It is diagnostic only and must never be
reachable in a deployed environment.

---

## 15 · LAW — PREPARED qualifies an Element for Inventory (2026-09-22)

> Every Element type is **PREPARED** — front padding, back padding and the
> **SIGNATURE AUDIO LOGO** — as the final step, **just to qualify for
> Inventory.**
> — GD

**The word is PREPARED.** Not "armed" — that was Claude's word, and it was
wrong. The thing an Element is prepared *with* is the **SIGNATURE AUDIO LOGO**.
Stored data still records the status as
`delivery_audio_materialized_bookend_twinkle`, because that is the vocabulary
across 1,392 records and other tooling reads it. The name of the thing is the
Signature Audio Logo.

Preparation is the last step of **KF inventory building**. It is not a step in
Delivery.

**Only a PREPARED Element is Inventory.** An unprepared one is a *candidate*: it
may be listed, matched and routed internally, but it may never be offered,
priced or checked out, because there is nothing to hand over. All three Element
types — KK, sK, mK — uniformly. The upstream lineage stages (LT-PIX, DKK, NKK,
naked sK) are not Elements and were never Inventory.

### Why here, and not on request at the Release Gate

The alternative was considered and rejected on three grounds:

1. **It has already been run.** Dressing on request was the de facto practice.
   It produced **1,391 unprepared candidates against 1 prepared asset** — a
   catalogue that cannot be sold, and the reason every buyer-facing surface is
   silent.
2. **It puts production inside Delivery**, which is delivery authoring — the
   first failure mode §14 names.
3. **RTG only means something if a pre-made KUT is actually ready to go.** An
   unprepared KK is not.

**The narrow exception:** where the dressing is itself *personal* — a
Commemorative KUT with an ending made for one recipient — it is not catalogue
Inventory at all. It is made-to-order, and must be labelled and priced as such.

### Version stamping

A prepared Element records `signature_audio_logo_version`. When the Signature
Audio Logo changes, nothing already prepared is invalidated — it was lawful when
prepared — and Inventory flags the old stamps for re-preparation on its own
schedule. This is what makes preparation-at-Inventory safe to commit to.

### The gate

`npm run audit:inventory-preparation` in **k-kut**. Fails when an unprepared
Element is exposed to a buyer by `payment_allowed`, a live `checkout_url`, a
`checkout_authority` that is not HOLD, `publication_allowed`, or the same on any
of its routes. Verified by exposing one candidate and confirming exit 1.

It passes today only because everything unprepared sits behind HOLD.

---

## 16 · ROOT CAUSE — why the IIs are not seeding (found 2026-09-22)

GD: *"WHY ARE IIS NOT SEEDING? WHY HELD? I APPROVE ALL!!!!!!"*

The answer is in `data/ii-delivery-registry/romance-reusable-ii-records.json`,
written by GD himself on **2026-08-30**:

> `repair_reason`: **"Owner reported that the 24-second fixed window entered the
> next VTP/InTP and stopped mid-vocal."**
> `owner_confirmation_state`: `REVOKED_BY_OWNER_BOUNDARY_FAILURE_2026_08_30`

**Every Sweet Love candidate is `start 0 → end 24`.** All 48 carry the exact
defect GD reported. The replacement window, `0.000–34.875`, was revoked in the
same action — `a-love-like-that-twinkle-reprosecution-manifest.v1.json` lists it
under `revoked_claims`.

**Both windows are dead. There is no approved boundary.** The candidates are
explicitly evidence only: `may_establish_blk: false`,
`may_be_served_or_sold: false`.

### Why approval does not release it

A hold whose cause is *"the boundary is wrong"* is not cleared by approving it.
Approving these seeds 48 cuts that stop mid-word — which is the abruptness GD
complained of, and which the finishing profile cannot repair. The GPMx KUT
Finishing Standard says so directly: **"A fade must not hide a bad cut."**

### What is actually waiting

`comin_true.deduplicated-v1.json` — **96 items, every one at
`boundary_prosecution_state: HOLD`**, status `CORRECTION_REVIEW_REQUIRED`.
Three are diagnosed `STEPS_PAST_LAST_AUDIBLE_VOCAL_NOTE_END`. **Ninety-three
have never been reviewed.**

Each needs one decision that only a person listening can make: where the last
audible vocal note ends. That is the bottleneck under the silent prototype, the
empty themes, the zero inventory and the 1,391 unfinished candidates. It is not
an approval queue. It is 96 listening decisions.

### What GD's approval does release

`a-love-like-that-twinkle-reprosecution-manifest.v1.json` stands at
`execution_state: PREPARED_NOT_EXECUTED` under
`authority: OWNER_APPROVED_PREPARE_AND_TEST_ONLY_2026_08_30`. Going past
prepare-and-test is genuinely GD's word to give, and nothing else is blocking
it. **Not applied automatically on a blanket approval** — it writes audio, and
the boundary it would write is one of the two GD revoked.
