# Stage21 revision2 independent review

Reviewer: /root/lake_review. **Scoped Stage21 functional review: no blocking findings in the supplied final evidence.** No production edits, manifest changes, commits or release actions by reviewer.

## Exact source and normal-resource run

Reviewed `final-art-fullplay/trace.json` and the controller. Execution records parent commit eb373e44e424c3786ed1d0179d47d5894b54747d plus actual source hashes; the final art was subsequently committed as03087f8. Recomputed current campaign5b4babf76a7f11db9267c455f582191dd4d12dfcc943941aec01486036cebde3, runtime0f7ff80f6314b9c52e72b87bf326055c46df15dc976fb4e959443a355dfa611e and controller559120b214e99f92a15c6ba5b4aa9e99e2c3cc020b1700a7a988caa13384fb19: all match. No rerun at the later commit is invented.

WonR8/frame8193; all4heroes survive atHP717/858/1346/794. Actual ContinueR3/frame2316 compares the entire battle exactly. All18initial enemies/events and real checkEnd remain. No objective completion writes or live resource top-ups found; five-field actor-write audit reports0external writes. Prior20 production reward ledger is an explicit legal entry fixture, not prior campaign play. Bounded shotViable prediction selects inputs, so this is an App.frame normal-resource scripted policy with DOM/render/storage/clock doubles, not human play or full browser input replay.

`roofs-observation-records.json` extracts latest raw actor actions/hits/player responses. Initial group action/hit counts: wagon3/4, gate4/5, market3/3, stable2/1, office2/2. All5 have targeted player fire responses. Waves preserve3guards/2hounds/2archers with stable contributions; action/hit counts3/3,2/2,2/2. Hits are damage/shield records, not unique attacks.

## Geometry and focused checks

Market/office decks now use one-way collision; the preceding solid-office S01 overlap is superseded by this tested geometry. Reviewed body86 source/records: finite position and centerline foot/mid/head clearance per simulation step, excluding one-way surfaces from solid-intersection tests. This does not prove every hurtbox corner clear.

Final-map route28 covers4classes main forward/return, short wall, both optional site ascents/returns. Roof32 covers4classes/8roofs, ordinary gate/office roof-step approach, eave jump, movement to roof center, drop to support and directional projectile probes. These are isolated geometry tests. Final-map Continue passes old snapshot/import/Retry/new snapshot checks. Occupancy10 covers authored alternatives, living hero occupancy, all71 legacy hold candidate positions, blocked-state Continue and finite resumption; terminal cancellation uses explicit won/lost fixtures, not actual combat death/victory.

Independently compared current campaign with geometry-tested eb373e4: all stage objects identical; only vector artwork changes in8Stage21 library buildings. No collision, oneWay, actor/objective/wave or other library field changes. Thus those geometry tests remain applicable after paint changes, without claiming fresh reruns after painting. Source-bound occupancy record identifies preceding geometry campaign32926f… and final route/Continue/occupancy timestamps follow the one-way conversion.

## Direct pixel review

Opened final-art gate/street/office/mobile diagnostic PNGs, plus latest final-art-live-browser officePC/mobile/portrait pixels. Tile courses and thatch bundles now visibly render. Gate arch voussoirs and masonry, timber roof structure, muted trim and place hierarchy are clearer than the rejected candidate. Market upper deck/crate and lower passage are distinct. Actual players traverse the office front/lower path without concealment by its rear retaining face. Active actor, party resources/skills and offscreen goal cue remain readable in both mobile orientations; portrait goal text shortens normally.

Also inspected prior geometry-identical roofs-final-live-browser marketPC and holdiframe. Diagnostic cameras are not gameplay framing evidence; live browser images restore observed real-play snapshots and retain mission targets. They do not constitute full browser input replay. Latest final-art-live-browser/result.json records20views, matching final trace source hashes, with0errors. Directly opened its holdiframe as well as officePC/mobile/portrait. Final parity/result.json regenerated2026-10-16T01:06:30Z reports Stage21 Game/StageView0differing pixels, actual iframe launch, stop preserving project/restoring camera, disposal and0browser errors. These final results supersede the earlier pre-paint parity result.

## Scope limits

This judgment covers requested Stage21 map/route/roof/body/objective/wave/save/input-policy checks. It does not assert original reference-photo conformity, whole-campaign regression success, final user visual approval, full browser-input completion, master/Pages delivery or deployment approval. Historical unavailable-Git city-suite and Stage5 environment-fixture failures are exclusions, not passes. The original input photo has not been independently available to this reviewer. Parent handles public HTTP verification; no successful Pages result is claimed here.
