# Act 4 story save follow-up (2026-10-31)

Source baseline: common `782176a0`; candidate: `2a7cc445b1d0fe9393105743648733f553d68536`. QA uses this exact baseline plus that change, and the original assembled world SHA-256 `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`. `21e4c36d9` compact autosave was already an ancestor of the earlier `b50c4533` QA baseline. That baseline and 782 also contain the 40 escort dirty comparison and incremental guide preparation. The remaining clones were a separate story save path, not absence of those changes.

After Act 4 runtime installation, verify `active=true`, no own `persist` on the app, and the installed prototype wrapper before attaching instrumentation. An earlier trace attached an instance wrapper before lazy installation and masked the actual wrapper; its one-clone interpretation was invalid. Corrected traces show `story.save` cloning the whole battle, then `finish` calling the ordinary persist wrapper twice with `compactArt=false`. Both wrapper snapshots clone it again. The later throttled battle autosave already uses `compactArt=true`. Calls and times are nested; do not add their measured durations.

The candidate skips the redundant preliminary clone only when the official Act 4 wrapper will snapshot, and requests its existing verified compact mode for the story writes. All writes and ordering are retained: dialog state is saved first, then `seen` is recorded and saved. Unknown, unloaded, custom, training, debug, and completed paths keep the legacy behavior. Portable UI export remains raw. This is independent of the rejected raster prewarm experiment.

## Measured transition

Chromium headless PC, 1440×900 DPR 1, synthetic progressed stage 40 profile, same frozen world, real guide and Enter. One target browser, 10 live Chromium processes; 5 available CPUs, ~15.2–15.4 GiB available memory, load 0.75–1.14 at collection. ANGLE SwiftShader and software 2D/raster/composition; this is not a mobile FPS or hardware-GPU measurement. Trace hooks add overhead. Same sequence B/C/B/C; frames are rAF gaps during guide exit, not the whole level:

| Order | close rAF median / p95 / max ms | whole battle stringify+parse pairs | first two snapshot times ms | transition tile render ms |
|---|---:|---:|---:|---:|
| baseline 1 | 16.7 / 33.3 / 600.0 | 3 | 110.8, 118.7 | 163.6 |
| candidate 1 | 16.7 / 33.3 / 233.3 | 0 | 53.5, 46.3 | 153.2 |
| baseline 2 | 16.7 / 33.3 / 583.3 | 3 | 116.5, 107.4 | 168.7 |
| candidate 2 | 16.7 / 33.3 / 266.7 | 0 | 61.1, 55.8 | 148.8 |

The original 30,745,848-character battle JSON was cloned three times per baseline exit. The candidate still checks official art identity while building two compact snapshots and later performs the normal throttled autosave; it does not skip verification. CPU scheduling, camera tween, and sample size limit the comparison. The ~150ms tile build remains, as does the separate distant first-water hitch and recurring movement cost; this patch does not solve rasterization.

## Contract and regression evidence

- Actual Chromium with synthetic progressed profiles: for identical live states, old full snapshot followed by compact and the new compact snapshot produced identical JSON (40: 59,635 characters; 35: 79,356). Modified official art and custom art stayed inline, forged signatures were rejected without mutating input, and snapshot did not mutate live battle/profile. The unit test also checks unloaded and nonofficial/debug/custom/training/done fallback.
- Stage 35 actual reader observed both pages; a reload/Continue at cursor 1 resumed the second page. Both receipts, terminal state, and reader closure matched live and stored state. This is a synthetic progress fixture, not full normal play.
- Actual stage 40 UI settings export was assembled by `App.export` and intercepted only at download: 30,755,990 characters with raw art and no asset refs. Forced localStorage write failure kept previous bytes; reload and Continue succeeded. Real mobile download behavior remains untested.
- Actual stage 40 checkpoint (`sailing-observation-local-storage`, decompressed SHA-256 `2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141`) starts at boarding; normal Continue progressed to sailing, autosaved escort clock, restored boat/deck/resident positions on reload and stopped progress under modal pause. Not a completed natural campaign.
- `tests/act4-story-compact-save.mjs`, `tests/act4-map-revision-rc.mjs`, `tests/act4-resident-platform-drop-resume.mjs`, and `node --check shared/runtime/story.js` passed. The legacy 33 test could not run in this isolated QA because its local `stage33-legacy.json` fixture was absent. `story-presentation-state-p11b.mjs` fails its old dynamic runId equality on baseline too. The existing 40 import/retry helper's synthetic camera cancellation assertion fails identically on baseline and candidate: the injected camera position resets before preparation starts; it proves neither cancellation success nor a regression.

Raw traces, contract results and escort observations are compressed under `story-save-evidence/`. To reproduce against a separately built and served frozen-world QA, run `HONRO_QA_BASE=http://127.0.0.1:8773 python tools/act4-perf/stage40-story-save-trace.py TAG` and `HONRO_QA_BASE=http://127.0.0.1:8773 python tools/act4-perf/stage40-story-save-contract.py TAG`. Escort check: `python tools/act4-rc/browser-stage40-escort-save.py http://127.0.0.1:8773 TAG sailing`. Only one browser should be active during timings. No Pages deployment occurred.
