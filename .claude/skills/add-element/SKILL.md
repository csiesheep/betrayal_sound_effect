---
name: add-element
description: Run the full pipeline to add one new element (an item, weapon, monster, room, or hero) to the Betrayal Sound Board end to end — source its sound effect, draw its icon, and register it live on the site. Chains the find-sound-effect and create-image skills together, then adds the element to data/catalog.json in the right category (keeping that category alphabetically sorted) and verifies the real site renders it correctly. Use this whenever the user wants to fully add, finish, or complete a specific item/monster/weapon/room/hero for the soundboard — e.g. "let's do the Ghost next," "add Machete," "finish off the Werewolf" — this is the one-stop skill for taking an element from nothing to fully live, as opposed to find-sound-effect or create-image alone, which each only do one piece of the job.
---

# Add Element

Runs [[find-sound-effect]] → [[create-image]] → catalog registration for
one element, back to back, so "let's do the Ghost" ends with a real,
working, alphabetically-placed tile on the live site — not three
separate manual steps the user has to remember to chain themselves.

## Inputs

An element name (e.g. "Ghost", "Machete", "Entrance Hall") and, if not
obvious, its category. `.claude/skills/find-sound-effect/references/
taxonomy.md` has the full room/hero/monster/item/weapon list if the
category isn't clear from context — ask the user rather than guessing
if it's still ambiguous after checking that.

## Steps

1. **Check what's already done.** Look at `data/sounds.json` and
   `data/catalog.json` first — if the element already has a sound *and*
   is registered in the catalog, tell the user it's already live rather
   than redoing work. If it has a sound but no icon yet, skip to step 3.
   If it has neither, start at step 2.

2. **Source the sound.** Invoke the Skill tool with
   `skill: "find-sound-effect"` and `args: "<element name>"`. This
   pauses for the user to pick from ~3 candidates — don't try to
   shortcut that by picking one yourself. It ends with the sound saved
   under `assets/audio/sfx/<category>/` and cataloged in
   `data/sounds.json`, committed.

   If the Skill tool responds `Unknown skill: find-sound-effect`, the
   current Claude Code session isn't rooted in this repo (project
   skills are only auto-discovered relative to the session's own root,
   not a sibling directory you merely `cd`'d into) — this is a property
   of the session, not a sign the skill is missing or misplaced. Don't
   move or copy the skill anywhere to work around it. Instead, open
   `.claude/skills/find-sound-effect/SKILL.md` directly and follow its
   steps by hand; the result is identical either way.

3. **Draw the icon.** Invoke the Skill tool with
   `skill: "create-image"` and `args: "<element name>"`. This also
   pauses — for you to visually confirm the rendered tile looks right
   before it's called done. It ends with the icon added to
   `index.html`'s sprite and the `ICONS` map in `js/app.js`, committed.
   Same fallback as step 2 if the Skill tool doesn't recognize it.

4. **Register it in the catalog.** `data/catalog.json` is what the live
   site actually reads to build each category's accordion — a sound
   and an icon existing isn't enough on its own if the element was
   never in this list to begin with (which happens for anything beyond
   the handful of examples the catalog started with). For the matching
   category:
   - Add the element's exact `tag` name to that category's `entries`
     array, if it isn't already there.
   - Re-sort the *entire* `entries` array alphabetically (case-
     insensitive), not just insert-in-place — catalog entries added by
     hand over time drift out of order, so re-sorting the whole array
     each time is what actually keeps the guarantee true.
   - If the element's category doesn't exist in `catalog.json` yet
     (e.g. the first Hero), add a new category block. It needs a
     category-level icon too (the accordion header glyph, shown at
     26px — a much simpler mark than a full tile icon). Either draw a
     small new one in the same house style, or use `i-placeholder` as
     a placeholder until one exists — ask the user which they'd
     rather do.

5. **Verify on the real site.** Run `wrangler dev` (see
   `create-image`'s SKILL.md for the exact launch.json setup — same
   process, don't duplicate it here) and open the element's category.
   Confirm three things, not just that it doesn't crash:
   - The "X of N sourced" count went up by one.
   - The new tile sits in the correct alphabetical position in the
     grid, not just appended at the end.
   - Clicking it actually plays the sound and shows the right icon.

6. **Commit the catalog change.** The sound and icon commits already
   happened inside steps 2 and 3 — this is a separate, final commit for
   just the registration:
   ```bash
   git add data/catalog.json
   git commit -m "Register <element> in the <category> catalog"
   ```
   Don't push unless asked, matching the rest of this project's
   workflow.

## Why alphabetical needs re-sorting, not just insertion

It's tempting to just splice the new name into what looks like the
right spot, but that only stays correct if every previous edit was also
done carefully by hand — one slip anywhere in the array's history and
"alphabetical" quietly stops being true without anyone noticing, since
nothing enforces it structurally. Re-deriving the sorted order from
scratch each time is the same amount of work and can't drift.

## A note on scope

Same human-in-the-loop philosophy as the two skills this chains —
sourcing and icon drawing each still pause for a real decision (which
candidate sounds right, does this icon actually read at small size).
Don't blaze through those checkpoints just because this is "the one
skill that does everything end to end." If the user wants a whole
category done, run this once per element and actually look at each
result — style and quality drift fast across a batch nobody's
checking.
