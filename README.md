# Betrayal Sound Effect

Fan-made sound & music board for *Betrayal at House on the Hill* (3rd Edition).
Static site (HTML/CSS/vanilla JS + Web Audio API), no backend.

See the full implementation plan: [design doc](https://github.com/csiesheep/obsidian/blob/main/Projects/betrayal%20sound%20board/design.md)

## Structure

```
index.html
css/style.css
js/                     → app logic + Web Audio mixer (TODO)
data/                   → sounds.json metadata (TODO)
assets/audio/sfx/       → short one-shot sound effects
assets/audio/music/     → looping background tracks
```

## Status

Live at `https://games.csiesheep.com/betrayal_sound_board/`.
