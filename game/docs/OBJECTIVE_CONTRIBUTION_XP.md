# Objective contribution XP v4

This document describes accounting hooks, not a change to mission, combat,
movement, story, or failure rules. Existing v3 stages and custom maps do not
acquire these records. A fresh v4 stage stores evidence inside
`honroGrowth.ledger.stages[stage].contribution.objectiveEvidence`.

## Events and finite score budgets

- **Actual objective durability:** up to 20 points per authored destroy target,
  campaign seal, carriage blocker, or Stage10 outer binding. Effective lost HP
  is accumulated by source; the final hit does not take the earlier damage.
  The token is committed on destruction. Environment/NPC damage consumes its
  portion as neutral `_system` score. That share is explicitly forfeited at
  settlement, so an NPC's 99 HP plus a hero's 1 HP cannot assign the whole
  stage reward to that last hero.
- **Stage5 waterfall array:** when actual cleat damage is enabled by a living
  mage maintaining the array, 40% of that effective loss belongs to the holder
  and 60% to the attacker. Starting/restarting the ritual alone earns zero.
- **Required holds:** a total of 20 points divided over the authored required
  rounds. Only actors present throughout the qualifying unchallenged interval
  share that interval. Last-frame arrivals, interrupted maintenance, repeated
  same-frame reads, and extra rounds while a wave is blocked add no hero
  points. An actually completed interval without a traceable sustained holder
  consumes its neutral share instead of inflating the remaining heroes' shares.
- **Rescue approach:** a first observed outside-to-inside entry into the living
  resident's safe working area earns 18. This is a real boundary crossing,
  with no nearby live foe on that floor, not a periodic proximity reward.
  Successful extraction then earns 2. Without observed eligible approach,
  the successful short interaction earns 5; missing evidence is not invented.
- **Short interactions:** successful document/device/receiver use earns 5.
  A terminal interaction following recorded stage progress earns 2. Failed
  attempts, repeated clicks, ritual refreshes, and repeatable spirit lamps
  earn no additional tokens.
- **Reach/route selection:** 20 for the actual arriving actor. A required
  all-party reunion shares among the actors required to arrive. Choosing a
  different alternative route on retry does not create another route budget.
- **Waterworks crossings:** 10 per arriving member, 20 per two-person landing.
  A skipped landing is not automatically credited as a visited landing.
- **Escort:** up to 20 per authored escort leg. New high-water progress toward
  the goal is attributed to the actual forward leader responsible for movement
  in the existing escort predicate. Act3 selects the closest qualifying leader,
  rather than distributing to nearby spectators. Progress is committed when
  the leg completes; any unowned portion remains neutral rather than being
  redistributed to heroes. Standing still, backwards movement, and returning over
  already credited ground earn no additional score.
- **M09 movement support:** traversal alone is zero. When that traversal takes
  the actor from outside to inside a new objective boundary, 25% of that
  actor's finite arrival score is assigned to the gate owner. Same-zone,
  stale-turn, unrelated, and return trips give no movement credit.

These scores affect the existing stage XP budget's relative distribution; they
are not extra XP. The progression module owns the fixed party budget, integer
allocation, catch-up, payment timing, and immutable consumed-token ledger.

## Retry and source persistence

Terrain has attempt-local effective damage and a persistent maximum. After a
retry, replaying the first 40 HP of an already credited 40 HP does not generate
new ownership. Escort uses a saved goal-distance origin and persistent progress
maximum. Successful objective tokens are stable per chapter and goal, never
per round-trip, retry count, or ephemeral effect ID. Export/import preserves the
same ledger. Removed summons and owners resolve through the progression
ledger's saved owner-class mapping when the live actor no longer exists.

Hero position samples and unconsumed gate receipts are battlefield state, not
score. Merely restoring a save, reading the HUD, or standing near a marker does
not create an approach token. The confirmed-win hook closes the Stage1 engine
ordering edge where victory can be observed before a mission tick.

## Current production coverage, chapters 1–30

| Chapter | Objective evidence |
| --- | --- |
| 1 | Actual exit arrival |
| 2 | Hero damage to carriage blockers; effective combat/protection remains in the combat ledger |
| 3 | Successful ledger retrieval |
| 4 | Effective combat/protection; no objective token for the round timer itself |
| 5 | Cleat durability split with the maintained waterfall array |
| 6 | Actual rescue initiation and leader-caused new escort progress |
| 7 | Eligible rescue entry and successful extraction for each resident |
| 8 | Each binding's actual durability contributors; boss damage in combat ledger |
| 9 | Successful receiver installations |
| 10 | Outer-binding durability and receiver installation; effective protection/combat during the finale |
| 11 | Knot interactions, required knot hold, resident rescue, final trace |
| 12 | Sign interaction and committed alternative-route arrival |
| 13 | Resident rescue, gate interaction, exit arrival |
| 14 | Three resident rescues, bridge interaction, actual refuge maintenance |
| 15 | Sluice/groove interactions and committed alternative-route arrival |
| 16 | Monk rescue and witness/hall/record interactions; threat removal in combat ledger |
| 17 | Brace/repair/notes interactions and actual hoist maintenance |
| 18 | Silence interaction, actual suppression maintenance, anchor durability, leak interaction |
| 19 | Successful authored separation/send/investigation interactions |
| 20 | Convoy start, leader-caused progress in both escort legs, actual convoy hold |
| 21 | Resident rescue, actual refuge hold, city exit arrival |
| 22 | Archive/ledger/register interactions, comparison hold, exit arrival |
| 23 | Dispatch/start interactions and leader-caused progress in both carrier legs |
| 24 | Crest/seal/register interactions and garden exit arrival |
| 25 | Entry/document interactions, actual safe landings with gate provenance, exit arrival |
| 26 | Latch/investigation/casting interactions, artisan rescue, exit arrival |
| 27 | Route/manifest interactions, actual safe landings with gate provenance, exit arrival |
| 28 | Two fire-control interactions, actual reunion, record interactions, exit arrival |
| 29 | Actual seal hold, letter interaction, committed alternative-route arrival |
| 30 | Transport record, actual ferry hold, old-road arrival |

Current fresh Stage16 has no `hold-hall`; current content must not be confused
with its historical map. Legacy authored hold/destroy goals in Act2/3 use the
same generic hooks when running under a new contribution ledger, but legacy
v3 battle payment policy remains unchanged.

## Deliberate non-attribution and limits

- Stage2 autonomous NPC carriage movement and Stage4/10 pure elapsed defense
  timers do not identify a participating hero by themselves. No nearby-party
  or equal idle bonus is invented. Actual threat removal, protection, healing,
  and blockade damage supply the relevant actor evidence.
- Automatic bell descent, cargo settling, and ferry settling are consequences
  of their already-recorded prerequisite goals, not extra button rewards.
- Broader route-clearing inference, ability resource supply, and slow/knockback
  counterfactuals are outside these objective hooks.
- Escort high-water is geometric progress toward each leg's final destination.
  A necessary detour that initially increases that distance creates no objective
  score until it makes new forward progress. It is not claimed as full path-
  length attribution. Threat removal and protection still score independently.
- Changing the original goal or granting arbitrary stand-near credit to hide
  missing data is not part of this implementation.

## Verification

- `node tests/objective-contribution-invariants.mjs`: finite tokens, effective
  durability and maintained ritual ownership, hold continuity, unsafe rescue,
  movement causality, escort loops/retry, removed-owner lookup, JSON persistence.
- `node tests/objective-contribution-runtime.mjs`: current production goal-kind
  inventory for all 30 chapters, real engine Stage5 durability, actual mission/
  interaction/hold call paths, and explicit escort-motion fixtures.
- Existing mission/defense/route/waterworks regressions must still pass during
  integration. Neither fixture suite is an uninterrupted normal-input campaign,
  real browser/Pages check, or a balance approval.
