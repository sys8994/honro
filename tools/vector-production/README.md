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
