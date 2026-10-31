# 39 presentation follow-up v4 — isolated review candidate

Depends on immutable v3 natural-damage patch SHA 93f2e803c1e9baba30dbee584f376f39c42e9bccf70c8278a9ee060e5ba8b9bc and final50 project SHA f4544464368e28f26cd5c69c30da66abf0ca51633cd41a868f102b69c331bfe0.

## Deliverables
- `wreck-presentation-opt-in.patch`: only shared/runtime/{act4-coast-events,act4-coast-art,unit-info}.js. No engine/terrain/actor changes. Shared sources untouched. `git apply --check` passes against recorded local bases.
- `BASE_SHA256SUMS`, `RESULT_SHA256SUMS`: exact source contract.
- `candidate-delta.json`: ONLY adds `/stages/0/design/vectorWreckInTerrain/presentation` to final50. Original damage data/project untouched. Whole project equality after removing presentation was asserted.
- `project.json`: compiled candidate. Metadata carries four actual polygon-edge muzzles and one on-wood HP/card anchor.
- `tests.mjs`, `tests.json`:12 checks,7 clear-path trajectories,11 real-map interception cases,30 inactive legacy-stage checks.
- `character-info-regression.mjs`:14 matched base/candidate ordinary card cases +1 candidate anchor case (15). See scope exclusions below and SOP.
- `native.mjs`: real Native renderer and actual attached enemyAction/fire, with controlled warning (not normal campaign). Candidate runtime and v3 core are loaded explicitly.

## Contract
Original actor2925,1994.0625, body/AI/attack selection/HP7800/bossRequired:false/four residents/terrain remain unchanged. Same original warning target/round/history, blast75 and original T clamp1.8..3.2 derived from legacy spawn. The actual fire hook emits projectile/trail/FX on reviewed wood with6.05world clearance; actor.origin and all other skills retain their original values. Own-shape bounded path checks avoid a low arc re-entering the deck without ignoring unrelated obstacles. All7 target directions retain the original two-substep enemy pacing; endpoint numerical error <5.4e-11world in clear-path fixtures. Real-world obstructions are separately retained, including upper rocks, lower ground, ladder and NPCs. NPCs still take ordinary damage; no new immunity or claim that deliberate direct NPC shots are safe.

HPbar/active marker/name/card anchor follow the visible central wood. Hover uses the same final50 damage polygon. Mouse/touch picks actual material, not sky; overlapping residents take priority. Ordinary actors and missing/broken opt-in links fall back. No new lore or legacy sprite.

## Reproduce
From repository root:
```
node _local/reports/approved39-presentation-v4/tests.mjs
node _local/reports/approved39-presentation-v4/character-info-regression.mjs
BASELINE_UI=1 node _local/reports/approved39-presentation-v4/character-info-regression.mjs
node _local/reports/approved39-presentation-v4/native.mjs YOUR_NEW_OUTPUT_TAG _local/reports/approved39-presentation-v4/project.json
```
Native optional VIEW=portrait-high-normal-wreck / landscape-low-normal-wreck, TARGET_X/TARGET_Y, SHOT_STEPS. Do not overwrite prior evidence tags.

## Actual pixels inspected
Under `_local/reports/stage39-local/`:
- `wreck-presentation-v4-first-review/39-landscape-high-normal-wreck.png`
- `wreck-presentation-v4-right/39-landscape-high-normal-wreck.png` (right wood muzzle)
- `wreck-presentation-v4-mobile/39-portrait-high-normal-wreck.png`
- `wreck-presentation-v4-low/39-landscape-low-normal-wreck.png`
Each directory has shot/compiled-sea JSON. Compiler loads damage and presentation from candidate metadata. Continuous sea is enabled via map.act4.tide.continuousSea.stage39/version and the actual helper reads surface2812.5 high/3150 low; this patch does not alter water.

## Limits / remaining integration
- Controlled Native warning/shot and synthetic DOM tests, not public browser/campaign completion. Actual DOM card layout, keyboard integration and normal play remain browser QA.
- Adapted card regression excludes old keyboard Tab/Escape and old skill-HTML assertions, which failed in matched baseline harness too. Current harness dependencies/selectors/wording were repaired, not shared production code. See SOP for exact history. It is not valid to claim the original unmodified character-info suite fully passed.
- `wreck-presentation-v4-launch-fx/39-landscape-high-normal-wreck.png` was generated with real Scene.event routing and one actual shot step, and inspected: emission/FX sit on upper wood, not the old sky anchor.
- Cloud application must retain other workers' source changes, apply only this patch, and rerun cloud TS/build and relevant tests. Local runtime syntax checks pass; v4 has no TS edits. No remote changes from this agent.
- Separate requested damage-AABB performance investigation is not included in this patch. v3 source/hash remains unchanged.
