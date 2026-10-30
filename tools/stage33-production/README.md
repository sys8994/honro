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
coastal events and actual Native Canvas Scene rendering every 300 simulation
frames (bounded actual snapshots, not continuously rendered play). DOM/audio/storage and frame scheduling are doubles. No actor/resource/
event forcing is allowed in the normal input policy. This is not evidence of
playing preceding chapters or browser/mobile hardware. Any boundary fixtures
must be explicitly separate from the normal full-mission replay.

## Official baseline observations (not candidate approval)

The normal earned-SP input policy completed at frame 20,476 / round 10, all four
heroes alive beyond the physical exit and all five enemies defeated. Two actual
encounter groups damaged the party. Tide warning was presented, followed by high
round 5 and low round 7. Three real east-channel recoveries occurred naturally;
no water state or poses were forced. Independent replay of the recorded inputs
also won and used original App stopBattle/persist/Continue at frame 11,233 during
high tide, preserving exact units, objective state, phase, round and active hero.
Both original tide-warning dialogue receipts were observed by actual rendering.
These results use the official baseline project, not the pending art candidate.

```
node --expose-gc tools/stage33-production/verify-app-observations.mjs art/stage33-vector-production/official-project.json tools/stage33-production/fixtures/normal-earned-inputs.json _local/reports/stage33-production/replay.json
```

Native Canvas renders are bounded snapshots every 300 simulation frames. A more
frequent native snapshot experiment exhausted process memory; this is not a
reproduced deployed-browser leak. Parent owns final browser HUD/performance QA.

BODY trace: actual Inkscape 12-color stacked smooth/rembg, immutable raw retained.
One independent .0002 Simplify on path4/path8 only, then .01 absolute coordinate
quantization on path4 only, satisfies bounded import (15 nodes). Raw→final native
raster comparison at widths 1400/2940 passes: protected contact changed fraction
0, silhouette displacement 0; RGB MAE .0433/.0326. Actual contact crops reviewed;
small raw interior tan quantization freckles remain. Deep source rows .82–.98
are uniformly opaque #283e4a, establishing the extension's deep-fill color.
This is source optimization review, not completed in-world art approval.

## Packaged candidate (current frozen renderer)

`art/stage33-vector-production/package/{stage,library}.json` is the scoped
portable candidate, not user-approved or deployed by this worker. Assemble with
`node tools/stage33-production/assemble.mjs`. Source exact collision and all
units/events/tide/water/mission conditions are asserted unchanged. BODY and its
same-domain continuation use the current pixelSnapClip helper; two internal
symbols save 666,066 bytes with **12 actual renderer images pixel-identical**
to plain expanded assets. SURFACE is independent, shifted28 world units to fit
the traced contact and clipped to the exact compiled refuge polygons. Common
reeds are distinct REAR/FORE roles; existing skiffs/rocks/supports remain.

Final candidate input replay on runtime7c810d9 won in20,476frames with20shots,
all4party alive, and exact actual Continue at11,233 during high tide. Actual low
and upper shots, grounded traversal of both refuges, both tide-warning receipts,
25%maxHP same-bank recoveries/action spent/focus not deducted are captured in
`package/app-check.json`. A separate ordinary-input-prefix **synthetic occupied
bank fixture** verifies pending/no relocation/no HP loss rather than opposite
bank teleport. It is not a natural-occupancy or campaign-clear claim.
720×1100 native replay also won with actual inView/tide receipts; high-tide
snapshot reviewed. Sparse rendering and DOM doubles do not establish real HUD,
continuous camera behavior, browser/mobile performance or prior campaign play.

Three distinct review passes: overall two-basin structure; contact/underpass/
actor readability; mobile/high-tide/domain/deep-fill coverage. Current renders
are `_local/reports/stage33-production/final-current/` and actual input-state
screenshots in `final-current-replay-shots/`, `mobile-current-replay-shots/`.
Known visual limits are explicit in `package/visual-review.json`: retained
conductive water has an existing vertical left display edge nearx3550; extreme
outer-domain reflected rocks are visibly symmetric; small tan trace freckles
remain. Parent final browser/release review is still required.


## Targeted focal-prop / shallow-shore cleanup

Parent review rejected the old focal rock/skiff silhouettes and rectangular east-water edge. Actual common Inkscape raw imports replace only collision-free `env:rock` and `a4-art:abandoned-skiff` instances using scoped s33v IDs. Boulder12nodes/skiff15nodes fit uniformly to actual Inkscape ink bounds, not padded full canvases; original visible widths236/900world retained. Lowest ink edge is at local foot0. Five boulders follow their **original** support slope with6world-unit burial; IDs/x/scale and all physical terrain remain unchanged. Three skiffs retain original transforms. Moss became slate gray in10-color boulder trace (documented source fidelity limitation); raw paths are unchanged and no additional lossy optimization was needed.

`vectorWaterInsetTaper` opts in only east-channel display: the upper painted edge starts2world units above the actual floor atx3550 and rises to the original flat waterline over48world units. Original bottom stays grounded; no extension onto dry land. Only the returned paint clip differs—surface datum, materials, physical waters, conductivity, recovery and tide remain original. Native regression validates floor paint, removal of tall edge, immutability, Engine parity and untouched25/27/31/no-flag behavior. Native final views are under `_local/reports/stage33-production/shoreline-final/`; legacy support piers remain unchanged and are not newly approved artwork.


Final cleanup replay: desktop1440×900 and mobile720×1100 both PASS20,476frames/20shots, actual Continue exact at11,233, three same-bank recoveries and both original tide-warning receipts. Desktop sampled trace, transitions, shots, recovery checks, final units and entire objective are exactly equal to the preceding candidate (`package/cleanup-parity.json`). The synthetic occupied-bank fixture was rerun and passed; it remains explicitly synthetic, not natural gameplay occupancy. Package evidence is rebound to the cleanup project fingerprint. Mobile high-tide and max/normal/whole/contact pixels were directly reviewed; early sparse camera/HUD/browser limits still apply. The earlier retained-rock/skiff and vertical-edge notes above describe the superseded candidate, not the current package. No user art approval inferred.


## Final bounded rear-pier polish

Parent requested replacing the four large triangular rear supports after focal-prop review. One new built-in generated natural upright coastal stone pier uses the reviewed boulder as palette/style reference only, not the rejected triangular source as art direction. `stone-pier-anchor-contract.json` records all four original top/foot/buried-base anchors and the generation prompt. One normalized300world-high asset is reused with uniform instance scaling; width becomes naturally narrower, while original peak and bottom world positions are preserved. These are existing noncolliding rear props, never new firing cover or walking platforms. `import-stone-pier.py` uses actual Inkscape ink bounds and preserves full source viewBox; no margin-based eye fit. This is a single scoped polish, not a whole-scene redesign.


Actual pier trace:12colors,11paths,278503bytes, no images/Simplify; direct runtime import14nodes, no additional lossy approximation. Ink bounds[71.234,107.733,817.793,1488.1] give normalized300high×164.8665wide. Source/raw attributes equal; fine midtone patches and thin gray fringe remain disclosed. Actual whole/normal/max and mobile high-tide pixels inspected under `pier-final/` and `pier-final-mobile-replay-shots/`; four wide triangles are replaced by quiet narrow columns without changing top/base anchors.

Final pier candidate desktop/mobile actual App runs both PASS20,476frames,20shots, Continue11,233, three recoveries and original tide receipts. Full sampled desktop trace/transitions/shots/recovery checks/final units/objective exactly equal previous shoreline-final candidate (`package/pier-parity.json`). Occupied-bank fixture rerun passed with its original synthetic scope. Package evidence rebound to final pier fingerprint. Earlier notes about retained triangular supports are now historical. No additional scene redesign or user art approval is claimed.
