# Stage43 recovery: narrow deep foundation candidate

## Fixed Scene candidate
`asset-local-grid01.json` is the fixed read-only Scene candidate. Official importer succeeded:12 paths,14 tree nodes,1,344,909bytes, `params.silhouetteUnderpaint=false`. No changed import/core-asset limits. This candidate retains the original twelve traced paint layers; it does NOT use the experimental Boolean-union art.

Coordinate contract: native asset internally contains uniform raw→SOURCE matrix[2.3815789473684212,0,0,2.3815789473684212,-42.86842105263158,-9.216842105263254]. It should receive only the same source→world transform as the original art. Do not apply raw→source twice. Domain approximately source x0..2172,y710.02..3700. Anchor0,0. Place behind original; no y697 front rectangle or silhouette underpainting.

## New art provenance and composition
One new built-in image_gen portrait concept, saved as concept-foundation-v1.png; prompt in generation-prompt.txt. Original castle was a style/composition reference. Only its newly generated BELOW-CASTLE material is used: the original source.svg is appended unchanged once in composed previews. Actual Inkscape12-scan vector trace, separate native silhouette, and twelve Boolean intersections produce foundation-native.svg with zero embedded images. The white reference background and generated architecture are not part of the final BODY.

No tiles, cloned patches, anisotropic stretching, wide continental shoulder, ground plane, or artificial walkable platform. Extent ends near3700 rather than5300. Entire cliff is front-facing and remains inside original-width footprint, with natural narrowing. Existing stone support bottom is preserved, not redefined as a walkable rock surface. Current palette maps to original-family778394,657184,4f5d71,37475c,25364a,162332.

## Preservation and limits
Original SHA256 remains d024022a56991bc56e6d507698a6683c11d47915984dfcf2ca02b936c1d927b4. Original paths/control points were not edited. In source y570..709 protection crop, original fully opaque pixels changed0. Fifteen partially transparent edge pixels at y709 change background contribution due to rear underlay (maximumRGBA20), NOT source geometry edits. Bridge/arches/interior spaces above710 receive no new rock. This separates file preservation from composited-pixel preservation.

The foundation is coherent and much narrower than rejected earlier wide slabs. Some faces are still roughly1.5–2x the source rock scale. The flat top under actual masonry is intentional support; east pure-rock contacts require the separately coordinated local join. Whole Inkscape view alone is not a final game art acceptance. Parent and east worker are performing actual normal Scene checks.

## Serialization verification
Final twelve-layer candidate uses0.1 RAW coordinate quantization and short SVG commands; all path/subpath counts non-increasing, checked in local-grid01-report.json. Largest compound197,969chars, largest subpath54,034chars, unchanged standard importer budget. Quantization grid is not0.1source: raw→source2.38158; source→world6656/2172; maximumcamera1.65. Theoretical endpoint/control Euclidean screen bound≈0.852px at maximum zoom. Normal912/zoom1824 actual Inkscape comparisons give premultiplied MAE0.09123/0.07103 on0..255, maximum25.09/49.00, >16 difference7/120pixels. Alpha max40/76, binary-alpha mismatches29/156. Not pixel-identical. Whole composed-grid01.png was inspected; no new large visual deformation noted. Maximum-camera thin-feature ROI check remains pending, so do not infer it from average metrics.

## Non-selected optimization experiments
Original native has64,414 parsed segments. Source-frameepsilon.1 and initial raw-frameepsilon.2 optimizer jobs were interrupted after prolonged runs without final output; no results from those are claimed.
Actual Inkscape unions only consecutive equal-color stacks reduced12→6paths and64,414→37,986segments. This changes antialiasing/outline at some edges (union-report.json), so it is NOT claimed lossless. Existing bounded optimizer epsilon.2RAW then reduced37,986→37,343segments and passed its unchanged default raster/non-growth guards. However the six-path compact retained a compound over240,000chars; official importer correctly rejected it. No arbitrary color partition, dParts budget bypass, or raised limit was used. These variants remain studies and are NOT the fixed Scene candidate.

## Files
- asset-local-grid01.json: fixed engine candidate
- foundation-native.svg: original twelve-layer native BODY
- foundation-local-raw.svg: equivalent raw-frame immutable candidate baseline
- foundation-local-grid01.svg: compact SVG used for fixed JSON
- composed-grid01.svg/png: final compact plus unchanged source, no extra joins
- contact-review.png/original-contact.png: protection comparison
- mobile-predicted.png: predicted minimum-mobile composition, not actual Scene
- report.json, local-grid01-report.json, union-report.json: measured evidence

Only this study directory was authored (plus built-in generated-image output copied into it). Production, other workers' files, other stages, source assets, commits/remotes were not modified.
