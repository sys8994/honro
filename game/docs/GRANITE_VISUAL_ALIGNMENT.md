# Granite visual and solid-rim alignment

`mockup-granite-large` and `mockup-granite-small` keep their original independent solid polygons. Their outer visual polygon now copies that rim exactly. All five internal material faces stay inside it; the six existing colours, broad wet/dry granite forms, bounds, sockets, material, scale and map placement remain unchanged.

The earlier `tools/environment/polish-assets.mjs` normalized silhouette was not the original solid silhouette. Its leftmost top envelope sat 157.5 world units below the large rock's physical surface and 81.9 below the small rock's surface (73.71 after the chapter-1 instance's 0.9 scale). A supported body or collision-derived line could therefore appear in open air. `tools/environment/granite-visuals.mjs` is now the shared authoring source; replaying asset polish cannot restore that mismatch.

This repair changes only the two assets' visual arrays in the campaign library. Nine large and seven small instances across chapters 1–6 receive the corrected artwork on a new battle. Collider coordinates, placement, gameplay and save format do not change. Existing saved battles keep their embedded old artwork and exact collision/progress; this is not a save migration.

## Verification

`node tests/granite-visual-alignment.mjs` checks exact source and world-space rim equality, every material-face edge within the solid, six original colours, deterministic authoring replay, all sixteen unchanged placements, six unchanged compiled terrain/material sets and old embedded artwork/terrain after saved-battle sanitization. The before-repair assets and placements are frozen in `tests/fixtures/granite-visual-baseline.json` for reproducible comparisons.

On 2026-10-07 these source/engine checks passed. The maximum top-envelope mismatch is now zero for both asset sizes and all sixteen compiled instances. Running `node tools/environment/polish-assets.mjs` left all other assets and every nonvisual campaign field unchanged.

Native Canvas before/after, low-zoom/mobile scenes, and final integrated Game/Workshop/Pages checks are tracked separately. Native images do not establish browser/GPU performance or normal-play completion.
