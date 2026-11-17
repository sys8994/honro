# Stage43 native continuity: review history

Current status: native continuity is deployed in `007dd3adec2209ff081440de5698272e368244e0`. Public review found small terminal defects; the follow-up below is awaiting final public verification. Earlier “pending” statements in this chronological record describe their named checkpoints, not the current deployment.

## Changes
- `shared/act5-world.mjs`: attaches `nativeContinuity.deep/west/contact` only to `act5:near:43`. Original vector/clips/anchor/bounds/collision and stage data stay unchanged.
- `shared/runtime/act5-edge-art.js`: Stage43-specific native order BODY behind → original → west/contact in front. No old y697 front rectangle, foreground source rewrite, or sampled/stretched edge cache. Painted culling bounds are the union of original bounds and actual attached asset bounds (including anchors).
- Stage43 joins the existing exterior-only terrain-domain continuation and non-walkable boundary readability suppression. Walkable edges and collision remain intact. Stage43's exterior clip uses the same rounded device-pixel edge as domain tiles; other stages keep their prior clip behavior. No renderer-wide rounding change.
- Three native asset snapshots plus provenance JSON under `shared/assets/environment/act5/stage43-continuity-*`. All use `silhouetteUnderpaint:false`. Source-to-source transforms already reside in the assets; the landmark applies its normal source→world scale once.

## Local checks
- `node tests/stage43-native-continuity.mjs`: paint order, original/state purity, no sampled cache, bounds union, stage-specific pixel rounding, other-stage clip behavior, and standard vector validation passed.
- `makeAct5()` before/after serialized comparison: all ten stages and content entries identical; every original library entry identical after removing only Stage43's new `nativeContinuity` attachment. Thus authored collision/actors/objectives and original source vector/clips are unchanged.
- In-memory runtime assembly (`HONRO_ACT4_RELEASE=1 HONRO_ACT5_RELEASE=1 runtimeParts(...)`), all244 scripts parsed successfully. No generated production HTML or public files written.
- Full Stage43 near asset including current final-contour attachments:2,900,415 serialized bytes, under existing4MB core asset cap.
- Native Canvas direct landmark-hook smoke render succeeded and was visually inspected: `_local/reports/stage43-integration/native-composition.png`. This is NOT full Scene, browser, campaign play, or visual approval.

Existing `tests/act5-edge-art.mjs` now recognizes Stage43's native branch rather than expecting a sampled-edge cache. Unrelated stage tests were not run en masse. Parent owns actual normal/mobile Scene and final contact review.

Provenance hashes and review status are in `shared/assets/environment/act5/stage43-continuity-provenance.json`. Replace only the contact snapshot and update its provenance after final approval; do not import recovery runtime wholesale.

## Current unresolved visual review
Parent reports two issues still under diagnosis: fine lower seams may arise from repeated per-layer clip antialiasing; the y710 horizontal seam may involve the original alpha end710 versus deep start710.02. The contact worker is preparing a separate candidate. This integration does not claim either issue fixed and makes no further runtime change to hide them. Local commit is a preparation checkpoint, not approval or deployment.

## Contact postclip / west v2 follow-up
- Stage43 contact alone now paints its unchanged native color stack onto a transparent surface with the exact current device transform and visual color context. Its seven original shared root-chain clips are applied only to the final composited image, not independently to every paint layer. Branch-local or pixel-snapped clips are not generalized into global clips; unsupported shapes fall back to normal vector drawing.
- Prepared geometry and Path2D objects are cached by asset identity. No viewport bitmap is retained by this hook; existing domain tiles cache normal terrain results. Scratch surfaces have fixed device-tile origins, are capped at2048×2048 (16MiB maximum), skip offscreen contact bounds and are released in `finally`. Normal/mobile current viewport and domain-raster scale are preserved. Caller clip, alpha and compositing apply once.
- `node tests/stage43-contact-postclip.mjs`: actual Native Canvas normal1440×900 and mobile390×844 match the independent full-viewport postclip diagnostic exactly (maxRGBA0, changed pixels0). Same-scale repeats and scale/viewport change remain consistent; asset JSON and all seven clips unchanged; every scratch surface released. The test is contact-only, not a full Scene or campaign verification. Render evidence is in `_local/reports/stage43-contact-postclip/`.
- West snapshot replaced with `stage43-west-final-study/v2/asset.json`; provenance SHA updated. Parent reports its normal Scene review removed the hanging rounded knot. Final integrated alpha/end contact remains under review.
- The source-alpha710/deep710.02 gap is not altered by this runtime patch. A separate asset correction is still pending. No general vector renderer or other-stage rendering semantics changed.

## Browser / build limitation reported by coordinator
First local game build succeeded (805 files; gameBytes17379), but these runtime/asset updates require a fresh build. Build outputs are review-only and must not be included in the candidate commits. Cloud-browser opening `http://localhost:8768/HONRO_WORKSHOP.html` failed with `net::ERR_CONNECTION_REFUSED`; subsequent error-tab lookup was URL-policy blocked. No tunnel or permission workaround was attempted. Local server/build availability and Native Canvas checks are NOT evidence of real-browser success. Deployment remains prohibited pending approval.


## Final contour-alpha candidate update
Contact snapshot and provenance now use the SHA44e1d68e contour repair. All original protection clips, including source-alpha-or-deep, remain present. Its added native lower contact follows the original bottom contour rather than deleting alpha protection. Parent verified that actual center Scene matches the successful no-source-alpha diagnostic byte-for-byte; source-contact worker reports no new door/arch fill, no exterior intrusion, no change above650, and only11 lower-notch pixels intentionally joined. Those worker/parent findings are reported as such, not as a new independent browser test.

Both focused integration/postclip tests pass again with this exact final asset; normal/mobile postclip reference remains pixel-identical and all native data stays unchanged during drawing. All serialized stages, collision/content and original vectors still match the initial baseline. Final full Scene west/east/center/mobile and320×932 extreme-mobile review is being performed by the coordinator. Build outputs remain excluded from commits. No remote/master/Pages action.

## Full native Scene review after contour repair
Current source checkpoint `518f97a` was rendered without runtime string overrides or candidate injection. West, east, bottom-center at1440×900 and min-east at320×932 were inspected. The previous rectangular contact band, hanging west endpoint and lower per-face clipping seam are removed. The west source/deep outer contact retains a small corner rather than a broad nonwalkable shelf. Portrait coverage extends below the viewport without a flat cutoff; the previous domain-tile line is absent. These are native Canvas Scene observations, not browser or campaign-play certification.

All four views kept stage SHA256 `edaa868800a3836bfc9b6c6becb80e9a008c9334dc8bc7a3740688617f52884a` and gameplay SHA256 `5010609ff55f6623fa522911bf5e37970b9ef10ff1d683f56507eef784dba538`. Desktop first render1144–1332ms, cached26–31ms; narrow portrait first701ms/cached94ms. These diagnostics are not device-performance targets or browser benchmarks. Local evidence remains under ignored `_local/reports/stage43-integration/final-*`.

The final sequential `HONRO_ACT4_RELEASE=1 HONRO_ACT5_RELEASE=1 node game/build.mjs` passed:805files; game17379bytes/workshop4011bytes; embedded entry `web/entries/game.f368874ddeb8474a.html?embedded=1`. A concurrent build during native capture exited137; the same build passed when run alone. Generated web files remain uncommitted until final publication staging.

Public release remains pending. The browser could not reach the local HTTP server (`net::ERR_CONNECTION_REFUSED`); it has not verified this candidate. Public GitHub Pages has not been changed. GitHub whole-file connector preservation is being completed within supported inputs; no split-file upload or alternate encoding is used.

## Exact deep coordinate serialization
Deep native JSON is now 1,019,106 bytes, down from 1,344,909. Existing 0.1-raw-grid values become exact integers with a per-path 0.1 transform; shorter absolute/relative/smooth commands preserve all 64,414 parsed segments, 12 paths, existing compound boundaries and control points (floating comparison tolerance1e-8). No node removal, precision reduction, partitioning or transport encoding. Original SHA313dd1be remains preserved in the recovery study; optimized SHA5a01aebe is recorded in provenance. The engine validator returns no errors.

Inkscape full-body700/1400px renders are byte-pixel identical. Native Canvas coordinate/CTM arithmetic has small AA differences, so native pixel identity is NOT claimed: direct normal/mobile/maxzoom maximumRGBA7/5/5. Actual full Scene normal bottom-center max2,151 changed pixels, MAE0.0000388/255; mobile min-east max4,94 changed pixels, MAE0.0001473/255. Both full Scene alpha arrays are identical; every changed pixel is on an existing local color boundary. Changes occur below the preserved architecture (normal screeny743+, mobiley428+); enlarged A/B inspected with no shape or support change. This is shape-preserving serialization, not new art.

Reproduction and original/candidate evidence are preserved in `stage43-deep-serialization-study`: serialize-integer.py, asset-integer.json, report-integer.json, render.py, inkscape-report.json, check.mjs, native-report.json, scene.mjs, compare.py, scene-comparison.json, and before/after PNGs. Integration contact/west/runtime remain unchanged. Public deployment and browser verification still pending.


## Public verification and terminal follow-up, 2026-11-17
The earlier pending-public statements above are historical checkpoints. Source ac97f31ef19a4048471070d86307894975932d9b built successfully in Actions43981253977; generated/master007dd3adec2209ff081440de5698272e368244e0 deployed successfully in Pages43981780847. Public HTML, ordered-common-18 runtime and chapter43 asset bytes matched that generated commit.

Actual Pages UI entered43 via the existing “디버그 · 기록 분리” journey book, without changing normal records. Right movement reduced movement budget1100→1016. Minimap camera movement to center/east and wheel zoom were observed. Central stairs retained original stone faces; lower native contact no longer exposes the broad rectangular band. No full battle completion or performance certification is claimed.

One Chromium tab displayed error code9 after a camera attempt. One normal reload recovered the tab; repeat43 entry, movement and center/east camera controls worked. Extension metadata errors were logged, but there is no evidence attributing the crash to a particular game function.

Public default zoom exposed a short square west terminal missed by the earlier wide view. New west candidate preserves the inward/source boundary and contracts only the exterior below sourcey680 to actual deep upper-left(4.76315789473685,710.02), with a0.1-source-unit overlap ending710.12. A rejected y750 taper and point-convergence triangle-gap candidate are preserved separately. This is a geometry edit, not a node-reduction optimization. Native1.65/.45 views remove the ledge and long claw; final public same-framing review remains pending. Original source, gameplay, deep/contact and runtime are unchanged by this west edit.

East public view also exposed an approximately11-source-unit wedge: original alpha ends aroundx2158.85 at709.9, while BODY starts aroundx2169.86 at710.03. A shared native root clip limits only the new deep/contact exterior betweeny710..740. Deep-only left a52-pixel contact remnant, so both use the same clip. All existing paint-root structures/path strings are identical; deep/contact file growth is243/234bytes. Original architecture/walking surfaces and runtime remain unchanged. Native same-camera review removes the bright wedge; final public confirmation pending.

Final sequential integrated west/east Native Scene captures completed exit0. Stage and gameplay SHA remain edaa8688/5010609f. Focused native-order/validation and eight-clip postclip tests pass; postclip still matches its independent normal/mobile pixel reference exactly. An earlier overlapping capture exited137 after writing its PNG; it is recorded as failed, not silently counted as a successful process.
