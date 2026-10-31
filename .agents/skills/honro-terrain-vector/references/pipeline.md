# Native Inkscape pipeline

## Runtime

Dependencies: Inkscape (pilot: 1.4), Python 3, Pillow, numpy, scipy, lxml, svgpathtools. Use existing tools or approved official/package sources. SVG viewBox units must equal source pixels; unresolved transforms are rejected.

```sh
python scripts/trace_pipeline.py vector-ready.png output/run16 16 true 4
python scripts/finalize_precision.py output/run16
```

Arguments: input, output, color scans, smoothing boolean, speckle size. Start with 16 colors, compare 24 if distinct materials/features merge. Four-pixel speckle removal was used in the pilot, not universally safe. Use zero for tiny essential features. Native action: `object-trace:scans,smooth,true,false,speckles,1,0.2`.

The optional Linux Inkscape 1.4 headless initialization shim is NOT a tracer. Try ordinary Inkscape first. Only for observed missing Gdk/Glib C++ wrapper registration failure, build bundled source:

```sh
g++ -shared -fPIC scripts/init-wrappers.cpp -o /your/output/init-wrappers.so -Wl,--no-as-needed -l:libglibmm-2.4.so.1 -l:libgdkmm-3.0.so.1 -l:libpangomm-1.4.so.1 -l:libgtkmm-3.0.so.1
export HONRO_INKSCAPE_PRELOAD=/your/output/init-wrappers.so
```

Do not blindly use on other platforms/versions or load unverified binaries. Scripts put runtime HOME/XDG in output. Package contains source, not platform-specific binaries.

## Measurement

- Preserve source SHA256 and RGBA. For color trace, force RGB white where alpha<128, leaving visible RGB unchanged. Hidden glow otherwise pollutes color quantization.
- Trace original alpha at 50% threshold as a vector clip. This is binary silhouette tracing, NOT full semitransparent opacity preservation. Fog/glow stays in separate raster layers.
- Keep `02-inkscape-trace.svg` and PNG immutable. Verify real paths, zero embedded images.
- Generate six simplify candidates from identical raw. Native preference thresholds are relative settings, NOT pixel tolerances.
- Require fewer parsed segments, unchanged subpath/components, silhouette deviation ≤1.5 source px, RGB MAE ≤0.8/255, ≤1% pixels with max RGB difference >24/255.
- Internal curve distance estimate ≤1.5 source px: sample at max 0.5px arc spacing, add 0.25px conservative allowance. This is a conservative numerical estimate, not interval-arithmetic proof. Assumes one compound path per style; duplicates are rejected instead of silently discarded.
- Try coordinate precision 2 then 3 decimals. Recheck raw→final geometry/image and source-alpha silhouette. If neither passes, retain pre-rounding candidate. If no simplification passes, raw fallback is allowed but is not optimization success.

Outputs: `04-final.svg`, `04-final.png`, `final-metrics.json`, logs and candidates. Pilot budgets are source-resolution-specific; changing resolution needs an explicit budget decision, not silently reusing apparent px values.

## Required review record

Record references/hashes, prompt, trace settings, raw/final bytes/segments/subpaths, embedded images (zero), selected candidate/error, source→raw losses, raw→final losses, inspected full views and ROI paths. Separate numerical pass and visual pass. Record fallbacks and unresolved issues.

Global error cannot protect a tiny crucial eye, brace, latch, doorway, stepping surface. Review visually; refine source or isolate/protect feature rather than widening tolerance. Source→trace loss can exceed optimizer loss. Raw→final statistics do not prove source fidelity.

Actual game-loader budgets and performance must be measured. Few `<path>` elements may hide thousands of subpaths/segments. Scripts do not verify collision, routes, monsters, tides, framerate or gameplay.


## Small semantic feature lost during global tracing

Observed during Act4 stage38 rollout: the central white glyph merged in a 24-color global trace, before optimization. Do not diagnose this as a simplification defect or increase only the optimization tolerance.

1. Mark semantic feature ROIs on the actual vector-ready source before tracing; retain their source-pixel coordinates and reference screenshot.
2. If a global palette loses the feature, crop/mask the original feature ROI and trace it separately with native Inkscape. Composite its vector layer at the original source coordinates above the global trace. Do not hand-invent a replacement glyph or alter its meaning.
3. Preserve the extracted source, mask, source hash, ROI, trace action/settings, placement transform and all intermediate SVGs as provenance. Avoid painting an opaque rectangular ROI over surrounding artwork; preserve its silhouette/mask and inspect seams.
4. Compare source → composited raw → composited final at full view and at least 200% ROI. Verify the glyph shape, nearby detail, registration, color, transparency and layer order. Include the protected layer in final file size and path/subpath/segment totals and zero-embedded-image checks.
5. Protect that layer during simplification or optimize it independently with its own error measurement. The generic one-path-per-style geometry script cannot blindly validate transformed or duplicate-style composites. Resolve transforms/group color paths for supported measurement, or measure components separately in source-pixel units plus inspect the composite. Explicitly record the validation method and limits rather than calling a failed/unsupported check passed.

This is a targeted remedy for semantic losses, not a reason to split every decorative speck into a layer. Prefer an improved flat-color source when that preserves the intended form more simply.
