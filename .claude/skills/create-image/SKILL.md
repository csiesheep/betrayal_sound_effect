---
name: create-image
description: Create the icon/image for a sound tile on the Betrayal Sound Board — a hand-authored SVG line-art icon in the project's established house style, wired into the live site (index.html's icon sprite + js/app.js's ICONS map). There is no image-generation tool available in this environment, so this hand-draws real SVG markup rather than calling an image API — the same process used to make the Flashlight, Chainsaw, and Zombie icons already in the repo. Use this whenever the user asks to create, draw, design, or add an icon/image for an item, weapon, monster, room, or hero, or says something like "make an image for the X" or "the ghost needs art" — even if they don't mention SVG or icons by name.
---

# Create Image

Hand-draws one icon at a time for the `betrayal_sound_effect` soundboard,
in the same two-tone line-art style as the 3 icons already shipped
(Flashlight, Chainsaw, Zombie), then wires it into the live site so the
matching sound tile switches from the dashed "needs art" placeholder to
a real, playable button. Mirrors [[find-sound-effect]]'s shape —
one asset at a time, human-in-the-loop, verified before it's called
done — but for images instead of audio.

## Inputs

The name of an item/weapon/monster/room/hero that needs an icon. It
almost always needs to **already have a sound** sourced via
`find-sound-effect` first — see "Why sourced-only" below.

## Why sourced-only

In this app's data model, "has a custom icon" and "is playable" are
meant to go together: `js/app.js` only shows a tile as filled-in
(clickable, custom icon) when the entity has a matching entry in
`data/sounds.json`. Drawing an icon for something with no sound yet
would either get thrown away or force a confusing half-state — a
pretty tile that does nothing when tapped. If the user asks for an
icon on something unsourced, say so and offer to run
`find-sound-effect` first (or do both back to back if they want).

## The house style

Every icon lives as a `<symbol id="i-{slug}">` inside the hidden
`<svg><defs>` sprite near the bottom of `index.html`, referenced
elsewhere as `<svg><use href="#i-{slug}"></use></svg>`. Look at the
existing `i-flashlight`, `i-chainsaw`, and `i-skull` symbols there
before drawing a new one — they're the ground truth, more reliable
than this description if the two ever disagree.

- **`viewBox="0 0 24 24"`.** Every icon shares this canvas regardless
  of the object's real proportions, so a flashlight and a chainsaw read
  at the same visual weight in the grid.
- **Two-tone construction**, not a flat single-color glyph:
  - `class="fill-dim"` (muted amber) + `stroke="currentColor"` (brighter
    amber) at `stroke-width` ~1.2 for the main filled body shapes.
  - `class="fill-void"` (the page's near-black background color) for
    cavities that should read as *cut into* the shape rather than just
    absent — eye sockets, a nostril, an open mouth. This is what makes
    hollows look hollow instead of looking like a gap in the drawing.
  - `class="stroke-only"` with `fill="none"`, thinner `stroke-width`
    ~0.6–0.9, for texture/wear marks that shouldn't read as solid
    shapes — teeth ticks, cracks, vents, grip lines, motion lines.
- **~8–13 elements total.** Enough to read as an illustration, not a
  flat icon-font glyph — but every element should be a plain
  `rect`/`circle`/`ellipse`/`line`/short `path` with a handful of
  points. No long hand-authored path data; if a shape needs more than
  ~6 path commands to describe, simplify the shape instead of fighting
  the coordinates. Getting a 13-point path exactly right by hand
  without visual feedback is how icons come out warped.
- **75% fill, not 100%.** The `.tile svg` CSS rule already sizes
  whatever you draw to 75% of the button — draw at the full 24×24
  canvas and let CSS handle the scaling, don't pad the artwork itself.

### Composing a new icon from scratch

For anything that isn't a close cousin of the 3 existing icons (a
room, a hero, a card sting), think in this order rather than staring
at a blank canvas:

1. **Silhouette first.** What's the single biggest shape — the thing
   you'd draw first if someone said "sketch a chainsaw in 2 seconds"?
   That becomes the main `fill-dim` body.
2. **One or two defining details.** The specific feature that makes
   *this* object recognizable and not a generic stand-in — the
   chainsaw's chain teeth, not just "a bar shape." Without this, every
   icon in a category starts looking the same.
3. **Texture marks.** A few `stroke-only` lines that sell the
   "engraving/woodcut" feel — cracks, scuffs, rivets, whatever fits.
   These are cheap to add and do a lot of the work.
4. **Cavities as `fill-void`, not gaps.** If the object has a natural
   hollow — a window, an open mouth, an eye socket — cut it out with
   `fill-void` rather than leaving negative space, which just looks
   like a mistake instead of a design choice.

## Steps

1. Confirm the entity has a sound in `data/sounds.json` (see "Why
   sourced-only"). Note its `tag` value — the icon's `data-name` /
   `ICONS` key must match that exactly.
2. Draw the `<symbol>` following the house style above. Pick a slug
   (lowercase, hyphenated) for the id — `i-skeleton-key`, not
   `i-flashlight-2`.
3. Validate the SVG structurally before touching the real files —
   there's no visual feedback loop while hand-authoring coordinates, so
   bugs have to be caught by static analysis, not by eyeballing it.
   Count open vs. self-closed tags per element:
   ```bash
   perl -e '
   my $svg = q{<symbol id="i-example" viewBox="0 0 24 24">...</symbol>};
   for my $tag (qw(rect circle ellipse line path)) {
       my $count = () = $svg =~ /<$tag\b[^>]*\/>/g;
       my $unclosed = () = $svg =~ /<$tag\b(?!.*?\/>)[^>]*>/g;
       print "$tag: self-closed=$count\n";
   }
   '
   ```
   Every `rect`/`circle`/`ellipse`/`line`/`path` must be self-closing
   (`/>`) — these are void-ish SVG shapes, not containers.
4. Add the `<symbol>` to `index.html`'s existing sprite `<defs>` block
   (near the other `i-*` symbols, before `</defs></svg>`).
5. Add the entity to the `ICONS` map at the top of `js/app.js`:
   ```js
   const ICONS = {
     'Flashlight': 'i-flashlight',
     'Chainsaw': 'i-chainsaw',
     'Zombie': 'i-skull',
     'Skeleton Key': 'i-skeleton-key',
   };
   ```
6. Verify it for real, not just structurally — run the site locally
   with `wrangler dev` and look at the actual tile:
   ```bash
   # Browser tool's preview_start, using the "wrangler-dev" launch.json
   # config. That config currently lives in the *obsidian vault's*
   # .claude/launch.json, not this repo — the harness's browser-preview
   # commands run from the vault directory even when the work is
   # happening in this sibling repo. If it's missing, recreate it:
   #   runtimeExecutable: "bash"
   #   runtimeArgs: ["-c", "cd /mnt/c/Users/sheep/code/betrayal_sound_effect && npx wrangler dev"]
   #   port: 8787
   ```
   Once it's running, navigate to the category the entity is in, open
   it, and use `computer` `zoom`/`screenshot` on the grid — a symbol
   that's structurally valid can still look wrong (elements out of the
   0–24 canvas, a fill-void cavity landing outside its parent shape,
   proportions that don't read at 75% scale). Confirm it before moving
   on.
7. Commit the icon + `ICONS` map entry together:
   ```bash
   git add index.html js/app.js
   git commit -m "Add icon: <entity name>"
   ```
   Don't push unless asked.

## A note on scope

Like `find-sound-effect`, this handles one icon at a time by design —
drawing is a judgment call (does this silhouette actually read at small
size?), so it stays human-verified rather than something to
batch-automate. If the user wants a whole category illustrated, just
repeat steps 1–7 per entity, checking each one visually before starting
the next — style drift compounds fast if you draw several in a row
without looking.
