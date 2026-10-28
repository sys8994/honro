# Stage33 — 물 빠진 갯길 visual production

Status: official-source scaffold and BODY concept prepared; actual Inkscape
trace, integrated art review and final-source input validation pending.
No release/visual approval follows from this status.

## Fixed gameplay contract

Source is `shared/data/act4/world.json`, NOT preview regeneration. Preserve all
three exact terrain polygons/platform controls, all actor/enemy positions,
conductive channels, water policies, tide timing/opportunities, required party,
exit and dialogue IDs. New BODY cannot include water, refuge platforms, skiffs,
actors or event marks. Two elevated refuges and their underpasses stay separate.
`source-contract.json` records official geometry/gameplay and compiled hashes.

## Semantic art plan

- BODY: unique continuous exposed silt/slate bank, generated from actual compiled
  full-domain skeleton, then actual Inkscape trace. Flat deep material integrates
  with the single terrain domain; no extra collision/skirt.
- SURFACE: retain both exact one-way refuge profiles, separately readable from
  the lower mud route. Do not visually bridge the central break.
- REAR: reuse supported skiffs/pier pieces and grounded shared reeds; do not bake
  them into BODY. Keep original event-bearing IDs intact.
- FORE: sparse existing shared reed/near-bank assets below walking feet; use real
  semantic FORE pass and its actor/objective protection, never hide live tide.
- WATER/FX: existing runtime live tide and conductive shallow channels only.

## Concept lineage

Style plate: `art/stage31-vector-production/body-small-concept.png`.
Edit target: `art/stage33-vector-production/body-skeleton.png`, generated from
actual compiler worldTerrain. Mapping is in `body-mapping.json`.
Selected concept: `body-concept-opaque.png`, built-in imagegen, 2026-10-28.
Prompt: exact shallow twin-basin silhouette; opaque white exterior; 8 flat colors;
broad blue-slate and muted ochre-silt planes; uniform deep #293d49 bottom quarter;
no water, foliage, props, background or noise. Earlier transparent variants were
rejected for alpha-removal holes in the dark lower fill and preserved locally
under `_local/archive/stage33-production/`, not used for tracing.
The opaque concept still requires exact source clipping and Inkscape palette
cleanup. Imagegen is not collision authority or automatic art approval.

## Commands / scope

```
node tools/stage33-production/skeleton.mjs
node tools/stage33-production/inspect.mjs baseline art/stage33-vector-production/official-project.json
node tools/stage33-production/play-inputs.mjs art/stage33-vector-production/official-project.json _local/reports/stage33-production/normal-input campaign-spent-v1
```

Native App adapter uses earned stage-entry SP, original Engine, App, Story,
coastal events and actual Native Canvas Scene rendering every 30 simulation
frames. DOM/audio/storage and frame scheduling are doubles. No actor/resource/
event forcing is allowed in the normal input policy. This is not evidence of
playing preceding chapters or browser/mobile hardware. Any boundary fixtures
must be explicitly separate from the normal full-mission replay.
