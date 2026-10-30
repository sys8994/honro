# Stage 31 native props — candidate; NOT approved

Four image-free assets, provisional world dimensions and feet, no collision: pine 440 wide REAR, reeds 200 wide FORE, rocks/driftwood 360 wide REAR, marker 190 wide FORE. Dimensions and placements require in-scene approval; neither static renders nor validators establish unobstructed gameplay. Original RGBA concept SHA-256 `c7980b3d862a32b7239247756266896073f8c6e074be6044ab4226d95223d42b`, original unstacked Colors 8 native trace `fa45ff20d73a143a0d18015013885d45a7786d6328691abbccf2a7f83c7c660d`. Originals preserved unchanged; linked bitmap is never included in vector outputs.

Whole contours assigned without clipping: pine 868, reeds 673, rocks 606, marker 703; assignment bounds are `*/region.json`. Assignment aborts if a contour is not wholly in exactly one semantic region. No external rectangular background. Native palette is unchanged by optimization. **Source PNG → native trace is a distinct lossy step**; e.g. original brown details become sage. This was not repaired or counted as optimization fidelity. `comparison.json` separately reports source→native and native→optimized at 600px per region (image-wide premultiplied RGB, alpha, and binary disagreement; rasterization/resampling differences included).

Native union underfill uses dark native paint, follows simplified native union exterior and fills only enclosed holes below 50 source px², preserving larger negative spaces. Color layer cleanup deletes/fills components/holes below 1 source px²; 0.10-source-unit flatten, 0.15 topology-preserving simplify, 0.01 coordinate precision. Each native-color layer and underfill additionally receives a same-fill, round-join 0.2-source-unit stroke; maximum outward reach is 0.1 source unit. At actual 600px asset previews this is at most 0.119 CSS px (marker), under the 0.5 CSS px bound; at assumed 0.56 CSS px/world it is at most about 0.03 CSS px. This bound does not cover arbitrary future zoom levels. Oversized polygons are intersected with adjacent half-planes, no intentional expansion, to stay below the 60,000-character node limit. Per-layer retained-exterior Hausdorff and deletion counts are in `*/metrics.json` (before rounding/splits). Unlike whole-image alpha, these distances do not measure deliberate removal of holes. Assets have 10–11 nodes, max path length 53,013 characters, and actual vector Canvas validator errors zero; maximum tree depth 4.

**Open failure, not a pass:** At 600px, enclosed alpha components below 128 decrease from 354→17 pine, 557→136 reeds, 374→21 rocks, 454→136 marker. Large components include legitimate negative spaces; some very small holes and seams persist, especially reeds and marker, including gaps connected to the outer boundary. Underfill thus reduces seams but does not guarantee opaque interiors; visual and semantic review required. Binary silhouette disagreement (1,959, 2,882, 1,133, 2,788 pixels respectively) includes deliberately filled seams, removals, and edge/raster differences, not solely exterior movement. Do not label fidelity or seam closure passed.

**A01–A04:** Cause: separate native unstacked colors leave small transparent interstices and the color trace has palette loss. Forbidden: crop intersecting connected objects, conceal missing vectors with linked raster, inflate loss thresholds to declare a pass, fill legitimate branch/reed gaps, or equate validation with art/gameplay approval. Alternative: whole-contour assignment, native union inside exterior, bounded tiny-hole cleanup, source/native/candidate comparisons and explicit unresolved seam status. Evidence: original hashes, region counts, numeric geometry/raster metrics, native-vs-candidate 600px previews and fixed semantic ROI metrics, and Canvas validation; actual game placement remains untested.

## Reproduce from repository root

Python dependencies: numpy, shapely 2.x, svgpathtools, Pillow, scipy; Node dependency @napi-rs/canvas. Generated raw/optimized SVGs and preview PNGs are deliberately ignored, not durable source files.

```sh
python tools/act4-pilot-native/props-extract.py
python tools/act4-pilot-native/props-optimize.py
python tools/act4-pilot-native/props-import.py
for n in pine reeds rocks marker; do
  node tools/vector-production/render-asset.mjs art/act4-pilot-props-v2/$n/asset.json /tmp/props-$n-600.png 600
  node tools/vector-production/render-svg-target.mjs art/act4-pilot-props-v2/$n/raw.svg /tmp/props-$n-native.png 600
  node tools/vector-production/render-svg-target.mjs art/act4-pilot-props-v2/$n/optimized.svg /tmp/props-$n-optimized.png 600
done
python tools/act4-pilot-native/props-qa.py
```
