# Stage40 native failure review

No gameplay, fun, browser or release acceptance. Product source is shared tree
`bfd01e19952dec64ee25789b1719d3ccb4740b06`; prepared profile SHA256 is
`2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141`.
The checkpoint follows a declared Stage33–38 fixture and observed39/40 play,
not a continuously earned campaign. Continue, retained gear/ranks and real App
inputs were used. DOM/render/clock doubles prevent visual acceptance claims.

## Retained outcomes

The four older failed browser trials remain listed in DESIGN.md.
- sweep-approach-01: no gameplay; cross-VM prototype assertion failed despite
  identical profile values. Retained log; corrected JSON-value assertion.
- sweep-approach-02, source348a5312: combat clearedR22, knight dead,
  other3heroes and4residents alive.63casts/21defends,10S06. No return proof.
- target-lock-01, source069b1157: combat clearedR23, archer and occultist dead,
  mage/knight and4residents alive.67casts/3defends,11S06. No return proof.
  Wall553.208seconds. This is worse survival and pace, not a passing variant.

Each complete run has protocol.json, entry.json, turns.jsonl, result.json,
analysis.json and final-profile.json under `_local/reports/<run-name>`.
The second changed only per-turn approach target retention and two bounded
45-frame firing-lane walks. No stats, geometry, equipment or encounters changed.
0 stationary noncast turns versus10 does not establish good gameplay.

## Actual observations and remaining attribution limits

1. Prior approach recomputed nearest target every segment. R11 archer alternated
   x1835↔1961, spending2805movement without attack. Target retention fixes that
   narrow defect; the failed comparison disproves a controller-only cure.
2. Target-lock run's dock-left7 are awake but untouched throughR12. Other foes
   are fought on the stair/lower side; rear cleanup lasts throughR18. This
   demonstrates serial/backtracking pressure, not that more damage is needed.
3. Archer592HP atR10,205HP atR11,0 afterR12 enemy response (R13). Occultist
   loses374HP during archer's R11 A02 action while round remains11, then falls
   afterR15 enemy response (R16). Same-round loss is not proof of its exact
   projectile source; isolated provenance capture is required. Our planner
   calls shotViable, whose scalar impact valuation uses the first contacted
   unit and terminal point but misses intermediate piercing friendly hits.
   The production aim guide already renders the full replayed arrow path. It must not be described as a guaranteed safe shot.
4. Boss warning/fire advances fromR15/16 toR11/12. It targets mage at lower
   deck while knight remains on dock/stair. Logged response=knight means an
   opportunity/action was recorded, not that targeted mage actually evaded.
   A controller should evaluate the warned target's remaining safe movement
   rather than count unrelated hero action as successful avoidance.
5. Two departure-low hounds remain awake:false even when damaged throughR22.
   Authored activation allows only departure-ramp; heroes occupy connected
   return-deck. This support mismatch deserves a narrow local contract test.

## Registered next corrective prototype

No additional blind whole-stage run. First inspect focused physical fixtures
and actual warning/response ordering. Keep historical source and outcomes.
- Planner: confirm every piercing/rush candidate through a detached legal
  projectile rollout and reject friendly damage. No live-state mutation.
- Roles: knight+occultist clear dock-left rear while mage+archer keep separate
  stair firing positions; do not drop a ranged hero solely to chase nearest x.
  Rejoin before lower boss. Watch targeted actor's warning and safe retreat.
- Local author: add the actual adjacent return-deck as a valid lower encounter
  activation support, preserving radius,42actors,1major/2mid,stats and terrain.
  Verify this doesn't wake the lower encounter from upper routes.
- Only after focused fixtures identify reachable, useful positions register
  one explicit changed-cause comparison. Full return and settlement, save/load,
  viewport/readability and subjective strategy/fun remain required afterward.

## Focused role prototype A, rejected before any full run

Empty-lane movement fixture reaches rear knight x1219/dock for1603 of3501move,
occultist x1520/dock for1300 of2830, archer x2139/stair for595 of2836,
mage x2389/stair for298 of2728. These explicitly placed fixtures do not prove
combat arrival. Firing fixture found a safe archer cross-level shot but no safe
mage shot across tested legal skills/seeds. Mage's upper-stair role is rejected,
not counted as strategic variety. Preserve `_local/reports/stage40-design/role-fire-lanes.log`.
Next focused change only moves mage's proposed firing role to right dock; no
new whole-stage trial until geometry checks succeed.

## Focused role prototype B

Mage moves to right dock x2050 rather than the rejected upper stair. Separate
empty-lane reachability and legal full-projectile firing fixtures pass for
archer high lane and mage dock lane. These fixtures preserve existing terrain,
42enemy stats/counts and all resident paths; they are not stage play approval.
Warning decision fixture reacts only to already observed current markers,
uses body-clear supported movement within remaining budget and rejects unknown,
blocked or unreachable escape positions. It doesn't infer future attacks.

Next bounded combined comparison uses these independently checked corrections:
full-cast friendly-fire screening, reachable role separation, observed-warning
target priority/escape, connected lower-deck activation. Stop at combat terminal,
R24,450000frames or1200seconds. No repetition without a changed demonstrated cause.
Success at this step means only diagnostic combat clearance within20; safe
return, settlement and actual browser/fun remain separate required checks.

## roles-01, native f0406082 / canonical f18ac467

Frozen terminal R25,41/42 removed, major boss645HP remaining, mage casualty,
3surviving heroes and4living residents. It fails20R independently of hero loss;
hero casualty alone is not a new survival requirement.84loop turns/81logged
complete rows,14defends,15S06 casts,40unsafe full-cast candidates rejected.
The local result, turns, damage/resource traces and final profile are retained
under `_local/reports/stage40-roles-01`. Stationary safe firing on the dock was
not established: rear chase and front pressure overlap, and late survivors
crowd the departure-stair firing lane. This motivates the narrowly approved
two-archer placement and demonstrated lower-deck route, not a HP/count nerf.

## deck-01, native b631d1b1 / canonical 6d3f9319

Frozen R25 failure, 41/42 removed, all42 engaged, boss removedR17. One awake
9HP enemy remained on upper coast at x3554/y2400. Four residents and two heroes
survived. No full return or20R completion. Runtime670.9seconds. The exact
protocol/entry/actions/turns/analysis/final saved profile are compressed in
`records/deck-01-failed.json.xz`; decompress to one JSON evidence bundle.

The occultist's observed-tide retreat atR12 reached the dry departure stair
without HP loss. By contrast, archer/mage were still ordered to drop from dock
during visible high tideR13 andR14, causing two457HP/two495HP water recoveries.
AfterR17, ranged roles incorrectly held deck anchors with only an upper enemy
remaining. Knight's broad nearest-target fallback steered downhill toward it,
causing water recoveriesR18/20/22 and eventual death. These are demonstrated
controller defects, not evidence that ordinary combat pressure is unavoidable.
Do not delete enemies, nerf stats or mark the posed route tests as a full pass.
