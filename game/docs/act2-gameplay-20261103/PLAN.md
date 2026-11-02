# Act 2 gameplay evidence — 2026-11-03 KST

## Scope and immutable criteria

Baseline source: `292c1122fcd75256c366ec15e815fb4adcfbd7b2`. Stages 11–20 use **released reviewed-v4** (`productionStory:true`), not historical knot/rescue missions. No map, story, runtime balance or master changes are authorized in this QA branch.

The original quantitative plan was recovered, not reconstructed: `3872295f:tools/quality-gate/criteria-v3.json.gz`, decompressed SHA256 `e2183e74492a4cb61338f8a691a51f23e7af2205fb9148ae6f6b2c138311aa54`. The local extracted Act 2 slice includes all original stage fields, global macro, classification and definitions. The old gate is absent from current master. Recovery does **not** mean it currently enforces anything.

Required groups: rounds (stage target and global ≤20), registered-policy clear rate and effective enemy pressure, required-route encounters/minibosses, meaningful elevation/space, preserved objectives and visual acceptance. Total map enemy budget, raw role/pattern counts, ordinary dimensions/platform counts and estimated human minutes are reference-only. Original jump/drop counts are retained as historical criteria; latest direction rejects forced jump quotas. Actual meaningful landings and strategic route differences must still be measured. No threshold is changed to fit a run.

Source stage11 correctly describes entry hosts, released soul/northern pair and exit gathering, unlike older ACT2_REVISION_DESIGN and generic act2-playthrough. Source stage19 is noncombat farewell. Historical 40–147-round results and old thresholds are not current evidence.

## Trial scope and calibration

`tests/act2-gameplay-native.mjs` executes production App/Engine with DOM/render/storage/clock doubles. Entry is explicitly **synthetic legacy-budget `rewardXpAt(plan.entryLevel)` XP**, legal training and production-auto-equipped basic recruitment weapons, with unlock flags only. It is not a prior earned campaign or human population sample. Every actor HP/focus/position/movement write after launch is guarded by the existing production-call audit. Production `App.defend()` is used (plain Engine.wait is not equivalent). Damage is traced during production ticks through actual settlement, not a three-second post-shot snapshot.

Pilot stages: 11, 15, 20. Policies: objective-first, survival/recovery, alternate range/route/skill mix. Seed initialization occurs once before gameplay. Pilot samples are controller diagnostics, excluded from preregistered completion probability. Full trial registration will freeze final runner/entry/source hashes after calibration. No 20-round truncation will manufacture a pass; exceeding20 remains failure even if later completed.

Initial controller findings: legacy navigator assumes terrain IDs equal route aliases; 15/20 use `floor-main` versus live `act2-floor`. That is a QA adapter failure, not game difficulty. Reviewed11 firing rock is absent from the legacy route graph. Controller now resolves live support IDs and proposes actual valid contact poses without moving gameplay actors. Pilot11's eight-round stationary result is retained, not treated as a difficulty loss or release evidence.

## Required outputs and limitations

Per stage: declared entry/source hashes, initial roster, full chronological inputs, real objective interactions, births, HP damage, landed support/routes, skills, terminal phase, round statistics and unresolved failures. Native render and normal browser UI evidence must be labelled separately. Native success cannot certify human fun; assessment must identify observed choices/tradeoffs and pacing.

Final art work is parallel and visual-only. Baseline gameplay will be bound to geometry/actors/logic, then final asset/source parity and representative real-browser replay must be checked. Local Chromium socket restrictions are not bypassed; an authorized GitHub Actions runner will supply browser evidence. All currently absent measurements fail closed. No overall pass is asserted here.

## Calibration entry correction and first full observation

The planned level label is NOT actual actor level: old12 reward conversion makes11 actualLv10,15 Lv12,19 Lv14,20 Lv15. App auto-equips `itm_se_01/itm_da_01/itm_hw_01/itm_so_01` after loading the empty input inventory. Initial battle snapshots always captured these facts; subsequent provenance reports actual level/equipment explicitly. No stronger XP was injected to manufacture success.

Stage19 completed all eight required goals with14 recorded inputs, no damage/kills/external writes/recovery. DisplayR1 is **zero combat cycles** in this noncombat chapter, consistent with its source target0. This is a single native diagnostic, not population success probability or browser proof. Stage11's improved rock navigation reaches x5388 byR9; Stage15 original aggressive pilot lostthreeheroes;12 lostatR7 before its recurrence (controller failed to walk the required landmark→checkpoint→landmark loop). All failed/aborted pilots remain in local traces and are excluded from calibrated cohort claims.
