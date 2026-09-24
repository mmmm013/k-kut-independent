# HANDOFF — one step left

**2026-09-24 · G Putnam Music LLC · k-kut.com**

Everything is built, deployed and green. The store is deliberately shut and
will open by itself the moment four Stripe payment links exist at the right
prices.

I could not create them. The safety system blocked it as a real-world
transaction, twice. That is the only thing left.

---

## THE ONE TASK

Create **four Stripe payment links** in the G Putnam Music LLC account.

| Price | What it is |
|---|---|
| **$7.99** | HUG — a whole passage |
| **$4.99** | TUG — one line |
| **$1.99** | BUG — one word, three times |
| **$0.99** | Add-on — personal note, and separately the Story upgrade |

**Each link must:**

1. Have **exactly one line item**, quantity 1, USD, at that exact amount.
   More than one line item and the verifier refuses the link.
2. Set **After payment → redirect** to:

```
https://k-kut.com/delivered?session_id={CHECKOUT_SESSION_ID}
```

Keep `{CHECKOUT_SESSION_ID}` literally. Stripe substitutes it.

**That is all.** Do not copy the URLs anywhere. Do not edit any config file.
The deploy finds them by price on its own.

### Do not touch

The account holds legacy links from an older pricing model — one charges
**$6.99 for "mini-HUG SEXY Moment"**. Leave every existing link alone. Only
add.

---

## What happens after they exist

The next Vercel deploy runs `scripts/prebuild-verify-payment-link-prices.mjs`
before building. It:

1. Lists every payment link and reads the amount Stripe actually charges.
2. Gives each tier the link charging that tier's price.
3. Opens only those. Ambiguity, mismatch, error, or no key → stays shut.

So: create the links, then redeploy (any push, or Vercel's "Redeploy"). The
store opens itself.

---

## Why the store is shut

The BUG link was assigned by **elimination**, the TUG by **age**. Neither was
ever opened. The owner opened the BUG checkout and Stripe showed **$6.99** for
**"mini-HUG SEXY Moment"** against a site advertising **$1.99**.

All three tiers were suspended, not just BUG — all three were chosen the same
guessing way. That was a judgement about the method, not about BUG.

`config/payment-links.json` keeps each URL in `suspended_link`, with
`payment_link` cleared and status `SUSPENDED_PRICE_NOT_VERIFIED_AT_STRIPE`.
The loader gates on `payment_link`, so nothing is purchasable.

---

## What already works — do not rebuild any of this

**Delivery, end to end.** `/delivered` + `/api/delivery`. The page asks the
server; the server asks Stripe whether the session is genuinely paid, then
resolves what was bought and serves it. Buyer hears it and downloads it
immediately. No email sender needed. Hardened against no session, fake
sessions, path traversal and injection — all refused.

**Order resolution.** `lib/paymentLinkOrderResolution.ts`. The store sends
`client_reference_id=kut_<first 16 of the audio's sha256>`. The webhook
understood only `H1|` and `H2_`, so every paid order became
`manual_review_no_delivery`, and the buyer's email was stored as a **boolean**
— present or not, never the address. Fixed: a paid order now carries title,
price, delivery audio, hash, and the buyer's email. Held Elements refuse to
resolve.

**74 Elements** are finished, hash-verified, on disk and priced. 15 HUG, 33
TUG, 26 BUG. They vanish from the store only because checkout is suspended.

**14 law guards**, all passing, all blocking a bad deploy.

**Self-configuring redirect.** `scripts/postdeploy-configure-payment-links.mjs`
sets the redirect on deploy, production only, idempotent, never fails the
build. If the four new links are created with the redirect already set, it is
a no-op.

---

## Prices — settled, not open

```
HUG   $7.99
TUG   $4.99
BUG   $1.99   (one word, three sends)
      $0.99   personal note
      $0.99   Story upgrade — charged UNDER a BUG, on top of it
```

**There is no $2.98 product.** The canonical lock records `STORY_BUG: 298` as
arithmetic ($1.99 + $0.99). Nothing charges $2.98 in one go. The Story upgrade
and the personal note are both $0.99 and are different things.

---

## Repositories

```
mmmm013/k-kut               main            the store
mmmm013/k-kut-independent   claude/epic-rubin-g4evs3   docs and status
```

Both clean and pushed. `NEXT.md` in k-kut-independent carries the wider state.

---

## Known open items, none blocking the sale

- **81 captured-CC corrections** computed and never applied; 59 listed
  Elements ship with a constant renderer widening. Source master is staged at
  `incoming/source-masters/` with a measured −50ms offset, to be verified by
  ear on the first render.
- **The corrected Twinkle** (`gpm_audio_logo.file: null`) is in another
  session and not in Dropbox, Drive or this repo. Blocks new renders only;
  every live Element already carries a signature.
- **Four Elements** carry defects the owner reported himself, with versioned
  trim requests, live per the correction queue's own policy.
- **No purchase has ever been observed.** A green deploy is not a sale. The
  first real payment is the only proof the chain works.

---

## The test, once the links exist

Buy one **$1.99 BUG**. Expect: pay → land on `/delivered` → the song plays →
Download works.

Two dollars proves the redirect, the Stripe verification, the order
resolution and the audio. Nothing else substitutes for it.
