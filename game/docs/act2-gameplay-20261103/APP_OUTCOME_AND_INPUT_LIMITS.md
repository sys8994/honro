# App outcome, input accessibility and RNG audit

## Important correction: legacy consumables

Engine.item has not been shown to have a binding in the current normal player UI. Three observed paths used it: Stage11 survival101 (2 heals), Stage13 survival606 predecessor (3 heals), Stage15 survival303 predecessor (3 heals). Their continued wins inherit those actions. Preserve these as **legacy-consumable Engine-only calibration**, not normal-player-equivalent clears or formal player clear-rate samples. Existing failures are retained. The report traces continuation ancestors rather than treating zero items in a continuation segment as zero for the complete path.

The new generic/frozen controller has **no Engine.item calls**. Normal App.defend, trained skills, equipment and normal movement remain available. Native calls still do not establish browser input equivalence.

## Genuine terminal versus persisted App completion

Older native pilots ended at the Engine won/lost phase. They did not execute the normal frame's subsequent App.outcome path. Independent unchanged saved-win Continue → guarded App.outcome → sequential Story.next completed and persisted chapters11/12/13/16/18/20. This does not cure legacy item use, missing browser coverage or timing failures. The old Engine-only terminal and outcome probe are separate evidence, not new samples.

Stage16's mandatory witness originally stalled because the helper skipped dialogue via Story.finish. Sequential production Story.next correctly presents all eight rows; the observed continued win at R30 now records witness16_heard=true and matching sourceRun in the persisted reviewedPhysical history. Do not weaken this intentional gate.

Stage19's old pre-outcome Engine-won save fails migration at HonroEquipment.migrate (`NPC 장비 오류`), with store failed/migration and no local art table. This is **not attributed to the new Act2 art codec** (the QA baseline predates it). Fresh in-session sequential Stage19 completes normal App outcome, clears honroBattle, persists chapter19 R1, and reloads ready/unlocked. The transient pre-outcome export and final cleared profile are distinct; no new P0 is asserted from this observation.

## RNG semantics

Earlier diagnostic CLI seeds explicitly initialized b.seed and b.rng once before first gameplay input; they were synthetic Engine-RNG fixtures, never shipping-canonical or human samples. They did not merely replace Math.random. Child Stage18's four predeclared fixture cases retain that scope and unchanged results.

New input robustness cases never assign Engine RNG. Canonical seed is `b.stageId*19381+7`; the map wrapper uses engine stageId1 for observed chapter19, giving19388, although honroStage is19. A wrong chapter-based assertion halted the smoke test before any trial result; it was corrected before registration. Both identifiers, actual seed/rng, input-error seed and actual requested angle are recorded. Only requested aim receives deterministic ±0.15° jitter. Two input seeds per policy are descriptive robustness cases, not human-clear probability.

See `input-cohort-registration.json` and the separate Stage18 cohort report. All original quantitative gates remain unchanged and releaseApproved=false.
