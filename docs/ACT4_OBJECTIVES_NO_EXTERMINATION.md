# Act 4: objectives without map-wide extermination

User direction: remove required enemy extermination; preserve story, equipment facts, saves and physical traversal.

## Changed chapters

| Stage | New required progress | Living enemies allowed |
|---|---|---|
| 31 | Reach the shore signal point, interact to call the boat, survive two rounds, gather the living party on the docked deck, depart | Yes. Old approaching/docked boat saves retain their phase and need not signal again. |
| 32 | Make the shelter vicinity safe (650 world-unit radius), meet the witness, retain the witnessed reunion and seven-person report, gather at the exit | Yes, outside the shelter vicinity. Enemies can be displaced instead of killed. Free post-combat regrouping remains full-clear-only and is not required for completion. |
| 35 | Traverse the bamboo terrain and gather the living party on supported ground beyond the authored exit | Yes. Optional flask handoff requires only local safety and its existing observed animation. |
| 36 | Push the ruined door, observe its fall/departure story, gather the living party at the authored exit | Yes. Door/event receipts remain necessary. |
| 40 | Escort all four living residents by the authored boat/upper routes, observe reunion/roster/next destination, gather at the safe end | Yes. No change to the identity of the final enemy or its attacks. |

## Preserved

- Chapter 32 reunion camera and exact seven-person proof, chapter 39 rescue proof and chapter 40 campaign roster verification.
- Physical grounded checks, actor collision, NPC routes, terrain, art, enemy stats and encounter placement.
- Equipment fact IDs, one-time reward ownership and save version. No synthetic kill records or replacement of the original alive enemy list.
- Existing clear-report / campaign outcome wrappers. Completion still flows through the existing mission API.

## Verification scope

`tests/act4-no-extermination.mjs` executes real event modules against focused fixtures. Every positive clear keeps an enemy alive; negative cases cover early signal, one-round holdout, unresolved attacks, missing story proofs, airborne party members and dead residents. JSON checkpoint preserves the signal timer. This is not full gameplay or visual proof.

`tests/act4-objective-map-contract.mjs` checks signal interaction against actual authored Stage 31 terrain with the production Engine and pilot reference. Endpoint placement is an explicit test fixture, not a traversal completion claim.

`tests/act4-shelter-travel.mjs` retains the existing real-Engine Stage 32 movement-budget/quiet-regroup/JSON-remount regression.

Final generated build, rendered UI review and normal-player traversal/encounter balance remain integration acceptance tasks. Source test success must not be described as a full playthrough.
