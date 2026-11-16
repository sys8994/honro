# Stage 42 external geology candidate — NOT APPROVED

Scope: replace stretched-pixel boundary painting while preserving gameplay and saves.

Actual browser diagnosis (parent audit): left and right boundaries of stage42 have stretched curve bands, pixelated blur and cut joins.

Candidate generated from the current terrain illustration style, traced in Inkscape 1.4, optimized using the repository terrain-node-optimizer.

- Color trace: 9,265 segments, 416,447 B.
- Optimized: 7,944 segments, 341,821 B.
- Runtime asset: 347,981 B.
- Same-renderer optimizer comparison 1280px: mean channel error .0005395, changed fraction .002331. Growth guard passed.

## Visual outcome

NOT ready for release. Native production Scene at 1440×900, x=200,y=1900,scale=.6 shows sharper geometry without pixel smearing, but the new cliff faces are too broad relative to the source. The vertical seam in first candidate and the faceted overlap in later candidate remain conspicuous. Masking is not a valid fix for mismatch. Do not merge the candidate runtime patch before improving contact art.

Snapshots: `/tmp/stage42-edge-before`, `/tmp/stage42-edge-after`, `/tmp/stage42-edge-after-v2`, `/tmp/stage42-edge-after-v3` in producing environment. They are native Canvas renders, not actual-browser captures.

## Preserved and unchecked

No collision, actor, objective, save, or stage design modification. No deployment. Only west Native candidate evaluated; right candidate and mobile remain unchecked. Stage44 has a related externally observed symptom but needs its own geometry/artwork and is not fixed by this candidate.

## Next action

Create a boundary-continuation source that uses the original cliff's medium face scale and exact upper/lower-road junctions. The two layers must remain independently legible. Do not increase opacity/fade or add pixel samples to hide seams. Render actual gameplay camera at both edges before integrating.

## Subsequent candidate: source-geology continuation

The generated candidate remains rejected. A separate lighter runtime candidate reuses ONLY the original geology group (16 color paths); props/palisade group is excluded. Outside the original image domain, reflected adjacent geology is given different downhill affine slopes (west .32, east .52). This is vector geometry reuse, not pixel-column enlargement or blurred fade. Inside the original extent the source is drawn unchanged. No new runtime asset is required. This is not newly hand-authored exterior geology, and repeated structure remains a design limitation.

Native production Scene comparisons show no stretched bands/vertical cut at both edge joins. The decorative exterior slopes may still suggest a walkable continuation; actual collision is unchanged. The original source's perspective/style itself is out of scope. Actual browser movement, mobile and low-zoom are not yet checked. Renderer was tested at 1440×900, .6 scale; some parallel captures exited 137 and were retried individually, successful final-west run exited 0. East slope candidate exited 0 prior to coverage-only bound reduction.

Pure renderer focused test: `node tests/stage42-edge-geology.mjs`.
Runtime: `shared/runtime/act5-edge-art.js`, separate from the rejected generated-image patch.

## Candidate 3 — native vertical-wall study, NOT DEPLOYMENT APPROVED

Parent rejected source-mirrored candidate 2: repeated face-like symmetry and false walkable stair continuation. Candidate 3 removes source mirroring entirely and uses a separate Inkscape-traced vertical cliff, no stairs/paths/props. Source/collision data remain unchanged. The wall is composited only at the outermost margins, with irregular overlaps below walk-surface contact. Native real-scene render completed for both extreme cameras. No gameplay completion or browser validation is claimed.

Trace: 21,711 segments / 987,022 bytes; optimizer epsilon1.5: 17,612 segments / 675,500 bytes; imported runtime JSON 677,159 bytes. Native 1280 comparison mean-channel error 0.0007810, changed-pixel fraction 0.0000834147. Original tracing and optimizer reports are in `_local/reports/stage42-wall-trace8/` (local review artifacts).

Visual limitation: the separate cliff eliminates blur and fake stair exits, but the joining rock planes still visibly differ from the source. Large exterior cliff masses also change composition. Do not describe this candidate as accepted or production complete. Parent should inspect both native screenshot paths below before integration:
- `/tmp/stage42-edge-wall-v2/stage-42-east.png`
- `/tmp/stage42-edge-wall-v2-west/stage-42-west.png`

Original gameplay-stage JSON and source vector asset are unmodified; runtime focused test verifies no source mutation and no mirror/shear. Both native camera captures assert battle state unchanged during rendering. Stage44 is not changed because this study is not yet accepted.

### Candidate3/v5 follow-up
Exterior wall is now drawn behind source, smaller (.6 source scale), with a sharply descending non-walkable outer silhouette preserving distant scenery. Source retains its walking top; only the outer rock face below it receives irregular masking. No collision geometry is edited. Both native camera renders checked, no state changes. Source-to-new rock detail density still differs and a thin join remains; final approval withheld. Latest captures: `/tmp/stage42-edge-wall-v5/stage-42-east.png` and `/tmp/stage42-edge-wall-v5-west/stage-42-west.png`.

### Direct original-face extension experiment — rejected
`tools/stage42-edge/extend-source.py` expands only existing boundary closure edges of the original geology, preserving interior curves and color fills. Render `/tmp/stage42-edge-direct/stage-42-east.png` proved that this makes large flat diagonal bands. It avoids different material colors but does not reconstruct natural geology. Not connected to runtime. The v5 runtime remains the current unapproved candidate. Further improvement requires an integrated source+exterior art redraw rather than generic edge extrusion or a separate rear panel.

## Recovery review and registered-edge study (2026-11-16)

The inherited integrated candidate was committed as `0992970` before new experiments. It remains rejected: `/tmp/stage42-edge-integrated/stage-42-east.png` shows an obvious diagonal seam and oversized rock faces.

Two BODY replacement experiments preserved the source walking skin using the actual source clip translated down 18 and 64 units. The 18-unit version visibly cuts stairs; the 64-unit version leaves an obvious horizontal join. Both are rejected. The experiment patch is preserved in `rejected-body-skin.patch`; runtime is restored to the inherited candidate, NOT a production-approved state. Native output folders are `/tmp/stage42-continuous-body`, `/tmp/stage42-continuous-body64`, and `/tmp/stage42-body64-noprops`. No production deployment or browser-play pass occurred.

`registered-edge-concept.png` is a new built-in image-generation outpainting study using the original source and approved Stage 21 style reference. The prompt required the central structure to remain unchanged and only exterior geology to extend. The model did not preserve exact registration. Numerical template matching of four original building patches gave local scales 0.92, 0.94, 0.94, and 0.95; therefore this image MUST NOT replace the gameplay terrain wholesale. Original central surfaces and structures must remain canonical. Any future use should be restricted to exterior BODY areas with independently verified joins. It is a concept, not a vector asset or accepted artwork.

Native Inkscape tracing of this new concept failed in the recovered environment: headless GdkPixbuf wrapper initialization crash. A local-only Xorg dummy-screen attempt also failed to open listening sockets, including an approved elevated retry. Do not substitute another vectorizer and claim Inkscape completion. Trace script and source are preserved; failure logs remain under `_local/reports/stage42-registered-trace12/`.

Remote `master` was read as `ae3e6c5461c599e59926dfc1551cd6a34985af36`. The existing local `origin/master` ref is stale. Push of `0992970` failed before authentication (`could not read Username for https://github.com`); no successful remote write or deployment is claimed.

Safe next step: restore a working Inkscape GUI context, trace only the exact-source-registered exterior BODY, then inspect BOTH side joins and source stair contact at native game zoom before integration. The old mirrored/extruded/panel candidates and BODY-mask experiments are not release fallbacks.

### Inkscape recovery and new semantic extraction
The above trace blocker was resolved with the existing reviewed `/tmp/honro-inkscape-headless-init.so` used by the Stage 33 worker. It initializes missing C++ GTK wrappers only; actual tracing and booleans remain Inkscape 1.4. The new color trace has 42,764 segments. Full-image import exceeded the unchanged per-compound budget; no validator was relaxed.

- Exterior BODY extraction: native Inkscape intersections, 10,560 → 9,204 segments, runtime 347,414 B. East/west native renders showed vertical seams and were rejected (`/tmp/stage42-registered-east`, `/tmp/stage42-registered-west`).
- Measured landmark registration: original image x 0/20/510/870/1370/1536 maps to generated x 244/263/700/1027/1501/1658. Scale varies, so a piecewise coordinate registration is used only on the NEW BODY, never original collision or stair source.
- Registered BODY extraction uses the original source geology upper silhouette plus exterior coverage. Inkscape splits the two spatial halves before import to comply with the existing per-compound limit without splitting hole semantics. Scripts preserve the image trace.
- Original SURFACE extraction uses Inkscape union/difference to isolate actually visible authored stair colors from stacked original paths. Four colors alone left mostly thin highlights; a six-color trial restores midtone tread fills. This trial is still under visual review.

Current branch remains **NOT RELEASE APPROVED**. No master merge, public deployment, browser movement, mobile or FPS pass. Native stage/gameplay hashes for the first registered exterior candidate match the inherited stage. Later composition trials require their own checks. West original props can retain a clipped shrub at x=0 and new SURFACE at y=700 can form a horizontal edge; these are not considered resolved. Current image evidence is in `/tmp/stage42-surface-body-east`, `/tmp/stage42-surface-body-west`, and subsequent surface6 folders.

### Native composition correction after b332bb2
Six original stair colors now retain visible tread midtones, with the walking-skin clip limiting the source overlay to 80 source units. The west cropped shrub was replaced using an intact original shrub. These supersede the corresponding unresolved notes above.

A remaining flat gray region over the west sky was isolated by disabling original art, terrain, surface zones, readability and BODY underpaint independently. Only removing BODY or its redundant runtime concave outer clip removed the flat region. The BODY file exactly matches its production project embedding, and its isolated alpha is correct. Removing that redundant outer clip restores the original distant mountains without altering the BODY's own native alpha/source-contact clips. This is a verified native composition correction, not a claim about browser raster implementation. Evidence: `/tmp/stage42-no-outer/stage-42-west.png`, `/tmp/stage42-clean-outer-east/stage-42-east.png`. East still has a narrow top-edge trace and a squared source tread endpoint requiring review. Not release approved.

### Current review candidate: variable walking skin + native ridge trim
A uniform 18-unit source skin erased the stair treads; uniform 80/160-unit skins left broad flat-ground bands or isolated bright rock fragments. The current six-color source overlay keeps flat ground at 18 units, west/central stair regions at 90, and the wider east switchback at 160, with 25-unit transitions. All source path coordinates and collision geometry remain unchanged; only the clip below the authored tread varies. Retaining all 16 geology colors was tested and rejected because it reintroduced a visibly angular, differently textured source patch. Actual tread width was compared against the original east composition.

The BODY extraction now removes the thin generated prop-edge remnant above the exterior contact using native Inkscape intersection, not an extra runtime clipping plane. The east contact follows a short irregular ridge. Optimizer: 18,367 → 16,639 segments; mean channel error 0.0006378, changed fraction 0.003383 at width 1280; original input unchanged. Asset validator budgets remain unchanged.

Regression checks pass: `tests/act5-edge-art.mjs` (updated to test native BODY/SURFACE rather than demand the retired stretch cache for Stage 42), `tests/act5-terrain-contact.mjs`, `tests/stage42-edge-geology.mjs`. The native review cameras complete with battle state unchanged. Evidence folders: `/tmp/stage42-review-west`, `/tmp/stage42-review-east`, `/tmp/stage42-review-center-final`. Original east comparison: `/tmp/stage42-source-east-compare` (image written, process later exited 137; not a full successful capture run).

This is ready for a fresh visual review, **not release approved**. Browser movement, mobile/performance, merged-master and live Pages checks are not done. Native camera art review does not replace those. Push remains blocked by HTTPS authentication (`could not read Username`); local commits are preserved, no remote writes claimed.

### Parent-reviewed endpoint correction
The remaining west/east square fragments were original SURFACE ends, not exterior BODY. A shared irregular contact-depth profile now tapers from 18 units to 1 at x=0/2022 across 30 units; native BODY extraction uses the same profile. The original upper walking contour and gameplay remain untouched. `/tmp/stage42-contact-west` and `/tmp/stage42-contact-east` show the square ends removed; parent inspected both and authorized integration after regression checks. Extra west-stair camera revealed a loose bright source fragment below the common floor; limiting deep stair skin above source y=652 removed it (`/tmp/stage42-contact-west-stairs`). Existing walking top still remains source-authored. Final integration and deployment checks are pending.

Final contact regression: shared irregular depth mask removes both original endpoint square fragments; deep stair skin is now limited above y=652 to avoid carrying unrelated flat-floor fragments. West/east/inner-west native captures complete successfully with state unchanged. Root rechecked both endpoint screenshots and instructed safe integration. The last known remote master before integration is 8292843 (Stage 33 continuity); integration must start there and preserve its generated/cached assets.

## Integration verification (2026-11-16)
Integration checkout starts at remote master 829284310068004baad2ed1f706e4b9e33f8c927. Stage 33 data remains byte-identical (`chapter-33-assets.f64617ed1f410d0a.json`). Release guard 19 tests, production build, stage42 edge regression, Act5 native edge tests, Act5 terrain contacts and Stage33 coastal regression pass. All tracked files the build would have retired were restored from the base revision, preserving older cached clients. Reviewed native SVG/optimizer inputs are retained in `reviewed/`; runtime finishing adds the documented semantic masks and source-colored shrubs.

Attempted real Chromium Stage42 encounter check failed before opening the game: `socket() failed: Operation not permitted (1)` / SIGABRT during browser launch. Therefore neither browser movement/combat nor mobile/performance is claimed as passed. Native fixed-camera captures and state hashes are the visual/geometry evidence, not browser-play evidence. Deployment validation must separately check exact remote commit, Pages entry and chapter-42 payload.

Additional broad checks were attempted, not passed: `current-campaign-contracts` rejects the existing Stage22 author hash (actual abf57c5…, expected cdc4dfa…); `current-runtime-contracts` rejects the existing shared/build.mjs approval hash (actual bb1961a…, expected 3942fa9…). Both files are unchanged from integration-base master, and no approval hashes were rewritten. The Stage31-focused production-contract probe was killed by the environment before completion. These are disclosed limits, not Stage42 test passes.
