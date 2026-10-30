
## 2026-10-29 Act4 silhouette revision and saved battles
- All31–40 authored geography changes require Act4Content revision3. Existing revision2 active battles are restarted through the existing campaign map migration at the same chapter entrance; no new profile reset or migration rule.
- Focused `tests/act4-map-revision.mjs`: currentrevision exactContinue, oldsnapshot discard/notice, growth/SP/loadouts/equipment/cleared/Act4 facts retained, paid snapshotXP recovered once, nonAct4/current/custom snapshots unaffected. DOM/Canvas/storage are doubles, not browser or normalplay proof.
- Only the obsolete currentbattle's actor/enemy positions, projectiles, turns and incomplete objective progress reset. Previously completed chapters and persisted Act4 proofs remain.
