# Stage 31 low-estuary calibration 74f9: observed combat, not a tuning change

Run `74f9a0ef-7ab5-4185-bb42-97e556e9da20`: production defeat in R7,
6989 frames. Five of 34 enemies died; only the first shoulder was engaged.
This is one advance-policy calibration, not a player win-rate estimate or a
holdout. No candidate, cohort, HP, attack or difficulty was changed for analysis.

## Cast ledger

| Observed outcome | Player | Enemy |
|---|---:|---:|
| Accepted casts | 20 | 28 |
| Casts causing opponent HP loss | 12 | 25 |
| Opponent shield-only contact | 0 | 1 |
| Friendly-only contact | 3 | 0 |
| No recorded hit | 5 | 2 |

All 20 player casts used A01/M01/S00/O01; all recorded damage feedback was
noncritical. Enemy HMO01 also damaged/killed its own caster after it had received
S00 damage. That self-damage is not another player hit or another successful cast.
Multiple targets on one spell remain one cast; AoE is not summed into a fictitious
single-target hit. Last-hit HP loss is capped by remaining HP and can understate
the displayed damage (e.g. A01 displayed279, remaining bowHP93).

## Incoming damage and concentration

The direct archer-target LA01 hit was274/1085 HP (25.3%); the elite HWD01 hit
was301/1085 (27.7%). These are near the fixed archer reference26%/elite28%, not
observed runaway single-hit multipliers. Splash and other classes' mitigation
produce different fractions; this does not establish every hit on every hero
meets a universal22–30% band. Midboss was not engaged and remains untested here.

| Round / victim | Enemy casts with contact | HP loss | Shield loss |
|---|---:|---:|---:|
| R1 knight | 4 | 695 | 0 |
| R2 knight | 5 | 1006 | 0 |
| R3 knight | 3 | 390.5 | 222.7 |
| R4 occultist | 3 | 742 | 0 |

Single knight hits in the first two rounds were only7.6–11.1% of his maxHP, but
five concentrated enemy attacks removed nearly half his HP in R2. Six available
enemy actions versus four player actions, especially with low player productive
cast rate and a forward isolated knight, is real pressure. It must not be waved
away as merely a bot defect. Conversely these data do not show an unfair hidden
HP boost, forced revival, crit spike, distant second-pocket attack or water loss.

## Direction, contact position, distance and policy

- Every recorded player hit on a guard-role target came from its facing side:
  the native armor branch was .40, never the .05 rear branch. No successful flank
  counter is demonstrated. This includes the elite warden's guard phase.
- Guard#2 died after S00 207 + M01 remaining59: two player casts. Mourner#1 died
  after A01 230 + M01 remaining102: two casts. Bow#4 required three mixed casts
  (M01 164, O01 115, A01 remaining93). Elite warden#8 took O01 101, O01 splash75,
  then A01 remaining117. These are observations, not universal hit-count passes.
- `direct:true` is NOT a maximum-damage receipt. Engine blast retains the
  .42–1 distance factor even when directId matches. M01 direct bow damage164/175
  was below reference-matrix212; raw hurt inputs174.05/186.96 and rolls .980/.972
  corroborate that this is not solely damage-roll randomness. The successful
  analytic contact matrix does not cover all natural impact/edge-blast positions.
  Do not certify ordinary1–2 effective hits from that matrix alone.
- Friendly contacts were O01→knight (R1 HP25.5, R3 shield21.3) and A01→occultist
  (R2 HP61.5). Harmful actor interception is recorded, not a guessed terrain miss.
- Archer's three consecutive R4–R6 no-hit casts launched aroundx383/383/378,
  angles78.3/73.3/73.3. Mage's R4–R5 no-hit casts launched aroundx417 at52.6/38.7.
  Staying near the arrival bank while forward threats persisted is observed;
  the controller's separate movement audit addresses why.
- Successful initial archer and mage hits span approximately789 and669 pixels
  from fire origin to the victim's later hit position. Enemy bow also fired at
  the archer from only18 pixels after advancing nearx278. Thus this was not all
  distant fire across inaccessible terrain. Distances are not launch-time target
  positions or projectile path lengths.

The trace has fire/hurt/feedback but no terrain-impact, flight-expiry or blocker
receipt. The five no-hit casts cannot honestly be assigned to cover, range expiry,
angle error or collision bugs from this ledger alone. A straight line overlay
would not reconstruct a ballistic trajectory. Proposed diagnostic next step is
explicit end-of-flight reason/obstruction capture, without changing damage or the
cohort, plus policy use of visible obstruction and ally body checks.

## Reproduce, read-only

```
python3 tools/act4-pilot/analyze-calibration-ledger.py \
  <74f9a0ef-7ab5-4185-bb42-97e556e9da20.jsonl.gz> \
  <combat-analysis.json> <new-output.json>
```

The script requires a completed trace, preserves owner/shot provenance, and
hashes both inputs. Recorded derived evidence is
`tests/fixtures/act4-pilot-calibration74f9-ledger.json`. It does not modify its
inputs, execute the game, reconstruct unknown misses or infer population rates.
