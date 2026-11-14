# HONRO terrain path optimizer (V2)

Non-destructive candidate generator for decorative vector geometry. It does not automatically apply candidates, build the game, run gameplay QA, or deploy. The tool contains no LLM/API calls: Python performs simplification, and Inkscape renders candidate comparisons. Human/AI visual review is a separate step.

## Files
- `optimize_package.py`: adapter for JSON with `assets[].vector` (root/symbol path `d` or `dParts`).
- `optimize_svg.py`: standalone SVG candidate generator and shared geometry routines.
- `test_optimizer.py`: 18 geometry regression tests; `test_cli.py` adds two CLI help smoke tests.
- `validate_canonical.py`: canonicalization-only corpus check, no simplification.
- `requirements.txt`: Python dependencies; Inkscape CLI must also be installed separately.

## Setup and test (repository root)
```sh
python -m venv .venv-terrain
# Linux/macOS; Windows: .venv-terrain\Scripts\activate
. .venv-terrain/bin/activate
python -m pip install -r tools/terrain-node-optimizer/requirements.txt
inkscape --version
python -m unittest discover -s tools/terrain-node-optimizer -p 'test_*.py' -v
```
The publication run passed 20 tests. Existing corpus validation checked 291 relative-m paths; independent review sampled all 2,122 parseable paths at five parameters with zero point difference after canonicalization. This is not a proof for all SVG syntax or topology.

## Package usage
```sh
python tools/terrain-node-optimizer/optimize_package.py \
  shared/data/act2/stage17-compact-package.json \
  _local/reports/terrain-opt/stage17-candidate.json \
  --asset-id 'traced-(west|east)' \
  --epsilon 24 --max-area-error .20 \
  --max-mean-error .01 --max-changed-fraction .04 --widths 1280,2560
```
This is the user-selected **balanced visual preset**, not a global mandate for every asset. In the tested Act 2 chapter 7 decorative pair it reduced 24,914 path segments to 5,642 (77.35%). Do not force a 77% reduction, a byte target, or these tolerances onto every stage. Epsilon 64/area .50 was rejected as too spiky.

The JSON CLI defaults are stricter: epsilon 1, area .02, mean .8/255, changed fraction .01. Asset selection defaults to `traced-(west|east)`; identify actual IDs in each stage. Never use `--asset-id '.'` blindly. An unsupported package schema needs a separately tested adapter, not guessed conversion. This script does not discover the active files for stages 1–40.

## SVG usage
```sh
python tools/terrain-node-optimizer/optimize_svg.py input.svg \
  _local/reports/terrain-opt/output.svg --epsilon .5 \
  --render-widths 1280,2560
```
The SVG CLI does **not** expose `--max-area-error`; it uses the conservative .02 shared default. It skips transform/effect/CSS/defs and other complex contexts. Do not assume JSON adapter protections and SVG protections are identical. In particular, styled or inherited strokes need explicit inspection before applying standalone SVG output.

## Algorithm and units
1. Preserve lexical M/m subpath boundaries and explicit open/closed semantics; convert relative moveto to absolute geometry using the original current point.
2. Keep explicit closing curves before Z. Do not use a serializer that replaces the final curved segment with a straight close.
3. Adaptive Bézier flattening uses 20% of epsilon; Ramer–Douglas–Peucker uses 79%; coordinate rounding budgets 1%.
4. For each subpath, retry epsilon divided by 1,2,4,8,16,32 and choose a smaller candidate that passes guards.
5. Signed area/direction checks reject collapse; small subpaths can remain unchanged. No deliberate subpath deletion or color-face merging.
6. Render original/candidate through Inkscape at two widths. A failed asset is restored to its original vector.

**Epsilon is in vector/viewBox coordinates, not screen pixels.** For maximum scale z px/unit, a desired screen error p requires epsilon no larger than p/z, with transforms also accounted for. The JSON adapter conservatively divides epsilon by the product of matrix norms throughout the asset, which can overconstrain complex assets and cost processing time. Per-subpath epsilon is not globally minimum-node optimization. Area guard uses `max(abs(area)*ratio, epsilon²)`, so the ratio alone is not a strict bound for small shapes.

## Preservation and limitations
- Input/output must differ; existing output is refused. Keep original hashes, generate fresh candidates from the same original, never repeatedly simplify the previous candidate.
- JSON adapter is intended to change only `assets[].vector` path d/dParts. Clips, transforms, IDs and game data should remain equal. Independently compare all JSON after masking only d/dParts; the built-in non-vector check alone is weaker.
- JSON stroke/protected IDs and unsafe symbol use contexts are preserved. Missing/cyclic symbol references fail closed. Semantic contact ROI is **not** automatically inferred from IDs.
- Nonterminal Z sequences and arcs are conservatively preserved. `dParts` are simplified separately; confirm each is a complete valid path and preserve compound fill behavior. Unsupported formats must be logged, not reported optimized.
- Winding/area guards do not prove no self-intersection, no hole damage, or exact topology. Fewer path segments are not necessarily fewer Inkscape nodes, contours, draw calls, or GPU triangles.
- Whole-image average error can hide local damage and be diluted by transparent canvas. Report painted-region error and inspect contact edges, seams, thin bridges, holes and important landmarks.
- Unchanged collision JSON does **not** mean the visible ground/contact outline is unchanged. Thin terrain strips, stairs, roofs and ceilings need special protection and actual in-game checks. Prefer preserving their silhouette or skipping them.
- Raster thresholds use premultiplied RGBA. Changed pixels are those with any channel difference >16/255. The current report's segment counts describe attempted candidates even when an asset later fails raster acceptance; inspect `accepted` and independently recount final output.
- Inkscape is not the Canvas renderer. Passed raster gates do not prove gameplay correctness or FPS improvement. No full gameplay/FPS verification or game deployment was performed for the published tool.

## Required acceptance before game application
1. Inventory current master stage 1–40 active source assets, actual runtime format, transforms, render scale, far-image/terrain separation and contact roles. Read current SOP and stage-specific instructions.
2. Generate separate candidates per asset; retain original hashes, commands and comparison images. Keep rejected candidates out of source paths.
3. Compare normal, zoomed, mobile and camera-edge renders; explicitly inspect contact lines, stairs, jump edges, landings, holes, projectile visibility and alpha seams. Restore or protect damaged geometry.
4. Use isolated saves and the real game/Workshop renderer to check movement, jumping, collisions, aiming, water, interaction and completion in changed regions. Do not alter monsters, skills, goals, events, progression or user saves to make a test pass.
5. Measure original vs candidate with identical viewport/device/zoom/camera motion and workload. Inspect current `tests/performance.py` and `package.json` for available performance commands. Record render time, frame p50/p95, loading, heap and limits; node reduction is not an FPS result.
6. Build using the current repository workflow; change source files, not generated HTML manually. Commit verified batches, preserve concurrent work, and follow release guards. Do not claim master/Pages deployment until verified separately.
