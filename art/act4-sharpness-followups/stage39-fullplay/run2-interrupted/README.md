# Interrupted diagnostic: missing pilot combat module

The controller was stopped on instruction after discovering this runtime lacked `act4-pilot-combat.js` and its reference data. This run therefore used generic behavior for tagged midbosses and is not evidence of the intended Stage 39 combat balance or normal mission completion. The final logged observation was round 33, phase review, shot 168: all four heroes alive, all four residents alive and marked rescued; mission not cleared. The last action screenshot predates the interrupt and is not necessarily the exact final frame.

Interrupting the live browser closed its context before a final automatic-save export could be taken. The final live event log and the last available action image are preserved; earlier round-9 and round-12 game-generated checkpoints remain independently available. A fresh run with the restored dependency is required. No mid-run enemy stats or health were changed.
