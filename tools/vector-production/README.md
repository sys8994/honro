# Inkscape SVG → existing HONRO vector v1

This is a geometry importer, **not an art generator**. Keep the reviewed Inkscape
source and original collision data. No runtime/dependency/budget changes.

Requires the existing Python `svgpathtools` environment. From repository root:

```sh
python tools/vector-production/import-svg.py reviewed.svg \
  --config asset-config.json --output asset.json
node tools/vector-production/test-import.mjs
```

Explicit config (all coordinates are in authored/output units, not screen pixels):

```json
{
  "id": "stage31:body-piece",
  "name": "Reviewed BODY piece",
  "semanticLayer": "BODY",
  "category": "rock",
  "bounds": {"x": 0, "y": 0, "w": 1200, "h": 600},
  "anchor": {"x": 0, "y": 0},
  "foot": {"x": 0, "y": 0},
  "transform": [2, 0, 0, 2, 0, 0],
  "params": {"artRevision": 1, "collisionSource": "authored-stage-terrain"}
}
```

`transform` is optional: a source-coordinate → output-coordinate SVG affine
matrix. Source `viewBox` is retained in `params.sourceViewBox`; it does **not**
implicitly fit/crop/translate the art. The runtime viewBox uses explicit output
bounds; the existing renderer treats it as metadata, not a viewport transform.
To map source viewBox `[sx,sy,sw,sh]` to output bounds `[x,y,w,h]`, explicitly use
`[w/sw,0,0,h/sh,x-sx*w/sw,y-sy*h/sh]` (only when this distortion is intended).
Anchor is then applied by the existing renderer; foot remains reference metadata.
Assets outside the source viewBox remain authored geometry, not silently cropped.

Optional `bodyClip` is an array of 1–32 **exact existing collision path strings**
in output coordinates. It wraps only an asset explicitly declared `BODY`, outside
its source-to-output transform. Mixed-layer SVGs must first be authored/exported
as separate semantic assets. REAR/SURFACE/FORE clipping is rejected. The importer
never derives collision from art and always emits `collision: []`.

Reference `<image>` elements cause an error by default. Explicitly add
`--remove-reference-images` to remove them (including hidden images); removed IDs
are recorded. Metadata/title/description/namedview are removed. Original source
is never modified, embedded into the runtime asset, or subject to the optional
300,000-character `vector.source` limit. Final output is path geometry only.

## Fidelity and limits

- Paths, rectangles (including rounded/clamped radii), polygons, polylines,
  circles, ellipses and lines; nested affine transforms; inherited solid fill,
  fill rule, stroke, alpha, width/join/cap. Relative commands become absolute;
  curves/arcs remain curves/arcs. Coordinates serialize at 15 significant digits.
- Only disjoint bounding-box-connected contour components can be separated into
  ≤60,000-character paths. Nested holes and potentially overlapping contours stay
  together with their original winding and fill rule. This is intentionally
  conservative, **not** a topology simplifier. Oversized translucent/stroked paths
  cannot be split. Tree limit remains 512 including groups.
- An oversized inseparable component reports its ID, character and contour counts.
  Simplify that component with protected silhouette/holes in Inkscape, or divide
  the artwork into reviewed independent objects. Do not break compound paths apart
  indiscriminately or increase the validator limit.
- Gradients/patterns, CSS stylesheets, use references, SVG clips/masks/filters,
  nested SVG viewports and isolated group opacity are rejected. Normalize these
  in Inkscape first; convert unsupported strokes to paths. No silent fallback.
- Test uses actual `shared/map/vector-art.js` with installed `@napi-rs/canvas` to
  compare source SVG pixels, plus strict failure and BODY-only clipping checks.

The full terrain 48-color pilot currently rejects `path59`: 706,864 normalized
characters in 4,551 bbox-connected contours. This is a correct budget failure,
not evidence that the source art has been successfully imported or simplified.

## Error-bounded candidate search (provisional screen-space limits)

```sh
python tools/vector-production/optimize-svg.py source.svg \
  --remove-reference-images --config optimization-config.json \
  --output-dir _local/reports/vector-optimization/example
python tools/vector-production/test-optimize.py
```

Requires existing Inkscape CLI, Pillow, NumPy, SciPy and native Canvas. Each
threshold starts from the same immutable raw geometry, in its own
`INKSCAPE_PROFILE_DIR` with `options/simplifythreshold`; no cumulative Simplify.
Default threshold grid: `.00001,.00005,.0001,.0003,.0006,.001,.002`. All are
measured independently: complexity/error are **not presumed monotonic**.
Independent 5/4/3-significant-digit path coordinate candidates are also measured.
Use `--thresholds` and `--precision` to configure the search. No contour is removed
just because its area is small. Inkscape itself may eliminate contours; subpath
counts and protected-region failures expose that change.

Example optimization config:

```json
{
  "width": 1260,
  "scales": [1, 2.2857142857142856],
  "limits": {
    "rgbMAE255": 2,
    "silhouettePx": 1.5,
    "protectedRgbMAE255": 1,
    "protectedPx": 0.5
  },
  "protectedPolylines": [{"points": [[0,94],[200,94],[500,220]],"width":15}],
  "protectedRects": [[400,150,30,30]],
  "reviewRects": [[350,100,180,120]],
  "asset": {
    "id":"example:body", "semanticLayer":"BODY",
    "bounds":{"x":0,"y":0,"w":1642,"h":958},
    "anchor":{"x":0,"y":0}, "foot":{"x":0,"y":958},
    "scaleRange":[1,1], "backgroundRange":[1,1]
  }
}
```

`width` is intended normal display width; `scales` must include the real maximum
zoom. Protection/review coordinates are **normal-display pixels**. Protected
polylines have a band width; optional `protectedMask` is a white-on-black image
resized to each measurement scale. Protect contact lines, ledges, sockets or
artist-designated small details explicitly. Importance is never inferred from
area. `asset` has the importer config contract; omission creates a trial asset in
source viewBox coordinates, not a production placement.

Measurements include source bytes, paths, explicit and expanded command counts,
segments, subpaths, runtime nodes/maximum normalized path length, import time,
SVG decode/rasterization and draw time at each scale. `endpointNodesUpperBound`
counts segment endpoints including repeated closing points, not Inkscape UI node
selection. Error measures include premultiplied RGB on black **and** white,
alpha MAE, changed-pixel fraction, and bidirectional alpha-boundary distance.
Protected regions additionally test RGB error and distances for source-palette
color boundaries. These tests catch small local disappearances that a global
average misses. Boundary distances are raster-sampled, conservative screening,
not a mathematical continuous-curve Hausdorff guarantee; narrow antialiased
features can produce strict failures. Timings are single local measurements,
not mobile FPS claims. Coordinate precision changes are measured like any other
geometry change, not assumed harmless.

Default limits (mean RGB ≤2/255, silhouette ≤1.5 normal-display pixels,
protected boundaries ≤0.5 normal-display pixels) are **provisional**. Limits scale
with the measured display scale: at 2× these become 3 and 1 output pixels.
They are not a fabricated perceptual guarantee. Do not relax limits automatically
or raise the 512-node / 60,000-path-character validator budgets. An infeasible
search returns exit code 2, `chosen: null`, diagnostics and the full tradeoff table.
`--existing-candidate-dir` can reuse independent candidates only when the raw SHA
matches; all errors and budget tests are still rerun.

The lowest expanded-command-count feasible candidate is only a **candidate**.
`visualApproval` remains `NOT REVIEWED`; the tool cannot set it to approved.
Original/final comparison PNGs are emitted at all test scales, with enlarged
protected-region sheets for `reviewRects`. When no candidate passes, sheets show
an explicitly unapproved budget-feasible tradeoff for diagnosis, not a substitute
winner. A human must inspect normal size, zoom, important details and the actual
game integration before acceptance. Concept→raw tracing error is a separate
review and is **not** included in raw→optimized error numbers. Preserve both.

For runtime confirmation of a produced JSON asset:

```sh
node tools/vector-production/render-asset.mjs asset.json runtime.png 1260
```

This uses the actual vector renderer and environment validator, records first and
warm draw times, and preserves the authored anchor coordinates in the output view.
The importer supplies physical/background scale ranges `[1,1]` by default; explicit
ranges must be finite, positive, ordered, and background contained in physical.

### Semantic contact protection versus explicit feature protection

Set `"protectionMode":"contact"` for terrain contact bands. This requires the
protected alpha/contact contour displacement and local RGB limits above, **plus**
`protectedChangedPixelFraction ≤0.05` (configurable; a pixel is changed when its
largest channel error exceeds 16/255). Internal color-quantization flecks are not
structural contact features merely because they fall inside that band.

The default `"protectionMode":"feature"` additionally applies the strict
source-palette color-boundary gate. Use it for explicitly marked important small
features, rather than treating every internal rock fleck as an eye or socket.
This distinction is semantic, not automatic threshold relaxation. Keep original
strict results when changing the protection contract and record the reason.
Actual collision clipping/placement is a separate immutable integration contract.

Before lossy work, importer canonicalization also performs shape-preserving
syntax optimization: redundant command letters/separators/leading zeroes,
exact axis-aligned H/V and reflected S/T commands, and an existing straight
closing segment replaced by Z. It never deletes an actual curved closing segment.
This can fit a path budget without removing geometric nodes. Record that as
representation optimization, not artistic simplification or lower node count.

### Actual trials, 2026-10-28 (not visual approvals)

Both trials used original reference-image-stripped SVG paths, seven independent
Inkscape thresholds and three independent precision candidates. Full local
reports/images are under `_local/reports/vector-optimization/stage31-canonical/`
and `stage35-canonical/`; reproducible camera/protection configs are in `examples/`.
Previous all-color-edge strict reports remain in `stage31-final/` and
`stage35-final/`; the semantic-contact revisions are explicitly separate.

| Input / result | Bytes SVG | Expanded commands | Subpaths | Runtime nodes | Result |
|---|---:|---:|---:|---:|---|
| Stage31 original 24-color raw | 1,615,461 | 38,220 | 2,595 | — | path budget fails |
| Stage31 simplify .0006 | 529,924 | 12,714 | 2,595 | 28 | budget passes; contact quality fails |
| Stage35 original 16-color raw | 474,214 | 10,799 | 386 | 21 | canonical minification fits; chosen candidate |
| Stage35 simplify .0003 | 220,224 | 4,727 | 386 | 20 | budget passes; contact quality fails |

Stage31 at 1260/2880px: .0006 global RGB MAE .467/.447 per255, but contact
RGB MAE 2.017/1.457 exceeds the declared1.0 limit, and normal contact displacement
1px exceeds0.5px. **No feasible candidate; no limits relaxed.** Stage31's later
16-color retrace is a different baseline and is not represented by these errors.

Stage35 at1223/2308px: raw geometry wins with zero optimization error and
max normalized path59,665 characters. .0003 reduces commands56%, but contact RGB
MAE1.241/.979 and contact displacement1/1px fail the declared limits. Thus the
chosen result is representation optimization, **not geometric node reduction**.
Actual current runtime render of raw minified asset at1223px: validation0 errors,
first draw12.52ms, warm draw0.51ms (one local run); source-SVG/runtime raster MAE
0.00048/255, max channel difference5/255. These backend raster differences are
separate from the zero raw→candidate SVG geometry error.

Human review of contact/roots, actual world placement, frozen collision clipping,
and gameplay camera remains required. The reports intentionally retain rejected
tradeoffs rather than turning low mean error into automatic art approval.

## Bounded structural partition fallback

When no lossy candidate satisfies both quality and storage limits, geometric
partitioning is a separate fallback. It is **not node reduction** and may increase
serialized bytes and segment counts. Never split raw compound contours blindly.

`partition-svg.py` changes only oversized opaque unstroked path elements; other
paths, source transforms and layer order remain unchanged. The native `skia`
backend uses `Path2D.op(Intersect)` against rectangles. Some traced compounds make
Skia silently return the unchanged input; containment is checked and such results
are rejected rather than represented as successful intersections.

The optional offline `geos` backend requires Shapely in a **temporary production
environment**, not the game or repository runtime dependencies:

```sh
python -m venv --system-site-packages /tmp/honro-vector-geometry-venv
/tmp/honro-vector-geometry-venv/bin/pip install shapely
/tmp/honro-vector-geometry-venv/bin/python tools/vector-production/partition-svg.py \
  source.svg --output _local/reports/partition/candidate.svg \
  --backend geos --flatten-tolerance .01
python tools/vector-production/import-svg.py _local/reports/partition/candidate.svg \
  --config asset-config.json --output _local/reports/partition/asset.json
python tools/vector-production/compare-svg.py source.svg \
  _local/reports/partition/candidate.svg --config optimization-config.json \
  --output-dir _local/reports/partition
```

Add `--remove-reference-images` only when intentionally stripping source references.
Every candidate starts from the immutable source; SHA and unchanged status are
recorded. The fallback:

1. Recursively splits Béziers until the control-point hull is within the declared
   chord-distance tolerance; arcs use a conservative maximum-radius sagitta bound.
2. Flattens in **local path coordinates**. Multiply tolerance by the complete
   source→display affine operator norm, including ancestor transforms. For actual
   Stage31-small `.01` local units corresponded to about `.030` maximum-display
   pixels; Stage35-east `.02` to about `.0433` pixels. Numeric serialization is
   12 significant digits; this is a bounded approximation, not exact Bézier output.
3. Polygonizes intersections and classifies every resulting cell with the original
   SVG nonzero winding number or evenodd parity. Thus holes and overlapping filled
   contours are interpreted together, not independently painted.
4. Intersects the resulting filled region with nonoverlapping tiles, emitting each
   tile with its holes and explicit evenodd fill. Empty intersections are omitted.
   The importer must still pass unchanged runtime budgets.
5. Renders original/candidate at actual display scales and inspects seams and
   protected features. Linearization can alter sub-tolerance topology; raster
   metrics and required human inspection remain essential. Do not claim exact
   topology of the original continuous curves merely because GEOS is robust.

Actual fallback results (candidate status only): Stage31-small186nodes,
normal/max RGB MAE `.00891/.00386` per255 and zero contact/alpha displacement;
Stage35-east152nodes, RGB `.0191/.0110`, zero contact/alpha displacement.
Both fit existing budgets without source-art removal or quality-limit changes.
These larger structural candidates require runtime cost/scene review separately.

Tests in the same temporary geometry environment:

```sh
/tmp/honro-vector-geometry-venv/bin/python tools/vector-production/test-flatten.py
PYTHON_GEOMETRY=/tmp/honro-vector-geometry-venv/bin/python \
  node tools/vector-production/test-partition.mjs
```

They check cubic/quadratic/arc sampled error, relative contours, nonzero/evenodd
holes, overlapping contours, self-intersections and actual native rasterization.

## Subpixel silhouette measurement and semantic diagnostics

A binary boundary at1× moves in whole pixels; it cannot reliably distinguish a
`.49px` movement from a tiny antialias threshold flip. Do not silently enlarge the
`.5px` protection limit. Rerender explicitly important regions at higher resolution:

```sh
python tools/vector-production/measure-protected.py raw.svg candidate.svg \
  --config optimization-config.json --output-dir _local/reports/protected \
  --supersample 8
```

This requires explicit `protectedRects`, adds margin around them, rerenders the
vector geometry (not a resized bitmap), measures alpha edges and divides distances
back into display pixels. It reports sampling step `.125` normal pixel at8× and
retains the same protection limit. It does **not** rewrite or erase the original
failed report, nor automatically approve the art. Native 1×/max local RGB and
changed-pixel tests are still needed; internal semantic details need explicit
feature masks/local-contrast review, not alpha alone.

A palette-level-set disappearance is not a literal anatomical/structural movement:
the fore-reeds trial reported22–35px color-island displacement and1–1.414px binary
alpha offset at1×, but rerendering the protected stems/heads at8× measured **zero
alpha silhouette offset** at both358/520px display widths. The original diagnostic
is retained; the semantic silhouette/local-RGB assessment is recorded separately.
Eyes on a face cannot be protected by an outer alpha silhouette alone. Mark those
features explicitly and inspect them visually; never treat all tiny traced color
islands as equally important or all small details as removable noise.

### Compact fallback, and preserve curves before flattening

The first bounded partition can be larger than the original efficient cubic SVG.
Do not confuse passing per-path limits with acceptable memory/transport cost.
Use independent measured candidates and keep the full-fidelity fallback:

- `quantize-svg.py --grid .01 --oversized-only` first expands relative/smooth
  commands to absolute Bézier controls, then rounds only oversized paths. This
  avoids cumulative relative-coordinate drift. Each control/endpoint moves at
  most `grid/sqrt(2)` local units; Bézier interpolation has the same pointwise bound.
  Arc parameter rounding is rejected because that bound would not apply.
- If some paths still exceed storage limits, run GEOS only on those paths.
  `--polygon-tolerance .05` uses GEOS topology-preserving polygon simplification;
  `--coordinate-grid .01` shortens absolute line coordinates. These are additional
  approximation components, recorded separately; sum the declared local allowances
  before applying the complete display transform. Recheck **against original raw**,
  not merely the previous candidate. Native raster and semantic-feature review
  remain mandatory; larger limits are not silently accepted.
- Original curves that already fit are retained. This can be substantially cheaper
  than converting every color plane to a polyline.

Measured hybrid results on the real trial inputs:

| Asset | First partition | Curve-preserving hybrid | Fidelity evidence |
|---|---|---|---|
| Stage31 small BODY |186nodes /4.2MB|35nodes /865,009bytes|RGB MAE .0023/.0013; contact/alpha offset0 at2520/5760px|
| Foreground reeds |128nodes /2.7MB|24nodes /712,789bytes|RGB .0858/.0557; protected8× silhouette offset0 at358/520px|

The hybrid still has more *linear commands* than original cubic commands; report
curve type, endpoints/controls and bytes separately instead of advertising raw
node reduction that did not occur. Actual important-detail and scene acceptance
is not granted by this table. `test-quantize.py` checks absolute cubic/S/quadratic/T
control rounding against its declared bound.

## Exact internal vector reuse (optional runtime extension)

New assets may use `vector.symbols: {localId: node}` and
`{tag:"use", symbol:"localId", ...groupStyleOrTransformOrClip}`. References are
strictly internal IDs: no URLs, SVG hrefs, cycles, unused definitions, or hidden
extra children/path data. Every expanded use wrapper **and** referenced node counts
against the unchanged512-node/depth24 limits; each path remains≤60,000 characters.
Group/use opacity other than1 remains unsupported. Definition styles are resolved
under each reference's inherited context, so alpha, gradients, holes and affine
clips retain ordinary group semantics.

`prepare()` compiles each definition once. `pathCount` remains logical expanded
paint count; `uniquePathCount` reports unique compiled geometric paths. This reduces
serialized repeated geometry and retained Path2D memory, **not repeated draw calls**.
There are no cross-asset or external references. Existing plain assets are unchanged.
Ship symbol assets only together with the updated renderer; do not convert historical
assets whose separate authoring/runtime code expects direct child shapes.

```js
import {deduplicateAsset} from './tools/vector-production/deduplicate-vector.mjs';
const {asset, report} = deduplicateAsset(authoredNewAsset);
```

The helper replaces only exact repeated subtrees, leaves input immutable, validates
before/after and declines changes that exceed expanded budgets or save no bytes.
Project CLI use requires explicit IDs to avoid rewriting historical assets:

```sh
node tools/vector-production/deduplicate-vector.mjs input-project.json output.json \
  --asset-ids s32v:body-domain-left,s32v:body-domain-right
```

Real Stage32 left/right extension vectors: each2.454MB→129KB (94.7% less); one
BODY definition is shared20times. The plainBODY is unchanged. Native tests compare
exact pixels before/after, not merely file size. Dedicated checks:
`node tests/vector-symbols.mjs` and existing `node tests/vector-assets.mjs`.

## Opt-in rectangular partition clip snapping

`pixelSnapClip:true` is allowed only when `clipPath` names **one** finite,
nondegenerate canonical rectangle `M x y H x2 V y2 H x Z`, with finalH=initialx.
A terrain polygon, multi-path clip, foreign reference or arbitrary path cannot opt in.
Only exact axis-aligned canvas transforms are snapped; rotation/shear uses ordinary
clipping. The transformed rectangle edges round to device-pixel boundaries, moving
only an artificial partition boundary by at most.5devicepixel. A cached unit rectangle
avoids per-frame Path2D allocation and does not mutate the caller's current path.

Mark only authored slice/exterior-mirror rectangles, **never the actual terrain mask**.
Ancestor terrain clipping and actual source geometry remain untouched. This prevents
stacked color planes from repeatedly antialiasing the same fractional clip edge.
No-flag rendering remains unchanged. `node tests/vector-clip-seams.mjs` verifies
fractional zoom.37/.53/.81/1.33 against an unsliced reference (zero fixed-pixel delta),
reflections, rotation/shear fallback, strict rejection and zero warm allocations.
