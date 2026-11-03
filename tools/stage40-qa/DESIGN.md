# Stage40 finale repair card, 2026-11-03
Status: diagnosis, NOT gameplay approval, NOT release.
Base integration source: 7d2655bc3f88a7b20fb2d6ea1bc4c611583e9a15.
Existing unpublished author: 59fa9eb62f0ab9c89fb7e504a32f9241d9785f38.
Approved v4: 42 unique enemies including one required major boss and two minibosses; full battle and safe return 18–20R. Preserve terrain/art, four residents, boat2/highpath2, survivor accounting13/11/2, all story/identity/save contracts. Stage39 boss remains optional.

Prior evidence preserved in collector _local/reports/act4-recovery:
- play40-ci-41354740770: R25,11/42 kills,3hero deaths.
- policyBArtifacts-41356737486: R25,30/42 kills,2hero deaths.
- policyCArtifacts-41359591901, bf48eacc: R25,40/42 kills,0hero deaths; major1858/5486HP. 68launches,25defends. Knight stationary at dock x1204 R7–18.
- policyDArtifacts-41361878217, d85d8b2f: R25,37/42 kills,2hero deaths; major5486/5486HP. 69launches,9guards,2defends; boss warning onlyR23. This fourth failure was omitted from old README; it is NOT a new run or success.
All four residents survive these diagnostics. No combat-to-return success established.

Primary causal hypotheses, in order:
1. Controller ignores learned S06 piercing sweep entirely despite four-hero late-game kit, uses single-target leap repeatedly, guards before evaluating offensive alternatives. Compare unchanged candidate through production inputs with legal S06 and proximity-aware melee.
2. Strict local support target sorting and no movement while any safe shot exists serializes west/dock/lower encounters, leaving boss afterR20. Test advance-and-fire from supported safe positions; never chase x alone across layers.
3. Actual body obstruction/role spacing: verify supports and closest legal shot, not group name or raw count. No HP nerf, actor deletion, cap change or terrain edit without actual cause evidence.
4. Lower boss and major fight may remain structurally too sequential; only after controller comparison propose concrete supported relocation and run art/terrain reviews if geography changes.

Bounded diagnostic registration: one unchanged-candidate Stage40 run, fixed preserved 39-complete profile SHA256 2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141. Stop at terminal outcome or R25 diagnostic budget; R21+ always fails approved20R, never stop early to fabricate success. Preserve all input/event logs. Native App/DOM doubles are diagnostic, not browser/subjective fun. Actual browser final-source run remains required.

Integration: port Stage40-only author, tide/boarding safety, boss pattern/art, scoped armor and stage40 maprevision dependency; retain latest dialogues and Stage31 gate. Do not merge old59fa tree. Root owns remote/master/Pages publication.

Port review accepted by coordinator; source scope checks passed (small fixtures only).
- Existing source quiet(b) requires no living enemies before return starts. Port does not add new all-kill counter or change final safe-return/next-dialogue/exit win checks.
- Starting checkpoint came after declared33–38 fixture, then actual39/40 play. This is a prepared endgame profile, not full earned1–39 evidence. Verify affordable SP and retained gear before launch; no ranks/equipment/stat changes.
- Stage31/34/39 pilot action+relocation fixtures matched base; stage31–39 authored objects unchanged, terrain/residents/escort unchanged; maprevision only40=6.
- Separate engine port f9c973d3 preserves existing9515ec00 directional armor exception under honroAct4FinaleBoss=true AND preview40 AND revision2 only.
- Generic helper changes are gated to40: relocation home alternation, charging-time warning offer refusal, bind effect and rank labels. Old31/34/39 behavior preserved; no reviewed.json port.
