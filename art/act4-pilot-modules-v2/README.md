# Independent native terrain modules v2 — source and reconstruction evidence

Source concept and actual Inkscape SVG are immutable. Colors8/unstacked/removebg
produced four disconnected objects. Whole-contour extraction uniquely assigns
ascending/plateau/descending/overhang; no geometric cropping or hand-redrawn art.
Root reviewed the upper moss exterior as the intended contact convention.

## Current state (not final approval)

Near-duplicate blue and dark native colors are geometrically unioned, with maximum
3/255 channel palette revision; sub5sourcepx² contours are removed. Native outline
underfill resolves interior seams where possible. Derived runtime candidates
validate, but tiny exterior-connected transparent channels remain. They are local
candidates, not accepted production assets. A filled rectangular or enlarged body
is not used to conceal this defect. Large rejected SVG/PNG variants stay local.

Source top profiles are refined from the actual largest moss-cap contour with
.03source curve flatten bound plus .15source sampled vertical error. These are
art-contact candidates, not collision authoring. Descending's right tail beyond
sourceX758 is decorative, never an extension of physical support. Subpixel native
paint rims outside the moss cap are likewise reported as decorative.

v1 target was rejected for long straight supports. v2 target was rejected for
repeated waves. The current four-sample v3 composition uses a frozen draft target;
physics/straight and moving-body corridor gates remain independent and pending.
It is not a final map or proof of actual gameplay.

## Repeatable workflow

```
python tools/act4-pilot-native/extract-modules-v2.py
# For each D=art/act4-pilot-modules-v2/{ascending,plateau,descending,overhang}:
python tools/vector-production/quantize-svg.py "$D/raw.svg" --output "$D/optimized.svg" --grid .01
node tools/act4-pilot-native/native-union.mjs "$D/raw.svg" "$D/native-union.json"
node tools/act4-pilot-native/merge-module-palette.mjs "$D/raw.svg" "$D/merged-palette.json"
# After all four modules have the prerequisites above:
python tools/act4-pilot-native/refine-module-contact.py
python tools/act4-pilot-native/clean-module-palette.py
# For each D:
node tools/act4-pilot-native/resolve-underfill.mjs "$D/cleaned.svg"
python tools/vector-production/import-svg.py "$D/cleaned.svg" --config "$D/asset-config.json" --output "$D/asset.json"
python tools/act4-pilot-native/verify-clean-modules.py
```

## Failure prevention additions

- **Cause:** unstacked color boundaries can contain narrow channels connected to
  the exterior. Filling only enclosed holes does not eliminate them; indiscriminate
  filling would destroy real reed/branch openings in other asset classes.
  **Do not retry:** blanket hole fill, rectangular backing, claiming validator
  success as seam acceptance, or treating changed alpha-hole topology as a passed
  exterior-distance metric.
  **Alternative:** preserve raw; use bounded same-color overlap and direct pixel
  review, or a new native stacked comparison ONLY when important palette ROIs
  are independently verified (A03 still applies).
  **Evidence:** verification.json honestly retains alpha-boundary and alpha-hole
  diagnostics; no acceptance bit is manufactured.
- **Cause:** a default namespace may serialize as a prefix and a naive `<path>`
  regex silently extracts zero geometry. **Do not retry:** accepting empty union
  as a lightweight asset. **Alternative:** prefix-aware matching, nonempty guard.
  **Evidence:** test-native-union.mjs.
- **Cause:** a largest whole-object contour can omit a tiny disconnected paint
  rim or trace an underside tip. **Alternative:** the root-approved moss cap is
  the native contact source; explicit decorative overhang stays separate from
  the collider. It must be reviewed at fitted camera scale.

## Stacked terrain-only comparison and full v4 composition

`modules-stacked.svg` is a second actual native Inkscape trace (8 colors,
stack/remove background). Unlike the rejected brown bridge case, this source is
only moss/blue terrain. Its five major color roles remain visible in the native
preview. This is a scoped comparison, not permission to stack semantic props.
Stacked input removes interior unstacked hairline gaps; a thin exterior paint rim
remains visible. Exact new stacked/native contact discrepancy and final placed
normal/max-zoom CSS error are pending; prior unstacked metrics do not certify it.

Reconstruct stacked candidates without retaining duplicate derived SVGs:
```
python tools/act4-pilot-native/extract-modules-v2.py modules-stacked.svg stacked-
for N in ascending plateau descending overhang; do
 D=art/act4-pilot-modules-v2/$N
 python tools/vector-production/quantize-svg.py "$D/stacked-raw.svg" --output "$D/stacked-optimized.svg" --grid .01
 python tools/vector-production/import-svg.py "$D/stacked-optimized.svg" --config "$D/stacked-asset-config.json" --output "$D/stacked-asset.json"
done
node tools/act4-pilot-native/assemble-stage31-candidate.mjs PATH/TO/skeleton-v4/blueprint.json _local/reports/stage31-full-native-v4
```

Full v4 composition uses matching R1 stage SHA
`820afd2767fbf275692ef80c02ed8da59424e86bba0aabc21b1a11d6a0f4552f`.
It includes all supports, background, separate props, original dock and exactly one
original boat in the runtime docked pose. Existing actual vector renderer makes
full-map and normal-camera PNGs, plus diagnostic collision overlays. This is NOT
the full gameplay Scene and does not prove moving-body clearance.

**Rejected body-fitting method:** uniform deep vertical stretching of small
native modules into rooted columns produces unnatural long slivers and seven
uncovered solid regions. Do not retry by flat fill, hidden collision, or claiming
node budgets suffice. Next step is root-reviewed natural body composition,
then separately authored non-walkable collision from visible contours, preserving
approved upper facets, and complete Engine/boarding revalidation. Do not extract
final collision from this rejected stretched appearance. Large intermediate
project/assets/PNG output stays local. Background source-unit errors must be
converted through actual L6/parallax/zoom before any final CSS claim.
