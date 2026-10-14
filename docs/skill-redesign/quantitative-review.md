# 먹귀 / 반탄파: quantitative review and verification contract

## Existing quantitative logic remains real

`balanceModel.ts` is a live legacy damage normalizer, not decoration. At the pre-change checkpoint, M11 scores 67.31 against legacy target 168 but intentionally has `redesigned` factor 1. O14 scores 7.68 against 146 and receives factor 3.09; multiplying its zero seed damage still produces zero. Neither score prices the new branching pattern or enemy imprisonment. Changing legacy factors to force these scores onto a target would therefore be unjustified.

`spBalanceModel.ts` supplies the existing weighted geometric four-axis marginal: expected offense, effective HP, paid-action budget, movement. Its passive formulas and explicit scenario weights stay intact. At level 15, one point of general training gives mage 1.93–2.21% and occultist 2.09–2.31% modeled utility. These are reference opportunity costs, not a universal damage-percent target. Active acquisition, terrain hit chance, target count, extra allied actions and boss exclusion cannot be reduced to the passive rank gate.

## Reflection: conditional branches, not twelve guaranteed hits

The independent audit asserts every authored SP plan, one initial projectile and maximum live frontier 1/2/2/4/4/8/8/12. With per-generation factor .82, later per-projectile damage is .82/.6724/.551368 of the launch damage. At SP8 the final twelve descendants have 6.616416 launch-damage capacity only if all twelve hit. A branch that hits a unit stops; it cannot also spawn a later generation. The audit's recurrence explicitly prevents counting both.

The open, mixed and corridor probabilities are sensitivity assumptions, not observations. They expose the dependence on geometry rather than hide it inside a favorable average. Rank 7 retains eight maximum descendants and gains from the existing damage/mana formulas. Its marginal is checked separately. The optional geometric comparison declares a 25% active-cast share; results change with that share, so no arbitrary pass band is applied to it.

## Eater: control and duplication have separate prices

The retained base-HP formula gives level-15 caps 243 at SP1 and 362 at SP8. With three durable prisoners the maximum copied damage is 729/1086. Reaching it costs 243/362 allied damage, leaving 486/724 additional damage beyond that investment, plus the initial cast action and MP. If allies can deal 250 actual prison damage before each enemy phase, the prison breaks in one/two rounds: it cannot also receive credit for the complete advertised two/four-round denial. The independent audit simulates that ordering, including idle and 100-HP/round cases.

Radius grows 215→320 and duration follows 2/2/2/3/3/3/4/4. More radius can cross an extra-enemy boundary; smooth area percentages do not guarantee useful targets. With one prisoner the damage duplication itself creates no additional total damage; control remains the benefit. With no eligible enemies or only excluded bosses, capture contributes none. Six durable prisoners can copy up to six times the HP cap. The design has a per-target cap, not a shared cap over the group, so density is an explicit balance risk. The audit records this rather than inventing a target limit or weakening the requested mechanic.

## Required release evidence

- Real Engine: one-time capture, elite/boss distinction, nested/duplicate capture, fixed ground placement, no actor turn, ally attack attribution, HP-capped transfer, no enemy damage forwarding, survivor return and Continue.
- Campaign: prisoners still count toward kill/clear/wave population; the prison does not count as a killable quest enemy. Captured actors cannot target, collide, block interaction as active threats, render or receive collateral damage. New spawns are not captured later.
- Existing ally protection and contribution XP tests remain necessary: the hostile prison must be targetable by autonomous allies while sharing its summon owner's provenance, and it must never create XP from its own HP.
- Native Canvas: production Engine/Scene renders at SP1/4/8, first/reflected/maximal generations, and eater empty/single/multiple/damage/release states. Assert rendering does not mutate battle state. Review actual pixels rather than substituting a mocked renderer.
- Native images prove renderer state/pixels only. They do not establish browser input, saved browser storage, performance, Pages deployment or physical audio. The known Chromium socket/ptrace permission denial must not be bypassed.
- Final current source membership, ordered build parts, compiled core and both HTML bundles must be pinned. Add an exact reversible delta after the audio approval. Preserve the immutable history archive and every earlier approval/fingerprint byte; never accept broad file allowances or label a projected historic fingerprint as current gameplay evidence.
