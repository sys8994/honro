# Stage31 layer-vector production (in progress)

User-selected production trial: Stage31 estuary and Stage35 bamboo, directed without external Codex tasks.

Stage31 uses an authored collision skeleton from blueprint.json. Actual Inkscape BODY assets are separate from rear/support/surface structures and props. The historical two-panel BODY trial exposed seams and was rejected. The current continuous hybrid BODY and separate foreground replace that trial; final browser/release review remains pending.

Preserve boat arrival/boarding dialogue and four-party boarding event. Upper short gaps and lower continuous route must receive new actual input tests. Current stage31 lower-level helper reports a min-zoom specification mismatch to fix through actual camera bounds, not by disabling validation. Terrain revision must change only when finalized.

Generated `body-full-concept.png` is an alternative stage-specific BODY layer only, not a full-scene trace: it resolves the mid-body seam while props, rear/surface and events remain independent. Its exact source skeleton is `body-full-skeleton.png`; no art is allowed to change collision silently.

All captures/results in `_local/reports/stage31-production` or `_local/reports/stage31-direct/body-*` are intermediate and not visual/gameplay release approval.

## Current layered candidate

`forge.mjs` now composes the bounded hybrid continuous BODY, separately traced FORE ridge and reusable FORE reeds, existing supported timber/architecture, canonical terrain-domain continuations, and the opt-in visual water continuation. It uses internal symbol reuse only for exact repeated vector subtrees. Plain/symbolized native captures matched all16 images exactly. Final release still requires current input probes, direct visual reviews and real browser/Pages checks; running the forge does not approve export.

```
node tools/stage31-production/forge.mjs tools/stage31-production/blueprint.json _local/reports/stage31-production/release-candidate
node tools/stage31/inspect.mjs release-candidate _local/reports/stage31-production/release-candidate/stage31.draft.honro-map.json
node tools/stage31-production/verify-gates.mjs _local/reports/stage31-production/release-candidate/stage31.draft.honro-map.json _local/reports/stage31-production/final-gates
```

The minimum-zoom view uses the actual1600/6800 limit. The shared extension helper snaps only partition rectangles, never the terrain mask. Rejected floating foreground stickers, flat-ended rock strips and two-piece BODY seams remain local diagnostics, not fallback art.

## Portable candidate and shared props

`node tools/stage31-production/package.mjs` extracts only Stage31, its referenced library assets, and its production card into `art/stage31-vector-production/package/`. This is a portable candidate, not a release-gate approval. The original scenic skiff and seven bank reeds now use actual Inkscape shared assets; instance supports and all collision remain unchanged. Reed roots are buried10 world units to eliminate visible flat/floating source bases. Direct same-camera native inspection is in `_local/reports/stage31-direct/common-props-final/`; actual browser HUD/touch and Pages verification are still pending.
