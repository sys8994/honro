# Early encounter placement review · 2026-11-18

## Scope
Only fresh initial placement is authored. No unit is added or removed, and IDs,
stats, roles, elite identities, encounter membership, quest/wave definitions,
terrain, map revisions and serialized battle snapshots are not edited.

- 13: the live initial scene has **three**, not four, overlapping picks at the
  cave house. Source actor 18 is already relocated up the descent by existing
  sanitization. Keep it and the house pair (20,19). Move only actor 21 to the
  existing inner gallery, as a distinct elevated sentinel.
- 29: keep Han Taerok, both shields and both command archers. Move existing
  letter-store guard 2 to the archive entrance/sluice approach and archer 3
  to the existing upper ascent, separating approach security from command.
- 8 and 20: prior inspection supports retaining the small intentional groups.
  21 has building-specific groups, not a stage-wide left pile.
- 9, 17, 30: additional actual Scene review in progress; no placement changes
  or acceptance claims for these stages yet.

## Evidence and boundaries
Initial source/Engine survey is not a screenshot. The CI fixture separately
renders the production Canvas Scene in Chrome at fixed DPR 1/time 2/seed3910
with storage access prohibited and network prohibited by CSP. Baseline disables
only this new author in the test runtime; the shipping author remains enabled.
Screenshots compare identical camera requests. This is not public UI, normal
player input, saved-player state or mission-clear evidence.

`tests/early-encounter-contract.mjs` checks that only the three recorded x/y
pairs differ from the previous source, idempotence, the final post-sanitize
position and named contact, body separation and eight seconds of initial
Engine settling without position drift, injury or death.

The local action diagnostic explicitly prepares one nearby hero and one
enemy slot, then uses the original Engine. Any windup follow-up uses an actual
Canvas warning and hero wait before a second prepared enemy slot. Report
damage/shot/warning observations, not a claim of normal-route acceptance.
A no-effect result must be investigated, not relabeled successful combat.

## Source ordering and save preservation
The author follows Act2Compact and Act1ReviewRepairs. Editing the old Stage13
input earlier would violate the compact package's source equality contract.
It changes new project units only, adds no Engine hook and does not bump the
map revision. Existing saved battles are neither rewritten nor discarded.

## Publication
Candidate branch only. Final master/Pages integration and public confirmation
belong to the coordinated release, not this isolated inspection.
