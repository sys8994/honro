# Stage38 west floor silhouette candidate

The generated transparent concept follows declared flat→descending ramp→flat gameplay skeleton. Exact prompt in `prompt.txt`. Native Inkscape Colors5 trace (Smooth, Stack, Remove background on; speckles2, corners1, optimize.2) produced4paths. `source.svg` retains embedded reference; `raw.svg` removes only that image. `palette.svg` remaps four paint layers to the blue-dawn rock palette. Bounded optimization selected simplify.0003: endpoint upper bound466→288, normalized maximum path7958 characters; boundary error1px at widths1955 and3467, RGB MAE.0496/.0365 of255. `optimization/report.json` retains the search including rejected precision3 (near boundary2px). No engine safety limit changed.

`derive-contour.py` extracts the actual traced upper edge and fits it to preserved macro anchors (0,2800),(1800,2800),(2350,3050). The full2350–3300 recovery plateau remains3050. Its connection3180 and return2980 footprints and overlap3200–3300 with emergencyledge remain exactly unchanged. East terrain and resident supports are untouched. New surface77points, source polygon92vertices; max slope.775665, old entry plateau deviation−12.567..+21.546world. Collision approximation tolerance.4world. The same polygon masks actual BODY art; no fake lip extends past the solid.

Candidate-v2 corrects the first candidate's material splice at2350 by continuing the same authored source across protected plateau; unchanged contactrim owns its flat edge. Generic non-axis-aligned/multi-region clip has pixelSnapClip removed (which only supports one rectangle); safety contract is not relaxed.

This follow-on is based on immutable ceiling candidate-v5 and changes only `a4-38-land` in addition to that base. Asset IDs are isolated. Integrator must merge only specified terrain points and two new assets/elementrefs, not replace fullworld with QAproject. Gameplay fields and otherterrains are assertedunchanged. Independent movement/sweep/savepose QA pending, not approved for final release.

Reproduction from frozen ceilingv5:
```
python tools/vector-production/import-svg.py art/stage38-floor-silhouette-v4/final.svg --config art/stage38-floor-silhouette-v4/config.json --output art/stage38-floor-silhouette-v4/source-asset.json
PYTHONPATH=/tmp/cave-python-deps python tools/cave-floor-silhouette-v4/derive-contour.py
node tools/cave-floor-silhouette-v4/assemble.mjs
node tools/stage38-production/inspect.mjs floor-silhouette-v4-after2 _local/reports/cave-floor-silhouette-v4/candidate-v2.json
```
Requires svgpathtools and Shapely. Do not overwrite frozen QA candidates. Actual production nativeScene normal/near/portrait/entry/whole renders in that reportdirectory; floor and boundary directly inspected. Original triangular backdrop and shared pale surface flecks are known separate pending integration work. Renderer snapshots do not establish browser/mobilehardware performance or whole-stage final art approval.

Root review follow-on: candidate-v3 / floor-silhouette-v4-after3 lightens broad darkest plane #1c3141→#213646 (~20% contrast reduction against primaryplane). Geometry and contactlip unchanged; intentional art edit in `interior-art-edit.json`, not a raw-relative optimization claim. Independent physical QA may use frozenv2 after confirming identical terrains.

Browser strict-load correction: candidate-v4 supplies `reference.heightM=5000/60` for legacy `s38v:contact-surface` and copied `s38-floor-v4:unmodified-contact`. This restores canonical metadata required by environment validator; no schema relaxation, art, collision or gameplay changes. Earlier nativeScene-only snapshots did not exercise project-load metadata validation.
