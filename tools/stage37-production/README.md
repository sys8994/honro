# Stage37 — cape BODY / original signal mission

Scoped visual-only production. Official source `shared/data/act4/world.json`, runtime `shared/map/compiler.js`, `shared/runtime/act4-content.js` and `shared/runtime/act4-coast-events.js`. No shared runtime/world edits by this worker.

## Immutable gameplay contract

- Original land `a4-37-land` rises3200→2200 with eastern dip; all domain points preserved.
- Original one-way `a4-37-haul-ramp` and `a4-37-broken-wall` untouched.
- Four solid old-wall instances `a4-37-prop-0..3`: x1400/2750/3800/5500; unchanged transforms, collision polygons and collider IDs. Reuse exact-contact common wall only via scoped asset reference, not global library replacement.
- Signal location(7500,1780), backgroundOnly; signal-outcrop and native dynamic gesture remain separate. No invented playable ledge.
- Six enemies/two encounters, original IDs and stats. Original exit7300, party grounded beyond7000.
- Actual Scene must expose unobscured signal AND dynamic gesture for0.6seconds with party beyond5900. Panning away must not earn observation; original signal dialogue receipts required. Preserve all event/mission/save state.

## Pipeline

`skeleton.mjs` snapshots official stage and actual compiled collision fingerprint; BODY mapping x−300,y1700,w8400,h3600. `body-skeleton.png` contains only exact solid silhouette; independent props/platforms are not baked into BODY. `inspect.mjs` uses the real compiler, Native renderer and real Act4 prepare/default act4Sea; outputs local reports, never art approval.

Built-in image generation: Image1 exact skeleton; Image2 Stage32 clean BODY palette/style only. Request exact rising silhouette and eastern dip, narrower olive cap, medium-small slate facets, lower uniform opaque#283344, transparent above, no props/actors/water/sky/noise. Generated `body-concept.png`1915×821RGBA. Silhouette/style looks useful; subtle lower gradient/alpha still remains despite prompt. Actual Inkscape12color trace and separate explicit flat-field cleanup queued; concept is not final.

## Resolved runtime blocker

Native baseline battle creation fails before rendering: `shared/runtime/world.js:59` uses `C.STAGES[st.id-1]`; actual core has36 stage entries, while official content has40. Stage37's enemy creation reaches undefined stage.id. Parent informed for narrow shared-source correction. No fallback to Stage30 combat and no invented stage definition used here. Skeleton compiler extraction itself succeeds; blocked runtime is not reported as passed.

## Trace / assembly checkpoint

The runtime blocker is resolved by focused shared fix `c62ff9b`;31–36 factory parity and actual37–40 enemy creation passed. Baseline runtime evidence is now available under `_local/reports/stage37-production/baseline/`.

Actual Inkscape12-color trace: immutable source/raw11paths; cleanup removed only deep-noise path1 and set path2#283344, all upper paths unchanged. `body-trace-checks.json` records actual operations; direct importer yields14engine nodes without lossy simplification. Native clean image directly inspected. World mapping uses the full1915×821viewBox, no eye-fitted crop.

Assembly preserves all compiled collisions and gameplay fields. Four old-wall instances retain their exact IDs/transforms/collider polygons, with only asset references changed to scoped `s37v:old-wall`. BODY is clipped to original solid, with exact reflected terrain-knot continuation and pixelSnapClip at partition seams; source flat backing continues to40000 beneath the original terrain mask. Explicit `topPoints` includes the western3200-high route (the shared helper's default3000 cutoff is inappropriate here). Internal symbols remove repeated path serialization without simplifying art.

One obsolete nonphysical decorative rear group `a4-coast-37-rear`, its flat support and two distant ridge placements are removed: baseline's rectangular gray band at worldy2900 visibly masked the actual sea image. Native before/after west-contact pixels confirm the hard background rectangle is gone. No physical terrain, signal/outcrop, haul supports, enemy placement or mission objects moved.

Whole, first walls/collision, west contact, wall maximum, signal-mobile and extreme eastern domain views were inspected. No BODY rectangular seam or signal obstruction found. Native buildings and haul props remain their original designs; this is not a full prop redesign or user art approval. FORE is deliberately omitted.

Original actual-App ordinary-input run won with33shots/14rounds. Candidate desktop replay also won, using actual Scene signal/gesture observations, original4 dialogue rows and actual StopBattle/persist/Continue equality. Mobile390×844 replay and negative looking-away receipt probe are in progress; not counted as passed yet. DOM/audio doubles, prepared stage-entry build and sparse Native drawing remain disclosed limitations, not browser/full-campaign evidence.

## Unique signal-outcrop source

The original noncolliding signal outcrop was three broad flat polygons and dominated the live signal view. `signal-skeleton.mjs` renders its **existing** silhouette into800×1120: x−400..400,y−800..320, crucial shelf x−120..100,y−420, spire apex(210,−750). Built-in generation uses that exact stencil plus37 BODY style; generated `signal-outcrop-concept.png`1060×1484 has restrained vertical slate faces/moss, no fire/person/sky baked. Original actor/fire placements and visual shelf anchors remain separately protected. Actual Inkscape trace is complete. Only this scoped scenic visual changes; it never becomes a new collision/route.


## Final signal asset and package

Actual Inkscape12-color raw has11 paths and no embedded raster. The raw remains immutable. Five oversized path strings were quantized on an absolute Bézier grid0.01, preserving curves (no flattening/GEOS/Simplify); maximum control-point displacement bound0.007071 source units. Direct import then yields14 nodes. Normal424px and maximum880px comparison has RGB MAE0.00476/0.00334 on0–255; alpha difference and silhouette displacement0. Protected shelf/apex checks at8× supersampling also show0 alpha displacement. These measure tracing-optimization error, not generated-source fidelity.

The original scenic silhouette supplies exact clipping/backing, preserving the shelf supporting the separately rendered gesture and fire; it is not a physical BODY mask. Only instance `a4-coast-37-art-12.assetId` changes. All original element IDs/transforms, four wall collider polygons, terrain, units, events, encounters and mission bindings remain equal. Native final whole/contact/max/mobile/domain images are in `_local/reports/stage37-production/signal-final/`; no screenshots are committed as release assets. Existing native haul structures remain intentionally untouched.

Portable `art/stage37-vector-production/package/{stage,library}.json` is publisher input; full candidate/skeleton projects are disposable local rebuild outputs. Rebuild with `node tools/stage37-production/skeleton.mjs`, importer configs, then `node tools/stage37-production/assemble.mjs`. Package status remains candidate-not-art-approved; technical tests do not confer user art approval.


## Final actual App verification

Final candidate desktop1440×900: PASS33,271 physics frames/33shots; mobile390×844: PASS33,445frames/33shots. Both performed actual StopBattle/persist/Continue atframe12,735 with exact units/objective/round/active/phase equality; both earned native Scene signal+gesture exposure0.6, presented original A4.S37.SIGNAL.01–04 and closed signal before the ordinary all-party exit interaction. Mobile uses the separately retained closer-approach tape (archer x7423.65 vs desktop7232.40), not a camera or mission modification. Earlier desktop-tape/mobile timing failure remains local and is not a pass.

Both negative looking-away camera probes rendered0.8s at an ordinarily reached state and minted no observation receipts (exposure0); camera restored before continuing positive replay. This is a deliberate camera probe, not UI pointer evidence. Actual wall records include standing samples for props0/2; the original tape goes over walls rather than hitting them, so no projectile-wall-hit claim is made for37. All four exact original physical colliders are preserved by compile equality.

Final live desktop/mobile screenshots were directly inspected: separate native gesture/fire rest on the protected shelf, player remains on original ground. Evidence summaries/fingerprints in package/app-evidence.json; full traces and PNGs stay local. Sparse Native renders every60ticks until signal observation, DOM/audio doubles and prepared official stage-entry build are explicit scope limits. This does not replace browser/mobile-device QA, full campaign replay, or user art approval.

## Decorative footprint follow-up

`assemble.mjs` now reuses the actual Inkscape common coastal boulder for the four
collision-free haul-footing instances. A uniform450/236 fit reduces the old oversized718-unit
nominal footprint; rotations follow native point/control supports. The old first
and last corner anchors left half a wide rock unsupported. Their decorative x
positions move2200→2510 and5480→5700 along the same unchanged flat platforms;
IDs, y, scales, collision and all mission/event data remain unchanged. The two
winches remain recognizable worksite equipment rather than being replaced by
unrelated scenery. Current Native visual views: `natural-props-grounded/`.

This visual follow-up supersedes the earlier statement that all decorative
transforms remain unchanged. Existing App evidence retains its original source
fingerprint; it is not relabeled as a new replay. The assembler rechecks exact
compiled terrain and gameplay equality; final browser/combined release review
remains outstanding.
