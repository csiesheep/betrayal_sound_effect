---
name: find-sound-effect
description: Find and add a royalty-free sound effect (or music bed) for the Betrayal at House on the Hill sound board — an item, monster, room, weapon, hero, or sting. Searches Pixabay for candidates, verifies each is real license-clean audio, presents options for the user to pick from, then saves the chosen file into assets/audio/sfx/ (or assets/audio/music/) and catalogs it in data/sounds.json with full source/license metadata. Use this whenever the user asks to find, add, source, or grab a sound effect for the sound board, wants to build out its content, or just names something from the game — a monster, item, weapon, room, or hero — that needs audio, even if they don't say "skill," "Pixabay," or "sound effect" explicitly (e.g. "let's do the chainsaw next" or "we need something for the zombie").
---

# Find Sound Effect

Sources one royalty-free sound effect at a time for the
`betrayal_sound_effect` project, following the exact process that was
manually validated against Pixabay: search, shortlist, verify, let the
user choose, save, catalog, commit. The goal is a `data/sounds.json` that
is a reliable, self-documenting record of where every audio file came
from and what license it's under — the design doc calls this the single
thing that saves you if licensing is ever questioned, so don't skip it.

## Inputs

A short name/description of what needs a sound — e.g. "Flashlight",
"the Chainsaw", "Zombie", "Entrance Hall ambience", "Traitor reveal
sting". If it's ambiguous whether something is a one-shot SFX or a
looping ambience/music bed, ask.

## Step 1 — Figure out the category and search terms

Map the request to one of the folders under `assets/audio/sfx/`:
`items/`, `weapons/`, `monsters/`, `rooms/`, `heroes/`, `stings/`, or
`assets/audio/music/` for background beds. `references/taxonomy.md` in
this skill has the full room/hero/monster/item/weapon list from the
design doc if you need to double check spelling or which category
something belongs to (e.g. is "Machete" a weapon or item — it's a
weapon). If genuinely unclear, just ask the user rather than guessing.

Turn the name into 1-3 search terms a sound library would actually be
tagged with. "Chainsaw" → search "chainsaw" and maybe "chainsaw revving"
separately if the first pass doesn't turn up a clean start/idle/stop
sound. Think about what the *sound* is, not just the item name — a
Crossbow's SFX is really "bowstring release" + "arrow thud".

## Step 2 — Search Pixabay and shortlist ~3 candidates

Open `https://pixabay.com/sound-effects/search/<query>/` in the browser
and read the results. Pixabay is the default source because every file
on it is covered by the **Pixabay Content License** — free for
commercial use, no attribution required — regardless of what the
individual contributor's name says (files "by freesound_community" are
still under Pixabay's license once hosted there, not Freesound's
original license).

Pick ~3 promising candidates by title/duration/relevance. **For anything
landing in `assets/audio/sfx/` (items, weapons, monsters, rooms, heroes,
stings), only shortlist candidates under 15 seconds** — a soundboard
one-shot that runs longer than that stops feeling like a button-press
cue and starts feeling like a music clip. Skip longer results entirely
rather than including them as an option; if the first page of results
doesn't turn up 3 candidates under 15s, narrow the search terms (e.g.
"chainsaw start" instead of "chainsaw") before broadening. Background
music beds in `assets/audio/music/` are the one exception to this cap —
those are meant to be 2-5 minute loops, so ignore duration there and
instead look for something explicitly described as loopable.

If Pixabay genuinely has nothing suitable, fall back to:
- **Freesound.org**, filtered to **CC0** only (skips per-file attribution
  tracking — anything else on Freesound needs its license read and
  recorded individually).
- **Zapsplat**, free tier — requires attribution unless the user has a
  paid account; note this in the catalog entry if used.

## Step 3 — Get the direct file URL for each candidate

Clicking Pixabay's "Free download" button doesn't do anything
script-observable — no visible modal, no new network request fires from
it. Don't chase that. Instead, the direct CDN URL is already sitting in
the page's HTML, reachable without any login:

```js
// run in the browser on the candidate's Pixabay page
document.documentElement.outerHTML.match(/https?:\/\/[^"'\s]*\.(mp3|wav|ogg|m4a)[^"'\s]*/g)
```

This returns a `cdn.pixabay.com/download/audio/...` URL. That URL is
genuinely public — it's the same one Pixabay's own download button would
use — but only responds correctly to a **GET** with a real `Referer`
(the Pixabay page URL) and browser-like `User-Agent`; a bare `curl -I`
(HEAD) 403s for reasons that don't matter, so always verify with a full
GET, never HEAD.

## Step 4 — Verify each candidate is real audio

For each shortlisted URL, fetch it to a scratch temp file and check it's
actually audio, not an error page:

```bash
curl -s -D - -o /tmp/candidate.mp3 "<cdn-url>" \
  -H "Referer: <pixabay-page-url>" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
file /tmp/candidate.mp3   # expect "MPEG ADTS, layer III" etc, not "XML" or "HTML"
```

Note the `Content-Length` (file size) and what `file` reports (bitrate/
sample rate) — you'll need these for the comparison table. **This
verification fetch is scratch-only** — it confirms the link works, it is
not the final save. Don't write anything into `assets/` yet.

## Step 5 — Present candidates, let the user choose

Show a table: title, artist, duration, format/size, license, and any
notable flag (Pixabay marks some files "AI modified or generated" — call
that out, some users will care, some won't). Then stop and wait for the
user to pick one, ask for more candidates, or reject the batch and
broaden the search. **Never skip straight to saving a file** — the whole
point of shortlisting is that the user picks, not you.

## Step 6 — Save the chosen file for real

Once the user picks:

```bash
curl -s -D - -o assets/audio/sfx/<category>/<name>.mp3 "<cdn-url>" \
  -H "Referer: <pixabay-page-url>" \
  -H "User-Agent: ..."
```

`<name>` is the in-game entity's own name, normalized to lowercase with
underscores for spaces — `Chainsaw` → `chainsaw.mp3`, `Zombie` →
`zombie.mp3`, `Flashlight` → `flashlight.mp3` — **not** a description of
the specific candidate's source title (a candidate called "Chainsaw
Start" or "AudioPapkin's Chainsaw" both still just become
`chainsaw.mp3`). The point is that every file is findable by the
in-game name alone, regardless of which candidate ended up winning or
what the source happened to call it.

If an entity genuinely needs more than one distinct sound — the design
doc calls for this on weapons, e.g. Chainsaw wants a rev-up *and* an
idle loop *and* a tearing impact — keep the entity name as the base and
add a short action suffix instead of inventing a new name:
`chainsaw.mp3` for the primary/default sound, `chainsaw_idle.mp3` /
`chainsaw_impact.mp3` for the others. Ask the user which slot they're
filling if it's not obvious from how they phrased the request.

## Step 7 — Catalog it in data/sounds.json

Append an entry (create the file as a JSON array if it doesn't exist
yet) matching the schema already in use:

```json
{
  "id": "<category>-<name>",
  "title": "<the sound's title on the source site>",
  "category": "<item|weapon|monster|room|hero|sting|music>",
  "tag": "<the in-game name, e.g. Flashlight>",
  "file": "assets/audio/sfx/<category>/<name>.mp3",
  "source": "Pixabay",
  "artist": "<artist name as shown, including the (freesound_community) suffix if present>",
  "license": "Pixabay Content License",
  "attribution_required": false,
  "source_url": "<the pixabay.com page URL, not the cdn URL>",
  "date_downloaded": "<today, YYYY-MM-DD>"
}
```

If sourced from Freesound or Zapsplat instead, adjust `source`,
`license`, and `attribution_required` accordingly (Zapsplat free tier →
`attribution_required: true`, and put the required attribution text
somewhere the credits page can pick it up — ask the user if there isn't
one yet).

## Step 8 — Commit

```bash
git add assets/audio/sfx/<category>/<name>.mp3 data/sounds.json
git commit -m "Add sound effect: <title> for <tag>"
```

Don't push unless the user asks — same as the rest of this project's
workflow, commits happen locally first and get pushed deliberately.

## A note on scope

This skill handles one sound at a time by design — sourcing is a
judgment call (does this candidate actually sound right for the
game?), so it stays a human-in-the-loop step rather than something to
batch-automate. If the user wants to build out a whole category at
once, just run through steps 1-8 repeatedly, one sound per round of
candidates.
