# Stage 20 connected rock material

This replaces material only. The effective stage snapshot, collision polygons,
walk edges, canonical/contact clips, camera, actors, objectives and story remain
unchanged. Three localized contact strips and distinct floor/roof sources were
created, then traced by actual Inkscape (source/prompt/provenance and raw traces
are retained here). These are not runtime bitmaps or hand-authored polygon fills.

## Registration and optimization

`warp-stage20-contact.py` registers the three strips once across the playable
contact. Dark substrate bands are omitted so the lower edge blends into the
existing body. The floor source is registered once with greater density near
contact and larger deep structures; a separate portrait source fills the roof.
Both are clipped inside the original canonical solid. Original disconnected
large paint islands are replaced, not merely dimmed. Coarser facets remain in
the far outside-play extent; this is a deliberate scale hierarchy, not tiling.

Macro serialization rounds unprotected coordinates to 0.1 world units while
segments touching a 32-unit contact band retain six decimals. Compound holes
remain in one fill operation. Runtime limits are unchanged. Further contact
quantization was rejected after a 1-pixel protected color-edge discrepancy;
contact curves retain original four-decimal registration precision.

Baseline gzip assets are immutable reproducibility inputs. They are not active
assets. `protected-comparison.json` binds the strict native comparison to exact
vector hashes; `final-pack.json` binds the runtime assets. The comparison is
against the registered high-precision trace, not the original raster concept.

## Reproduction (repository root)

```sh
python tools/act2-vector-production/warp-stage20-contact.py
HONRO_STAGE20_ART_OUT="$PWD/_local/reports/stage20-dense-final" \
 node tools/act2-vector-production/preview-stage20-art.mjs "$PWD/_local/stage20-contact-v3"
node tools/act2-vector-production/compare-stage20-contact.mjs
python tools/act2-vector-production/measure-stage20-contact.py
node tools/act2-vector-production/package-stage20-contact.mjs
node tests/act2-stage20-candidate.mjs
```

Python dependencies match existing art tooling: Pillow, NumPy, SciPy,
svgpathtools. Preview/comparison use the existing native Canvas dependency.
The package step refuses failed/incomplete comparison or vector hash drift.

## Review scope

Actual production Scene previews cover structure, actor-scale entry/contact,
exit daylight, deep body, roof and camera/mobile extents. Iterations rejected
contact-only work, stretched strip macro geology and Boolean partitioning.
Dense iterations 1–3 refined the connected field and compound-preserving
precision; final native previews are in `_local/reports/stage20-dense-final`.
The coordinating reviewer accepted the body/roof hierarchy as a candidate on
2026-11-02. This is not browser, gameplay-clear, storage-quota or deployment
approval. Native strict schema comparison and compact/restore roundtrip are
focused checks; real browser save/reload/Continue remains an integration gate.
