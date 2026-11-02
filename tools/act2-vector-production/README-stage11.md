# Stage 11 terrain material candidate

`매듭을 거둔 아침`: original playable 16000 × 12000, play bounds [0,0,16000,12000], world terrain domain [-6000,-24000,22000,36000]. Hero height 92. Rock and moss material only; all collisions, routes, actors, camera, quests, events, timber, pine architecture and separate image backdrop remain unchanged.

## Source contract and integration

`capture-stage11-contract.mjs` captures **pre-author-hook** campaign source (31 terrains). `applyStage11ArtCandidate(project)` in `apply-stage11-candidate.mjs` is the sole integration entry; parent build owner wires it before production story authoring. It fails closed on geometry/scenery drift, adds only collision-free L1 scenery assets, and supports `HONRO_ACT2_STAGE11_CANDIDATE=0`. Do not replace this source guard with already-authored production data.

Production story authoring adds two reviewed-v4 terrains, giving 33 effective terrains. The four-step `v4.11.firing-rock` receives its own skin; `v4.11.bier` is timber and preserved. `tests/stage11-art-candidate.mjs` independently authors the before/after projects and compares effective collision/world geometry, units, quest records and other original stage fields. Native render fixtures are not browser/play-clear certification.

## Pipeline and review

1. `inspect-stage11-source.mjs`: production-story source and native captures.
2. `guide-stage11.py`: canonical geometry guides, not invented gameplay.
3. Imagegen reference-based sources; Act1 stage02/body-v2 and stage10/floor-v4 inform restrained angular style. No people or far background in the concept. Korean ravine palette is seven subdued rock/olive colors.
4. `preview-stage11-source.mjs`: temporary raster source-scale gate in actual native renderer. No raster hook ships. West/central/lower initial sources were rejected for oversized contact facets. East source was expanded to the actual x22000 world extent, then reduced in contact scale. Continuous floor-domain source is paired with local entry detail rather than inflating play rocks to dummy width.
5. Actual Inkscape fixed-palette cumulative tracing, white-matte preparation, bounded curve/coordinate optimization, protected contact features, then lossless lexical cleanup. Immutable RAW is archived gzip with SHA-256.
6. Strict comparisons at original source 1× and 2×; no threshold relaxation. Protected contours preserve selected RAW paths when needed. Floor-domain alone uses the SOP's explicit 1/255 RGB raster quantization tolerance with exact alpha (one ambiguous pixel per scale), recorded in its report. Every other part has zero tolerance. Lossless cleanup has independent pixel-identity proof.
7. `preview-stage11-art.mjs`: real native actor-size desktop (.94), mobile (.82), legal minimum zoom, underpass and map-edge renders; .09 whole-map overview is diagnostic, not a legal game camera. Canonical solid/contact inset clips preserve gameplay contact. Floor/body overlap masks remove false interior floor rims without changing geometry. The local floor-detail overlay uses an angular decorative taper inside the canonical floor to remove its rectangular source crop edge; this is not a gameplay polygon. No hard rectangle, white halo or invented floater is accepted.

Assets and evidence: `shared/data/act2/stage11-*-candidate.json`, `art/act2-near-vector-candidates/stage11-ravine-v1/`. Source images remain at the exact external paths/hashes in per-part contracts. `production-brief.txt` is a reconstruction, not claimed to be a verbatim generation prompt.

## Reproduction and resource coordination

Run all large pixel comparisons and multi-view renders with `flock /tmp/honro-heavy-art.lock`. `measure-stage11-existing-renders.py PART SCALE` calls the unchanged shared comparator on existing full-resolution images, one scale per process; this avoids retained comparison-sheet memory after OOM, not weaker metrics. Do not modify shared helpers to accommodate this stage.

`node tests/stage11-art-candidate.mjs` validates the packaged hook. `node tools/act2-vector-production/preview-stage11-art.mjs /absolute/path/to/stage11-art-root` generates native previews/baked candidates. Final visual review and native evidence do not assert public integration, browser acceptance or gameplay completion; parent owns those gates.

## Immutable RAW → optimized SVG bytes

| Part | RAW | Final |
|---|---:|---:|
| Continuous floor domain | 73,100 | 54,525 |
| Local entry floor | 207,987 | 128,523 |
| West | 197,274 | 119,808 |
| Central | 155,097 | 104,568 |
| Lower | 90,157 | 65,348 |
| East (full world extent) | 127,676 | 98,690 |
| Reviewed-v4 firing rock | 136,686 | 110,973 |
| **Pack** | **987,977** | **682,435** |

Pack reduction **30.926%**. Per-part reductions intentionally differ; raw contour preservation takes priority over individual targets. These are actual SVG file bytes, not gzip ratios or native JSON sizes. Native sizes, source hashes, fixed limits and per-part pixel measurements are in the packaged contracts/reports.
