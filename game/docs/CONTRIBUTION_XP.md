# Contribution XP policy 4

## Contract and migration

New campaign chapters use a per-stage version-4 contribution ledger. The shared ledger can contain historical version-3 stages and new version-4 stages. Historical version-3 in-progress stages and all their retries finish under the original policy. Unfinished version-4 ledgers upgrade to rewardBalance 1 on load or the next settlement, including deferred split rewards. Saved raw support evidence is sufficient: already-paid XP, defeated/settled enemies, finite tokens and the original budget stay intact. Only remaining payouts use the new weights; completed stages never reopen. No old earned XP, skill allocation, training, or historical payout is redistributed. The first genuinely new chapter starts policy 4. Custom/Workshop legacy maps retain the old campaign policy; practice has no contribution payout.

The old per-person chapter increase B stays unchanged. A normal stage freezes N × B for its initial genuine companions; summons/NPCs do not increase N. Stage16 with four companions has17,240 total XP. A late companion may contribute after arrival but does not retroactively enlarge the frozen budget. Initial catch-up factors affect positive contribution only:10% per level below the initial party median, capped25%. Catch-up multiplies contribution scores before the shared slice; it does not directly multiply the equal party share.

XP is added to each person's existing total. New-policy chapters do not shift a common absolute end target to the highest party XP and do not level everyone's total at completion.

## Finite evidence and scoring

- An enemy's effective damage has100 × authored risk weight points per original maximum HP. The original maximum HP minus the actual remaining HP is a monotonic high-water mark. Enemy healing, replay, nonlethal floors, overkill, or retries cannot reproduce the same HP interval. Nested on-hit damage commits the parent interval first.
- Damage ownership follows the original companion for summons, enthrall projectiles, curses and delayed effects, including a dead or removed original owner. The projectile/explicit effect source is retained rather than the current active hero.
- Armor weakening, manifestation and sourced spirit attack enhancement divide the effective HP damage between the attacker and providers. The original damage calculation, critical outcome, cap and shield amount are retained; contributions do not reroll combat. Authored manifestation with no player source is not silently assigned to an unrelated curse caster.
- Defense, timed guard, gate arrival protection, sourced spirit defense and actual shield absorption receive only the finite HP loss actually prevented. Layers share that prevention; lethal overkill with identical final HP loss is worth0. Shield creation/renewal alone is0.
- Healing consumes only outstanding enemy-caused wounds. Overheal, self-funded HP costs, environment/self damage and repeated healing of the same wound are0. M10, M09, counter-stance recovery, items, ordinary waiting and the actual App defense button are connected to the same wound accounting. NPC healing, authored rest, camp/mission rest and free level-up healing consume wounds without granting player support points. Checkpoint and whole-stage retry reconcile outstanding wounds with the restored actual HP deficit without replenishing threat tokens.
- Each enemy/recipient/10%-HP-progress band has a threat high-water envelope. A repeated equal-strength attack in the same band, time passing, refresh, or retry cannot refill it. HP support is normalized to the recipient's maximum HP at that event. Outstanding wound records are bounded by the finite threat envelopes.
- Hard stun contributes15 × risk weight only when that enemy would actually have occupied a limited action slot, with at most two distinct progress-band opportunities per enemy. Immune/out-of-queue enemies and repeated casts score0.
- Actual full missile removal by blade screen or eater grants a small **blocking utility**, not hypothetical prevented HP:3 × risk weight × min(1, projectile damage /20). Only positive-damage, hostile, non-body projectiles with a hostile source qualify. Original source+shot is counted once, one removal per10%-HP band, at most five per enemy (15 × weight lifetime maximum). Partial blade-screen attenuation is credited through actual later HP prevention instead.
- All survival/control/block raw support shares one60 × enemy risk weight ceiling, scaled proportionally at settlement, then receives a1.25 multiplier. Effective support is therefore capped at75 × enemy risk weight (previously60). A real control opportunity is18.75 effective points (previously15); full-strength projectile blocking is3.75 (previously3). The raw evidence and opportunity limits are unchanged. Support is pending until the enemy's HP progress or genuine resolution confirms useful encounter progress.
- Goal contribution records cover real maintenance intervals, effective durability, safe rescue approach, leading/escort progress, individual crossings and successful interactions. M09 ownership is credited only when its actual traversal produces new goal progress. Details and representative chapter coverage are in OBJECTIVE_CONTRIBUTION_XP.md.
- Unattributed enemy damage and goal progress keep an explicit `_system` share. It is not granted to a tiny remaining player contribution. NPC99% + player1% cannot turn into100% player XP.

Enemy identity uses authored unit IDs or separate logical wave source+wave index+member index, never runtime projectile/summon nextId. The gameplay spawn source is unchanged. Goal and control tokens are stable across retries. Control tokens use the stable enemy row plus HP-progress band, including when the runtime unit ID changes. Evidence is in the saved ledger, not reconstructed from UI messages or lifetime damage counters.

## Settlement and conservation

An enemy's finite combat slice is finalized once at an action boundary following its defeat. All slices together can spend at most40% of the ordinary stage budget. Integer remainders and any unspent combat amount roll into chapter completion. Completion distributes the remaining stage budget using all effective chapter contributions. For rewardBalance 1, each player-earned payout is80% contribution-proportional and20% shared equally among that stage’s registered genuine companions. An inactive companion receives only this small shared slice; absent split-branch heroes are not registered recipients. The `_system` score is preserved and contributes nothing to the common pool. No valid player evidence still means no common reward. Integer apportionment can differ by1 XP between settlement boundaries; the total pool is unchanged. Final-hit bonus is0.

No grant is revoked after a later contribution. A party defeat keeps earned XP and the complete current ledger; a retry reuses the original budget, accepted HP intervals, goal/threat tokens and settlement flags. Save interruption selects the newer serialized contribution sequence and recovers its already-earned XP; it does not overwrite it with a stale profile ledger. Recovered level gains refresh real companion stats while preserving HP deficits and death, rather than resurrecting or transforming enthralled enemies.

For every stage:

allocated XP + explicit system/cap/no-evidence exhaustion + pending budget = original budget.

The80% personal slice rewards positive contribution; the20% common slice includes registered companions with zero contribution. MAX_LEVEL excess is reallocated among uncapped recipients according to their mixed reward weights. If all recipients are capped, the excess is explicitly exhausted. A forced clear with no valid evidence is exhausted, not an equal-XP fallback. Original earned totals are never reduced.

## 2+2 expedition

Each stage keeps its original4B budget. Stages25–27 only allow their two active companions to receive up to2B ×40% combat payouts. The remaining budget waits until reunion (stage28; historical split-v1 reunion remains27).

At reunion, each hero is compared using the budget-weighted mean of their relative contributions per actual assigned stage, normalized by that stage's active roster size. Scripted absence is excluded from their opportunity denominator; death or doing nothing during a assigned stage is included. The resulting total expedition entitlement deducts already-paid combat XP before distributing the remainder. This avoids rewarding the25/27 branch simply for having more stages. Stage records are consumed once and keep their own paid/forfeited accounting.

## Validation and remaining scope

Focused headless tests:

- tests/support-xp-balance.mjs: before/after damage and support cases, zero evidence, neutral shares, partial-paid v4 upgrade, repeated load and completed-stage preservation
- tests/contribution-xp-ledger.mjs: proportional allocation, deterministic integer remainder, finite support, unknown/system share and MAX_LEVEL
- tests/contribution-xp-engine.mjs: actual damage/healing/shields/weakness/manifestation/recursive effects/stun/missile removal/summon death/retry
- tests/contribution-xp-healing-boundaries.mjs: actual App defense, NPC healer, authored rest, camp, mission rest and checkpoint HP restoration
- tests/contribution-xp-app.mjs: real App export/import, Continue, retry and once-only completion through DOM/storage doubles
- tests/contribution-xp-migration.mjs: policy migration, frozen budget, split reunion, joins, interrupted snapshots and read-only real stage16 save
- tests/objective-contribution-invariants.mjs, objective-contribution-runtime.mjs and objective-wave-provenance.mjs: effective goal evidence, neutral shares, all30 goal-kind inventory and real repeated-wave producers
- tests/act3-growth.mjs explicitly preserves the historical v3 migration/reward-curve contract; it no longer claims shared XP is the new policy.

These are production-function fixtures, not a claim of full normal-resource campaign play or browser verification. The original stage16 save is only read and cloned. Actual deployment/browser verification belongs to final integration.

First-release limitations: speculative slow/push/movement-caused avoidance, mana supplied then consumed much later, generalized cleanse-to-future-action causality, reflection chains, and future revive skills do not receive guessed cast-count points. Explicit gate-to-goal movement and real blocked projectiles are covered. Stable support envelopes intentionally do not reward repeated identical dangers in an unchanged enemy-HP band. The30-chapter inventory is broader than the representative actual goal-flow fixtures; normal continuous campaign validation remains separate.

## Direct HP mutation audit (release boundary)

The common damage ledger limits credited new HP progress to the current receipt's actual loss. Earlier unobserved loss is assigned to the system, including a zero-damage receipt. The adapter uses the fraction of the enemy's current maximum HP against its frozen accounting HP, so ratio-preserving difficulty/encounter rescaling cannot create damage. Engine fall recovery immediately records a neutral receipt. Healing accepts only actual restored HP and consumes any outstanding wound amount beyond the pre-heal actual deficit without player credit.

Inspected production paths:

- Engine hurt/nonlethal/last-stand final HP, fall recovery, lava/zone/DOT routed through hurt, item heal/cleanse, wait, campCheck, enemy healer, summon expiry/eater sacrifice and capture/release HP rescaling.
- Skill M09/M10 and warrior counter recovery, warrior HP self-cost; HP self-cost creates no hostile wound.
- Runtime App.defend, NPC allies healer/ritualist, allies restore/rest and mission rest marker. The chapter10 boss safety wrapper clamps to a live HP floor before core hurt.
- Progression grant/level-up, interrupted earned-XP restoration, new-stage/whole-stage retry, split-campaign vitals and actual stake-checkpoint restore. Max-HP growth preserves deficits; full/free recovery consumes wounds.
- Authored enemy creation/tuning, difficulty scaling, Act2 encounter scaling, rescue extraction and scripted terrain breaks/open gates. Spawn tuning has no damage event; extraction finalizes unresolved enemy HP as system contribution. Terrain damage and scripted goal progress use the separate finite objective provenance.
- Practice resets, practice/training unit construction and non-campaign core grants are outside the campaign XP policy. Enemy-only healer actions cannot heal allied hostile wounds. Dead/expired summons do not create enemy XP rows.

Regression evidence includes actual Engine.recover followed by a hero hit, an intentionally uninstrumented direct HP reduction followed by a hit, enemy HP rescaling, enemy regeneration, actual App.defend, NPC/free healing followed by self-funded damage and healing, and checkpoint rollback. This audit does not claim a browser playthrough.

## October 14 support/common tuning examples

A four-companion stage retains17,240 XP. With equal initial levels and one complete settlement:

- Damage80/20/0/0:13,792/3,448/0/0 becomes11,896/3,620/862/862.
- Damage100 by one hero, effective healing30% of an ally’s maximum HP by another:13,262/3,978/0/0 becomes10,893/4,623/862/862.
- One damage contributor, three idle companions:17,240/0/0/0 becomes14,654/862/862/862.
- No player evidence:0 for everyone; a neutral NPC/environment score is exhausted rather than shared.

An in-progress v4 chapter that already paid6,896 XP to one attacker keeps that award. Its remaining10,344 XP uses the new mix (one attacker example:8,793/517/517/517); the final total remains17,240. This does not retroactively equalize earned XP or levels. Historical v3 chapters retain their existing shared-growth policy until the next new chapter.
