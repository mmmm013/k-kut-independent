# KLEIGH EPK — new build

Built 2026-09-22 on `claude/epic-rubin-g4evs3`, on GD's instruction to build new
rather than recover the 2024/2025 material.

`index.html` is the whole kit: one page, one destination. It is self-contained
apart from `assets/kleigh_portrait.jpg`.

## What replaced what

| Old | New |
|---|---|
| `EPK.pdf` — a one-page placeholder reading "EPK (placeholder) / Use previous v2.7 / v2.6 EPK if needed" | Dropped. Not reproduced. |
| `epk.html` + `press.html` + `index.html` + `links.html` (one of which was never supplied) | One page. No link can point at a page that does not exist. |
| Contact `info@musicmaykers.com` | `KLEIGH@gputnammusic.com`, stated once, with the routing rule printed on the page so it enforces itself. |
| Footer `©2025 musicmaykers, llc` | `© 2026 G Putnam Music, LLC`. **Settled by ruling, 2026-09-22.** |
| `press.html` shipping the build note "Place one-sheet as assets/KLEIGH_OneSheet.pdf to preview here." | Gone. Nothing unbuilt is described to a visitor. |
| Images gallery containing only `assets/mm_logo.png` — the logo presented as press imagery | Replaced by a materials list. Files are released on request with credit and terms attached, rather than posted bare. |
| No biography, no three-identities section | The triptych: KLEIGH / Michael Clay / Clayton Michael Gunn, and the CyberStar designation. |
| No link out | `mmmm-art.com`, twice. |

## The banned-name ruling, and what it cost

> "MUSIC MAYKERS IS BANNED FROM UI DISPLAY. ALWAYS & ONLY G PUTNAM MUSIC."
> — GD, 2026-09-22

The two DISCO playlist embeds could not survive it. The player renders
**"By Music Maykers, LLC"** inside its own frame, in our page, to every visitor;
it is the DISCO workspace's account branding and cannot be overridden from our
markup. The embed host `musicmaykers.disco.ac` carried the name a second time,
in the `src` and in every fallback link.

So the embeds and their links are gone, and listening now points at
**gputnammusic.com**, which is ours, displays the right name, and already hosts
the KLEIGH Spotlight. Reference audio for press and sync is released on request
with credits attached.

**To put embedded players back:** rename the DISCO workspace to G Putnam Music,
or serve the player from a G Putnam Music domain. Nothing else about the page
has to change. `scripts/audit-banned-ui-names.mjs` will keep telling the truth
about it either way.

`npm run audit:banned-ui-names` — exits 1 on any occurrence of the banned name
in rendered text, alt text, titles, hrefs, embed sources, filenames or UI data.

## Preserved exactly, by instruction

- The tagline "Krooning from Down Under!"
- "Vocalist based in Australia; label/management in the USA."

## Nothing on this page is invented

Every claim is traceable to GD's own statements or the old pages. There are no
reviews, awards, streaming figures, venue names, dates, influences, release
history or sound descriptions, because none were supplied. The page says less
than a finished EPK should, and says nothing untrue.

## Missing, and where it is

**`KLIEGH EPK PDF.pdf`** — an EPK DRAFT sent by Clayton Gunn to
`gputnam@gputnammusic.com` on 2026-01-08 ("THOUGHTS?? K"), Gmail message
`19ba061960520f10`. Nine months newer than the placeholder. It is almost
certainly where the biography, track titles and credits live.

It could not be read from this session: Gmail attachments cannot be downloaded
with the tools available here, and the file is in neither Drive nor Dropbox.
The companion Canva design (`DAGH_Jaj1-Y`) and the Dropbox Transfer link are
both blocked by this environment's network egress proxy.

**To unblock:** save that attachment into Dropbox. PDF text can be read from
there directly.

## Photographs

`assets/kleigh-press-01.jpg` — KLEIGH against a sandstone rock face. Supplied
by GD 2026-09-22.

`assets/kleigh-portrait-featured.jpg` — **the slot exists; the file does not.**
GD sent the studio portrait (black shirt, hands clasped) but it did not reach
the session's disk, so there were no bytes to write. It is the same photograph
the old `epk.html` referenced as `assets/kleigh_portrait.jpg`. Drop that file in
under the new name and both the masthead and the gallery pick it up. Until then
each `img` removes itself rather than rendering broken.

## Settled by ruling, 2026-09-22

1. **Entity.** G Putnam Music, LLC. Music Maykers is banned from UI display.
2. **Downloads.** GD: *"NO IDEA. FIX IT."* Settled: **nothing downloads off the
   page.** Streaming lives at gputnammusic.com; downloadable reference audio is
   released on request, so every file leaves with its writer, performer and
   publisher credits and its terms attached. This is the same rule the press
   materials already follow, and it matches the stated principle on the stream
   page — *stream first, save what you love when it is available.* Reversible
   in one line if GD wants open press downloads instead.

## Still open

3. **Photographer credit and usage terms** for both photographs. Unknown, and
   required before either file is released to anyone outside.
4. **Track titles and credits.** The page asserts none. The KLEIGH Spotlight on
   gputnammusic.com shows three; they are not reproduced here without credits.
5. **Biography.** Needs to be written and artist-approved. The triptych is an
   introduction, not a biography.
