# Stage35 · 대숲의 옛길 — production candidate

## Historical candidate, not the current campaign

The recipes and six-foe input tape below describe the earlier production candidate. They are not the current Stage35 acceptance record. The current authored campaign source is `shared/data/act4/world.json` (materialized by `node tools/act4-source/world-source.mjs materialize`); select its stage with `metadata.stageId === 35`. At master `2657fe659996e76bacc82b4c321690e07a43b82f` it has 30 enemies, four heroes, `approved35-*` terrain, and a 4608×3072 play area. Do not replay the earlier six-foe tape against that map and label its result current campaign completion.

The current exit uses authored `design.act4.coords.completeX` / `completeYMax`. `act4-events.js` requires quiet combat, all **living** party members beyond those bounds, and an actionable grounded actor to interact. `act4-campaign.js` does not require all four heroes, or the archer specifically, to survive. Keep controlled end-condition fixtures separate from normal-input completion.

`tests/act4-stage35-blocked-shot.mjs` checks fire/impact provenance, visibility, configuration and restoration with DOM/Canvas doubles. It does not establish current browser traversal, enemy clearance, exit gathering, or art/fun acceptance. Compare the actual loaded stage and runtime before reusing any preserved evidence.

## Result and boundaries

- Asymmetric official clearings/ditch; original central x2820–3900 geometry, unit IDs, encounters, event IDs, and physical bamboo/wall collision preserved.
- Continuous stage-specific BODY: skeleton → generated material concept → native Inkscape 12-color trace → deliberate deep-noise layer removal → independently measured selective optimization.
- Common reusable assets: thin bamboo, dense physical bamboo cover, broken stone wall. Mist and FORE are palette variants, not a flattened background.
- Separate narrow REAR bank, tapering to zero at stair corners. SURFACE uses the shared renderer's exact contact ink/light (no redundant band). True FORE uses the shared post-actor compositor.
- Existing terrain-domain geometry receives reflected/sheared source continuation. No new collision. Source matte rims are removed by interior cropping and a matched flat deep substrate.

## Parent integration

`art/stage35-vector-production/stage35-production-package.json` contains one stage and only new library assets. Merge stage by ID and assets by ID; retain old assets for old saves. Parent owns official world merge, shared runtime, browser/mobile-device review, remote push, master and Pages release.

## Reproduce

From repository root, with the existing Node/native Canvas and Inkscape tooling:

```sh
node tools/stage35-production/skeleton.mjs
node tools/stage35-production/assemble-continuous.mjs
node tools/stage35-production/verify.mjs art/stage35-vector-production/continuous-project.json art/stage35-vector-production/final-collision-validation.json
node tools/stage35-production/verify-event-fixture.mjs art/stage35-vector-production/continuous-project.json art/stage35-vector-production/final-event-fixture-validation.json
node tools/stage35-production/verify-app-observations.mjs art/stage35-vector-production/continuous-project.json art/stage35-vector-production/ordinary-inputs.json _local/reports/stage35-direct/final-package-app.json
node tools/stage35-production/inspect.mjs release-with-fore art/stage35-vector-production/continuous-project.json
node tools/stage35-production/inspect.mjs release-without-fore art/stage35-vector-production/continuous-no-fore-project.json
```

Source recipes: `ground-continuous-recipe.json`, `bamboo-cover-recipe.json`, `old-wall-recipe.json`. Final source SVGs contain paths, not embedded images. Native Inkscape source documents retain reference images intentionally; do not ship them as runtime art.

## Evidence interpretation

- `ordinary-inputs.json`: actual App/Engine input tape, prepared legal Stage35 entry level, balanced earned-SP training (51 earned/15 spent per class), no teleports, resource replenishment or forced enemy damage. All six foes defeated; all four living heroes exit; round11/31 shots/30,425 frames.
- Independent replay calls actual `stopBattle`, persistence and `Continue` at frame12,584, checking exact units/event state/round/active/phase, then finishes normally.
- `final-collision-validation.json`: isolated real Engine routes explicitly replenish movement; these are geometry tests, **not** the normal completion evidence.
- `final-event-fixture-validation.json`: explicitly controlled positions/focus/actions trigger actual blocked shot, actual side hit and `A4.S35.MID.01`, then verify once-only persistence. This is a condition fixture, not proof the normal tape presents that optional bark.
- App harness doubles DOM/audio/frame scheduling, not combat/events. Native screenshots use the production shared renderer; they are not browser or physical-device FPS claims.
- `vector-fidelity.json`: final BODY14nodes, all six strips at normal/max scale pass; upper three planes unchanged. Wall's initial1× pixel silhouette diagnostic is retained; an8× measurement resolves sampling quantization with zero measured displacement, not a relaxed threshold.
- Parent reviews actual whole, normal, max, mobile, domain, matched FORE-off/on, and completed-App-state screenshots before release. Metrics and tests never automatically approve art.

## Rejected work retained as diagnosis

Separate west/center/east BODY pieces produced mismatched giant facets and rectangular joins. `west-assembly/35-whole.png` documents why they were replaced. Do not import the old diagnostic assembly or old three-piece assets.

## Current 30-foe follow-up: entry conditions and tactical limits (2026-11-05)

On source merge `981058fd` with master `3e56b342`, the unpublished source preview has runtime digest `dfad27db17afdd76c7e15383c16dec9083e12bf161ddcf24c664f9d93b2d78ad`. Its normal release gate still requires a new coordinated Stage31 probe. These results do not validate the current public Pages or generated master build.

| Prepared entry and actual input route | Combat end | Exit win | Shots | Survivors |
| --- | --- | --- | --- | --- |
| Level22/45SP, early ascent | R28 | R28 | 76 | 4 |
| Level22/45SP, knight assigned lower floor | R23 | R24 | 76 | 4 |
| Level25/51SP, same assignment; preserves overlap stalls and Continue | R22 | R23 | 64 | 4 |
| Same Level25 battle, alternative from its actual R18 autosave | R18 | R19 | 64 | 4 |

The R19 row is a saved-checkpoint comparison, not a second fresh full run. At R18, c-3 had 367HP and stood almost on the knight at x4474; the automatic planner repeatedly found no shot while standing still. Ordinary left movement followed by a normal shot killed it. The complete stalled run and alternative both showed the exit-house line, saved continuation and actual victory. No enemy damage, resources, XP, victory conditions or running combat state were injected. Both entry profiles loaded the same 30 foes with total maxHP52765. No gully support was observed in these action logs; this is not a proof that all possible routes avoid falls. Runtime-predicted aiming is tool assistance, not a human usability/fun approval.

Level25 preparation uses `tests/fixtures/act4-rc/support-entry-fixture.json` as the Level22 base. Actual `HonroProgression.budget`, contribution `rewardScores/reserve`, `grantXP` and `investStat` APIs calculate declared equal-contribution grants: 31=20781, 32=22418, 33=24103, 34=0 XP per hero (158091→225393). Synthetic completed-stage markers permit direct entry; no 1–34 continuous play or prior quest receipts are claimed. Each hero has 51 earned/spent SP, with the additional six invested in normal stat training. This is one legal balanced preparation, not the only campaign allocation.

| Hero | Training at22→25 | Equipped skill ranks | Equipment IDs (unchanged) |
| --- | --- | --- | --- |
| Archer | 30→36 | A01:1, A14/A02/A05:5 | itm_se_05, itm_co_11 |
| Mage | 30→36 | M01:1, M06/M02/M03:5 | itm_da_05, itm_co_08 |
| Knight | 27→33 | S00:1, S01/S06/S08:5 | itm_hw_05, itm_co_01 |
| Occultist | 27→33 | O01:1, O02/O13:5, O06:6 | itm_so_05, itm_co_02 |

Knight also retains S03/S05/S07:1 and occultist O11/O12:1 outside those loadouts. All equipment is obtainable by Stage30 under the authored acquisition events; the fixture keeps its existing choices and grants no new optional equipment. Difficulty is normal, assist off, speed2/playerSpeed1; automated selection does not operate M02 manual detonation. The source preparation, exact profile/SP/gear provenance, original input logs/autosaves and screenshots remain private under `_local/reports/stage35-role-split/`. The abandoned charge-calibration run, bounded incomplete run and overlap-policy stall are preserved as limitations.

Only the exit-house narrative repair remains a product change. The earlier c-3 relocation was rejected; no new enemy weakening, terrain change or relaxed gathering threshold follows from these runs. The R19 branch establishes a feasible normal-input route near the target, while a fresh uninterrupted R19 reproduction and human fun judgement remain unverified. Parent coordination owns exact-runtime probe, normal build, master integration and Pages checks.
