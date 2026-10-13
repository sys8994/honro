# Audio startup release review, 2026-10-13

## Exact source identity

Reviewed production source: `3b848ddb72d4dc7ccacfe86c5bf999509868b9c3`, following SFX `b30a964f02441057b68e2df0fd41c8e4a6aa4baf` and BGM `2a78f8fa9266ada132a44e1def8c3fe1a0380652`.

The approved runtime manifest appends one exact reversible audio delta after the ash-title delta. Only `shared/engine/src/bgm.ts`, `shared/engine/src/sound-design.ts`, and `shared/runtime/story.js` change. The prior 159 source rows, all approval records, packaging dependencies, model/compiler input membership and immutable historical fixtures are preserved. The BGM source changes from archive-identical to changed, making current counts 26 added, 75 changed, 58 unchanged. Each of eight current variants changes only its compiled core and, where present, story source. Archived sources are byte evidence, never current gameplay identity.

## Independent review and completed checks

- `npm run build`: PASS, both generated HTML bundles.
- `node tests/current-runtime-contracts.mjs`: PASS, 159 current sources, eight variants, two HTML bundles, immutable archive 133→130, 902 source negative checks, 48 current-part negative checks and 50 exact-edit negative checks.
- `node tests/audio-latency.mjs`: PASS on the final reviewed source. Delayed/cancelled cues, shared resume, rapid repeat, mute/zero/visibility/disposal, autoplay denial and combat PCM preservation use deterministic WebAudio doubles.
- `node tests/audio-release-review.mjs`: PASS. Independent checks cover 24/44.1/48 kHz context metadata for all 26 SFX with identical 24 kHz PCM, truthful sample-rate labels, preserved waveform/duration and a 0.24-second dialogue buffer; rapid hide/show and mute/unmute during pending resume; a new cue after cancellation; completed initial warm without device creation; buffer reuse; and the actual application's visibility-only pause argument.
- Source review confirms `App.updateAudio()` supplies `document.hidden`, not dialogue/ESC state. The new SFX pause flag therefore does not suppress ordinary visible dialogue. `pause()` clears pending events before rapid resume; only a newly requested visible cue can enter the new queue.
- Final dialogue PCM analysis: onset above 0.01 amplitude at 0.50 ms versus 4.79 ms; peak 0.10818 at 8.08 ms versus 0.04847 at 20.71 ms; RMS 0.01869 versus 0.01086. These are generated waveform measurements, not acoustic latency measurements.

## Limits and remaining release gates

No listening, physical speaker/Bluetooth/OS latency, actual device resampling quality, live browser startup timing, or public Pages behavior is established by these checks. Idle warm work yields in 256-sample blocks with an elapsed-time budget, but this is not a hard real-time guarantee: one measured VM-double callback reached approximately 4.50 ms under this executor's load. Exact browser aggregate status and published commit/Pages verification must be reported separately by the release owner; this document does not waive those gates or claim broad verification passed.

## Final integrated aggregate run

Final production source remains the exact reviewed `3b848dd` delta; integrated checks and rebuilt HTML are on `645484f290da2d4befab88387b5dd9d14ebb36cc`.

`npm run verify` completed at 2026-10-13 12:18 UTC with exit 1 at the environment boundary, not a full pass:

- PASS: both HTML builds; title tests; campaign metadata; independently replayed 30 maps/640 assets; all current runtime contracts/negative controls; migration ledger/current metadata; current story display; binding and narrative revision; game TypeScript; the complete game `npm test` chain (map, impact, audio, balance, charge and recruitment/pacing); and the repeated RC21 map audit.
- BLOCKED before any page loaded: `game/tests/rc20-browser.py`, Chromium `process_singleton_posix.cc socket() failed: Operation not permitted`, `ptrace: Operation not permitted`, SIGABRT. The existing command was not changed or retried with security workarounds.
- NOT RUN by this aggregate: `rc21-performance.py`, the following full root integration chain and root performance suite. Separate targeted passes remain independently valid: BGM 23, dialogue controls 6, SFX latency 9, independent device-rate/edge checks 7, speaker presentation 7, source inventory with title negatives, narrative event delivery 7 and dialogue hit-feedback 4.
- A pre-existing inventory false positive on the approved title `["혼","로"]` glyph map reproduced on original `28b829a`. Only the exact main.js title glyph map is classified as title text. Five negative cases preserve rejection of real/unreviewed speaker tuples; story source text was not changed.

Raw aggregate log: `_local/logs/audio-release-verify.log`. Waveform and timing evidence: `_local/reports/audio-latency/`, including before/after WAVs and `native-preparation-timing.json`. The native Node one-run measurement observed cold dialogue synthesis 16.05→7.47 ms (48→24 kHz); preparation constructor 0.34 ms, idle p95 1.42 ms and maximum 2.17 ms. This is executor/JIT/load-dependent synthesis timing, not browser/input/acoustic latency or a hard frame-time guarantee.

No actual listening, public Pages playback, measured cold/warm browser startup or physical device output is claimed. Publication and public Game/Workshop UI verification belong to the release handoff and must be recorded separately.
