# Stage 11 terrain material production

Original production stage: `매듭을 거둔 아침`, 16000 × 12000. Play bounds remain [0,0,16000,12000]; terrain domain [-6000,-24000,22000,36000]. Hero height 92. This change is art-only: preserve every terrain, route, quest event, actor, camera, timber branch, pine architecture and separate image backdrop.

`inspect-stage11-source.mjs` captures effective production stage and native views. `guide-stage11.py` builds material guides from those canonical polygons; guides are not invented gameplay. `preview-stage11-source.mjs` temporarily draws source raster through a preview-only native vector hook for material-scale inspection; nothing from this raster hook ships.

Initial west material v1 failed normal-camera scale review: pale facets/moss too large beside existing enemies. V2 reduces contact facets and moss, retaining large calm deep planes. Trace/optimization starts only after this source-scale gate. Images and experimental reports live outside Git in `honro-act2-vector-rollout/stage11` and `_local/reports/stage11-*`. This checkpoint is production tooling, not a finished terrain asset or browser/play acceptance.
