# This repository deploys nothing. On purpose.

GD, 2026-10-08: "these 2 split deploys. This IS wrong, so I wonder why NEVER
addressed?"

He is right, and here is what the split actually was.

## What was happening

Two Vercel projects were building on every push:

- **k-kut** — the real site. Every customer domain points at it: k-kut.com,
  13hugz.com, i-meant.com, sentimeant.com, sentimeants.com, songandchance.com.
- **k-kut-independent** — this repository. It also carries a `package.json`
  named `k-kut`, an `app/` and a `lib/`, so Vercel saw a Next.js project and
  dutifully built it.

But what it was building was a **fossil**. This repository holds 28 files under
`app/` and `lib/`; the real site holds 212. Its application code was last
touched on **2026-09-22**. Every push since has deployed a two-week-old
half-copy of the storefront to a preview URL nobody visits.

That is the "split deploy": not two sites, one site and one stale ghost of it
that kept raising its hand every time anything was pushed here.

## What this repository is actually for

Masters, finished video cuts, screenshots, records, drafts and notes. Things
that must be kept and must not be lost. Not a website.

## What was done

`vercel.json` now carries `"ignoreCommand": "exit 0"`, which tells Vercel to
skip the build before it starts. Nothing here deploys. Nothing here is served.

The stale `app/` and `lib/` are deliberately NOT deleted. They are a record of
what the site looked like on 2026-09-22, and this repository exists to keep
things rather than tidy them away. They simply no longer build.

## The one thing a person still has to do

Skipping the build leaves the Vercel project itself in place, listed and empty.
If he wants it gone from the dashboard entirely, that is a delete in Vercel's
own settings for the `k-kut-independent` project — one click, and nothing in
any repository can do it from here.
