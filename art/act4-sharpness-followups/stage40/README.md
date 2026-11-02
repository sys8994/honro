# Stage40 sharp candidate — follower release integration verification

Passed local isolated route fixtures. This is **not normal campaign completion or browser acceptance**: enemy units are removed and boarding-dialogue termination is explicitly supplied. No observation receipts or campaign completion are fabricated.

- Immutable input: `../act4-sharpness-rollout/stage40/candidate-v2-sharp-extractions.json`, SHA256 `7b44978d46994f555720e8dc723723c24b60c2e983b5c73abc8eeb631e843a89`.
- Output `candidate.json`: exactly two additions (`delta.json`), followerRelease in `design.act4.geometry40` and `initialState.honroAct4Design.geometry40`. Assets and every other JSON value deep-equal input.
- Runtime is frozen locally; `runtime/act4-coast-events.js` copied from previously tested `../act4-return-pacing/candidate-v4.js`. Shared runtime/engine untouched. Source SHA `dbcfd353d30c4ab29b35b07e0770a4e426654bdf1611c40d2c0e34afb5450b47`.
- New normal run reached safe at 87.7000 seconds. Normal resume at 22, 36.1, 52, 67, 74.3, 80.7 seconds preserves state at every attach and produces exactly identical trace/route/final positions/phases/water.
- Delayed leader plus those resumes reaches safe at 101.9916667 seconds, minimum active separation 162.3161111; below160/overlap/overtake/teleport/water recovery counts all zero. Delay fixture uses the existing v4 probe slowdown, including 18–32 and 72–88 second windows.
- Both boat passengers and both high-route residents finish their authored paths, all four retain HP1450 and are grounded inside safeZone. Boarding order [1,0], disembark order [0,1]. Moving deck keeps static scene version stable within each engine lifetime.
- Comparison against prior v4 normal result is exact for trace, rows, phases, routes and water, but measured anew against the latest sharp candidate.
- Native screenshots `native/whole.png`, `native/sailing-mid.png`, `native/safe.png` render actual recorded simulation snapshots. Sailing and safe images were visually inspected. Browser verification remains separate.

## Recurrence prevention / handoff

1. Never inherit runtime-only opt-in results as candidate-integrated results. Assert both serialized geometry copies and the compiled runtime config, then execute anew against a hashed immutable input.
2. Freeze model-only and render bundles separately. A render bundle in a model VM needs Canvas globals (first harness failed due to missing Path2D; no pass claimed).
3. Native snapshot rendering must initialize the production coast renderer and its app binding. Initial incomplete renderer omitted the ferry despite valid physics; discarded and recaptured with actual coast modules, verifying visible boat and two passengers.
4. Phase transition time is `(frame+1)*STEP`; the old summary `seconds` counter is one STEP lower. Report measured transition 87.7, not 87.6916667.
5. These are local excluded reports, not published source changes. Root handles final runtime/content integration, commits, remote verification, browser and Pages checks.

Reproduce from repository root after preparation: `PACING_SOURCE=_local/reports/approved40-sharp-follow-release/runtime/act4-coast-events.js PACING_LABEL=normal HONRO_CAPTURE_RETURN=1 node _local/reports/approved40-sharp-follow-release/run.mjs _local/reports/approved40-sharp-follow-release/candidate.json`. Resume variants use `PACING_RESUME=1`; delayed variant additionally `PACING_DELAY=1` and distinct PACING_LABEL. Run `summarize.py` after all three and `render.mjs` for Native screenshots.

## Remote source equivalence and compiler binding

`runtime-source-comparison.json` compares the tested v4 source to Git commit `56afc0beccc738a084f9682970c01765741f68af:shared/runtime/act4-coast-events.js`. Only Stage38 comment wording differs; all executable source is identical. Production `HonroMaps.createBattle` supplies the config from the candidate; the test only asserts it and never assigns it to battle state. User-delivery image: `delivery-sailing-fixture.png` (original full PNG also preserved in native/), with explicit fixture caption in `delivery-caption.txt`.
