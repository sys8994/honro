# Granite visual and solid-rim alignment

`mockup-granite-large` and `mockup-granite-small` keep their original independent solid polygons. Their outer visual polygon now copies that rim exactly. All five internal material faces stay inside it; the six existing colours, broad wet/dry granite forms, bounds, sockets, material, scale and map placement remain unchanged.

The earlier `tools/environment/polish-assets.mjs` normalized silhouette was not the original solid silhouette. Its leftmost top envelope sat 157.5 world units below the large rock's physical surface and 81.9 below the small rock's surface (73.71 after the chapter-1 instance's 0.9 scale). A supported body or collision-derived line could therefore appear in open air. `tools/environment/granite-visuals.mjs` is now the shared authoring source; replaying asset polish cannot restore that mismatch.

This repair changes only the two assets' visual arrays in the campaign library. Nine large and seven small instances across chapters 1–6 receive the corrected artwork on a new battle. Collider coordinates, placement, gameplay and save format do not change. Existing saved battles keep their embedded old artwork and exact collision/progress; this is not a save migration.

## Verification

`node tests/granite-visual-alignment.mjs` checks exact source and world-space rim equality, every material-face edge within the solid, six original colours, deterministic authoring replay, all sixteen unchanged placements, six unchanged compiled terrain/material sets and old embedded artwork/terrain after saved-battle sanitization. The before-repair assets and placements are frozen in `tests/fixtures/granite-visual-baseline.json` for reproducible comparisons.

On 2026-10-07 these source/engine checks passed. The maximum top-envelope mismatch is now zero for both asset sizes and all sixteen compiled instances. Running `node tools/environment/polish-assets.mjs` left all other assets and every nonvisual campaign field unchanged.

`node tools/environment/capture-granite-alignment.mjs` reproduces Native evidence under `_local/reports/granite-visual-alignment/`. An optional `--runtime-root=/path/to/checkout` tests the same two visual arrays against another integration candidate's common Scene; the manifest records the source and runtime commits separately.

The 2026-10-07 Native run used the readability runtime `a7517e2` and granite source `5a01235`, with only the two visual arrays substituted between before/after:

- Both assets at 0.25, 0.4 and 1.5 zoom: zero opaque pixels outside the canonical raster mask and zero missing solid-interior pixels through the production element painter.
- Sixteen paired actual world transforms at 0.4 zoom: the diagnostic cyan collider overlay exactly follows each corrected drawing. This cyan line is inspection evidence, not a new game effect.
- Eight 400×760 common Scene images: identical original-start cameras at 0.4/0.25, plus equal diagnostic contact poses on the large and small rocks. Rendering left battle state unchanged.
- Direct visual review: the large rock's left-side supported feet now meet the visible rim; the small rock uses its actual narrow outline, including its lower recess. The original forest composition, background atmosphere and granite palette remain recognizable at mobile and low zoom. No automatic highlight was added to these sprite assets; the readability patch's safe exclusion remains intact.

These contact poses are deliberate art/collision comparisons, not a claim that the player traversed there normally. Final integrated Game/Workshop/Pages checks remain with the release verification. Native images do not establish browser/GPU performance or normal-play completion.
