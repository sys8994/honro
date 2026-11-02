# Stage14 cavern-village BODY material candidate

Scope: static near-terrain geology only. The source is the existing 7600×10400 `해가 닿지 않는 마을`, not a new map. Houses, yards, lamps, timber bridge, family roof-step, gate, rear household rocks, image far background, NPCs, rescue events, physics, units and camera remain original. `gate-bridge`, `refuge-bridge-walkway`, and `v14-family-roof-step` are explicitly not baked into BODY paint.

## Production pipeline

- Read current source and effective production-story stage independently. Capture the pre-runtime-author project with `capture-stage14-contract.mjs`; never copy quest objects from the effective stage into that guard.
- `inspect-stage14-source.mjs` renders the existing stage and saves compiled world/physical geometry. Local silhouettes are taken from that same original geometry. The full-domain source covers original terrain extent x=-6000..13600, y=-24000..34400; it is decorative underpaint, not new collision.
- Original reference pixels viewed: Act1 `stage02/body-v2/source.png`, `stage10/floor-v4/source.png`. Their outdoor green palette is not carried into the sunless inhabited cavern.
- Every actual image-generation request and referenced path list was saved as `prompt.txt` **before** the call. Rejected first-grain and ceiling/domain sources remain at the local production root. The seven selected source files are immutable and SHA256-recorded.
- The upper/refuge first versions were rejected at original actor-size source-scale preview before tracing. Revised material has smaller irregular angular faces and thin dusty caps. Ceiling is bare rock, without the rejected soil rim. Local scans are separate from the immense quiet domain so outdoor extensions do not enlarge play material.
- Real Inkscape fixed-palette binary tracing uses output-path-specific profiles. Four-color domain was rejected for noisy near-palette thresholds and an over-budget compound; a two-tone trial imported but looked too flat near the actual cave window. Domain-v3 was regenerated with four well-separated subdued connected planes at the visible edges; the selected trace is 68 KB RAW. No limit was raised.
- Bounded optimization uses immutable raw, strict protected contact/ceiling lines and 1×/2× raster checks. Native canonical solid clips and 4-world-unit walk-contact insets are decorative only. Local upper/refuge/vault skins omit their two darkest complete underpaint color layers (#293a3e and #33464a) above the domain, retaining image-derived irregular ends; no handmade rock polygons or rectangular taper masks are invented.
- `preview-stage14-art.mjs` uses production authoring, native Canvas and the shared renderer. Actual battle/world/units invariance is asserted. Whole-map overview is diagnostic, not a claim that an illegal camera zoom is playable. Legal minimum-zoom, normal entry/market/family/refuge, edge and mobile views are separately captured.

## Reproduction and limits

All heavy comparisons and multi-view renders must use `flock /tmp/honro-heavy-art.lock`; run serially with bounded Node heaps. A killed process is not a pass. Do not edit shared tools or runtime to accommodate this candidate.

The hook is stage-specific and is intentionally not wired into the shared dispatcher by this worker. Parent owns master integration, normal save/full mission, browser and Pages verification. Native geometry/artifact checks do not imply those gates passed.

Production root: `/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage14`.

## Pixel measurement scope

Free-floating SVG trials exposed tiny antialiasing changes on generated outer edges that are occluded in production. Acceptance compares RAW and optimized art in **the same actual canonicalSolid/contactInset and underpaint context**; these are not relaxed thresholds. Local upper/refuge/vault comparisons omit the same two darkest full base layers exactly as native assembly does and include the immutable domain trace behind them. Per-part `pixel-composed.json`, composed comparison SVGs, strict 1×/2× reports and original RAW remain inspectable. Do not mislabel rejected free-SVG protected-edge trials as passes. The source→trace palette/binary-alpha loss is recorded separately from optimizer loss.

Selected optimizer uses the original relative moveto tokens, preserves whole contact-touching contours verbatim, bounds interior cubic replacement at 0.04 source pixels, and rounds only unprotected interior coordinates to 0.1 (maximum point displacement≈0.071px). Strict measured gates, not this analytic estimate, determine feasibility. Lossless decimal delimiter/unused-ID cleanup has separate exact RGBA equality checks at 1×/2×.

## Commands (selected local production tree)

```sh
# Actual Inkscape tracing, after preparing fixed palettes/configuration:
python tools/act2-vector-production/prepare-stage14-trace.py
# Reproduction command; source/palette and RAW bytes are recorded in trace-report.json.
# Helper derives an exclusive profile from the full output path.
python tools/act2-vector-production/trace-stage14-palette.py "$PART" "$PART/trace" --image "$PART/source.png" --speckles 4 --remove-white-background
# Optimize immutable raw; select only candidates passing strict native-context gates:
python tools/act2-vector-production/optimize-stage14-relative.py "$PART" 9
python tools/act2-vector-production/minify-stage14-svg.py "$PART/candidate-relative.svg" "$PART/final.svg"
python tools/act2-vector-production/compose-stage14-metrics.py "$BASE" "$NAME" final.svg
flock /tmp/honro-heavy-art.lock python tools/vector-production/compare-svg.py "$PART/composed-raw.svg" "$PART/composed-candidate.svg" --config "$PART/pixel-composed.json" --output-dir "$PART/qa-final"
python tools/vector-production/import-svg.py "$PART/final.svg" --config "$PART/config.json" --output "$PART/native.json"
flock /tmp/honro-heavy-art.lock python tools/act2-vector-production/prove-stage14-lossless.py "$PART" "$PART/candidate-relative.svg"
flock /tmp/honro-heavy-art.lock node --expose-gc --max-old-space-size=1800 tools/act2-vector-production/preview-stage14-art.mjs "$BASE"
python tools/act2-vector-production/package-stage14-candidate.py
node --max-old-space-size=1800 tests/stage14-traced-art.mjs
```

Read each selected part's `optimization.json` for its exact preservation configuration; rejected contact trials must not be substituted for that record. The optimization script's optional third argument tightens the curve-replacement bound; the fourth can preserve complete specified palette paths. Neither changes pixel acceptance limits.

Family courtyard preserves the complete original #979789 highlight path, not merely its contact-touching contours. A controlled per-color probe isolated that path as the source of the failing 1× contact-edge antialias result. Wider protection pads, zero curve replacement, and cap-only preservation were rejected; their local logs are retained. The selected path is original geometry with lossless lexical packing, with strict full-scale verification still mandatory.
