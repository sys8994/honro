# Sharp candidate Chromium inspection — 2026-10-31

Scope and reproduction: `tools/qa-act4-sharp/README.md`. Fixed source/runtime and compressed/raw hashes are recorded by the restore tool and per-stage `results.json`. These are frozen-frame custom-map diagnostics, not a gameplay or release acceptance. The whole-map shot may use a diagnostic zoom below the allowed minimum. Desktop is 1440×900 DPR 1; mobile is 390×844 DPR 2 and 3. Seven views per viewport include normal center, maximum center, and minimum left/right/top/bottom. Camera centers are constrained, but event-state coverage and subject-specific close-ups remain incomplete. PNGs and console/actor snapshots are retained; direct visual examination has not covered every PNG.

| Stage | Status | Initial enemy / ally / NPC | Observation and remaining work |
|---|---|---|---|
| 31 | Unverified | 34 / 4 / 0 | Left and bottom minimum desktop views inspected; estuary and submerged ground visible. Remaining views, sharp material boundaries, events and contact settling need review. |
| 33 | Issue | 30 / 4 / 0 | `stage33/1440x900-dpr1-min-left.png`: conspicuous vertical terrain/environment join at about screen x=788. Camera center (-320,2304), scale 0.2117647059. Compare original art and renderer before assigning cause; repair the local connection, preserve collision, then recapture. |
| 34 | Unverified | 33 / 4 / 0 | Left minimum view inspected; remaining camera extremes, detail and contact settling need review. |
| 35 | Unverified | 30 / 4 / 0 | Bamboo background visible in left and right minimum views; cover/clearing at actual play and maximum zoom, all remaining views and event overlays need review. |
| 36 | Unverified | 9 / 4 / 0 | Door and village visible in desktop overview; inspect door at actual and maximum scale, event states and all other views. |
| 37 | Unverified | 30 / 4 / 0 | Left minimum view inspected; remaining views, timber supports, actor visibility and event states need review. |
| 38 | Issue | 31 / 4 / 4 | `stage38/390x844-dpr3-min-left.png`: strong vertical cut between left extension and cave body, plus thin bright contours around upper geometry. Camera center (-320,2304), scale 0.0573529412. Compare source and browser rendering to distinguish art/AA; inspect cave entrance, residents and event states at actual scale. |

All stages loaded all three viewport contexts without page exceptions. Console errors recorded are favicon 404s; image decode checks returned dimensions for all five required images. The scene screenshots show the relevant far imagery where visible. Snapshot `grounded=false` IDs are preserved in each JSON; no initial-frame airborne state is classified as a placement defect without a settled-frame comparison. No event state transition, frame-rate or real-device test was run.
