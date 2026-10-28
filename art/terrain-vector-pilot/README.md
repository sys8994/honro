# Terrain vector fidelity experiment — 2026-10-28

This is a visual reproduction test, not a playable map or production replacement.

## Selected result

- Reference: concept-v2.png, generated as a flat-vector-style raster concept.
- Vector: terrain-vector48-balanced.svg, actual Inkscape 1.4 color tracing and path simplification.
- Preview: terrain-vector48-balanced.png, exported from the SVG by Inkscape.
- Comparison: reference-vs-vector.png, reference above / SVG output below.

## Actual operations

Inkscape GUI: import reference PNG; Trace Bitmap > Multicolor > Colors; 48 scans;
Stack enabled; Smooth disabled; speckles 2; smooth corners 1.0; optimize 0.2.
The embedded reference image was removed using Inkscape's select/delete action.
SVG was exported as plain SVG. An isolated Inkscape profile with simplification
threshold 0.0003 was used for the selected balanced export. No appearance paths
were manually authored as coordinate lists.

16-color tracing lost clouds and several color relationships. Default 0.002
simplification distorted bridge/roof contours and was rejected. The full 48-color
trace preserves more detail but is approximately 7.5 MiB; the selected simplified
variant is approximately 2.9 MiB. It still contains many subpaths: 48 color paths
must not be mistaken for 48 simple geometric objects.

## Validation and limits

The selected SVG contains no image elements or external raster references.
Its rendered output was visually compared with the reference at full view.
Rock, roots, bridge, shelter and distant cloud silhouettes survive. Fine color
transitions become small quantized patches, especially around rock faces and
horizon edges. The result is not a claim of exact pixel reconstruction.

No movement, collision, enemy placement, rigging, runtime performance, mobile
performance or production deployment is claimed. User explicitly deferred those
for this trial. Future authoring should separate common terrain decoration and
reusable objects from stage-specific playable shapes into meaningful layers,
rather than trace each entire stage as one color-stacked image.
