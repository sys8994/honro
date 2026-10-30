# Quantitative pilot input experiments

This is bounded policy-model evidence, not balance approval, human play time, GUI evidence or continuous campaign proof.

## Pilot controller preparation (31/34/39; calibration, not acceptance)

`act4-adapter.mjs` reuses the actual NativeCanvas production Scene setup from
`tools/density-qa/linked-app.mjs`, but explicitly prepares **independent** chapter
entry profiles. It does not claim linked campaign play or carried resources.
The unchanged production `App.frame` performs every simulated frame and every
Scene paint; no render receipt, actor position, HP, enemy list or completion flag
is injected. DOM/audio/scheduling remain doubles, and native painting is not GUI
visual approval. Production story success is required, including31 boarding and
39 actual rescue proof. The normal Escape skip for31's arrival tour is logged.

The preset uses `plan(stage).entryLevel`, prerequisite clear-marker fixtures,
normal difficulty, six legal stat investments and three `train` attempts per
chosen skill. Basic skills can reject training; pre-existing ranks can remain.
Every accepted/rejected attempt, final ranks, earned/spent/remaining SP, owned
items and actual equipped items are recorded. Production equipment migration may
populate prior-clear reward ownership; default personal starter equipment stays
equipped. This is disclosed preparation, **not earned previous-stage history**.

All five policies use actual App movement, jump/drop, selection, aiming and
charge/release. `ranged-hold` holds a long engagement distance, rather than refusing
objective travel forever. `high-route` considers nearby higher forward supports;
`gimmick` prioritizes39 anchor/net/rescue exit; `companions` reverses non-archer
skill preference and brings knight closer.39's optional wreck is not a required
kill target. Ongoing production work interactions wait without firing. Ordinary
Engine.predict trajectory points (25 fixed angle/power candidates) may guide aim;
no future combat cloning, damage optimization, bestShot, solver tape or direct
fire call is used. The policy is not yet demonstrated competent at complete routes.

Logs are `.jsonl.gz`: changed input states, commands, combat/round events and
120-frame snapshots, with distance integration retained every App frame. Entry
records deliberately omit the enormous serialized terrain/art battle graph and
include canonical source identity instead. `.attempt.json` is written before
setup and finalized only after a summary: a started-but-unfinalized attempt is an
external termination/error, never a silent exclusion or clear. SIGKILL can leave
incomplete gzip bytes; retain them. Hurt ownership is argument3 (damage is
argument2). Enemy first-damage/death rounds and resident snapshots are retained;
first effective damage is an engagement proxy, **not** proof of every required
encounter, miniboss pattern, simultaneous demand or warning response.

Jump/drop transitions link accepted App input to that actor's landing. Candidate
contribution requires a different non-null support, at least actor-height vertical
change, progress toward that input's observed goal and a previously uncounted
actor/support pair. These are conservative **proxies**, not authored layer or
required-route approval; all raw landing records remain for review. Per-frame
party distance excludes residents/summons, but is not automatically a certified
physical/warp-separated vertical-route statistic. That evaluator remains blocked.

`round-limit` is a retained failure when production round exceeds20; this is a
measurement stop, not a new gameplay game-over. Production `newRound` increments
after the enemy cycle; the initial round is1. Clear-round statistics retain the
production round convention, including a partly completed final round. Human
minutes and GUI/art approval are not inferred from native virtual/wall seconds.

### Frozen holdout contract

Before evaluating a candidate, register seeds, policies, budgets and controller:

```
node tools/quantitative-playtest/freeze.mjs _local/reports/pilot-freeze.json 1001,1002,1003 60000 1800
HONRO_HOLDOUT_MANIFEST=_local/reports/pilot-freeze.json node tools/quantitative-playtest/run.mjs 31 advance 1001 _local/reports/pilot-holdout 60000 1800
```

The create-only manifest hashes policy, uncertainty, preset, adapter, telemetry and
harness files. Runs reject changed hashes or unregistered seeds/budgets. These
example budgets are **not an authorization for a batch**. Do not tune the policy,
error distribution or initial profile after seeing candidate/holdout performance.
A controller defect requires an explicitly versioned replacement and independent
reevaluation, not selecting favorable reruns. Repeated seed values are not new
independent trials; retain failed/setup/timeout/round-limit attempts. Baseline
mechanics calibration is distinct from holdout and cannot supply a clear-rate gate.

V3 essential targets remain unchanged:31 rounds15–18 / engagements30–36 /
jumps22–32 / drops12–18 / clear65–75%;34 rounds17–20 / engagements22–28 /
jumps40–56 / drops18–28 / clear60–70%;39 rounds18–20 / engagements18–26 /
jumps26–36 / drops14–20 / rescue clear60–70%. All have hard20R cap; miniboss
mandatory kills are31:1,34:0,39:0 (appearance/pattern exposure is separate).
The v3 essential/reference classification takes precedence: raw map size, platform
count, enemy budget and human minutes are reference diagnostics, not automatic
rejection gates. Required objectives, effective space use, encounter pressure and
actual image review cannot be downgraded to references. This tool still reports
acceptance **blocked** until an independent reviewed evaluator and sufficient
frozen trials exist. Numeric passes never guarantee fun.

### Bounded preparation evidence

On the original31 map, one actual NativeCanvas/App.frame advance seed1 sample
completed180 frames: round1, horizontal party distance375.83, one charge/release,
frame-budget timeout. It was not a clear. A prior setup/entry serialization attempt
and two later native setup attempts ended externally with exit137; no cause or
successful gameplay is inferred. Incomplete gzip and termination/attempt metadata
are retained under `_local/reports/`. Five-policy and34/39 live calibration remain
**incomplete** until the resource blocker is resolved. Pure policy/stat/freeze
guards pass; runtime/game/asset source was not modified.

### Native resource investigation

The initial linked adapter assembled the entire source registry three times
(model harness, base-name list, renderer list). The pilot now assembles it once,
then registers the selected canonical chapter and recursively referenced asset
closure in the VM, with the same all-chapter metadata catalog convention as the
web lazy loader. Common production character/VFX render modules remain intact.
Canonical stage SHA and each loaded library asset SHA are emitted; missing asset
references fail closed. The full source authoring registry is still assembled
once, so this does not claim zero transient work on other chapters.

The closure path reproduced31's180-frame movement exactly, and34/39 independent
180-frame entries completed normally.31 ranged-hold600frames also completed.
A31 advance600-frame run still terminated externally after480 preserved frames:
RSS grew1.11→1.89→2.89→3.84→4.79GB at0/120/240/360/480, while JS heap was
569/416/376/387/429MB. This distinguishes native rendering accumulation from a
simple JavaScript heap/setup problem.120-frame gzip sync flushes now retain the
last complete telemetry batch even after an external kill. Setup and frame
memory samples are diagnostics, never performance or gameplay acceptance.

The pilot now reads the actual NativeCanvas framebuffer after **every** App.frame
(`canvas.data()`, then discards the pixel buffer), forcing the completed raster
instead of leaving native draw/snapshot work unconsumed. It does not skip frames,
substitute artwork or write visibility receipts. A31 advance seed11 180-frame
comparison completed with180 real readbacks of5,184,000bytes; movement and enemy
engagement matched the prior sample. RSS0→120 was879.9→1019.2MB (+139.3MB), versus
1111.1→1892.6MB (+781.6MB) without readback. This is a large improvement, **not**
proof of a long-run plateau. Longer runs and the remaining three policy baselines
are still pending. Source manifest/world SHA and selected Act4 asset identity are
checked before gameplay; final process memory is also retained for future samples.

Enemy activity accounting separates planning participation from executed evidence.
Repeated `enemyAction()` calls are incremental AI planning/retries, not attacks.
They no longer inflate `maxActingEnemiesPerRound` or produce a full event per retry.
The actual-evidence union contains accepted `fire`, observed movement while an AI
movement command is active, and HP/shield support changes across that actor's
planning-to-finish interval. Its per-round actor/kind ledger is retained. Support
change is explicitly observational, and this union is still not a complete proof
of simultaneous engagement or response windows. Pure regression covers100 no-op
planning calls, rejected/duplicate activity, and actual fire/movement/support.

Calibration controller v2 fixes a static input/weapon mismatch discovered before
holdout: advance/high-route/gimmick previously selected knight's basic melee S00
while stopping at the generic800-unit caster distance. Skill selection now precedes
movement; melee approaches using the production skill radius, and ranged-hold
knight prioritizes owned/affordable S06 before falling back. Selection checks
production `canAfford` as well as legality/cooldown. No candidate outcome was used
to tune this fix. Previous source hashes remain separate, and these v2 changes
are syntax/unit-verified but not yet live-calibrated. Native readback's small
moving-layer pixel-equivalence regression also passes (not game visual approval).

Aggregate all persisted attempts in an experiment directory, including externally
terminated runs, rather than listing only completed summaries:

```
node tools/quantitative-playtest/summarize.mjs _local/reports/all-attempts.json --attempts _local/reports/experiment
```

Explicit `.jsonl.gz` / `.attempt.json` lists are also accepted. Truncated gzip with
an intact run-start becomes an error, not a clear; a log killed before its first
flush must use its persisted attempt record. Duplicate run IDs fail. Preregistered
but never-started runs still require experiment reconciliation; this aggregation
alone does not certify cohort completeness or statistical acceptance. The reader
is included in the controller/evaluator freeze hash.

#### 600-frame readback check (2026-10-30)

On the unchanged original31 map, calibration v2 advance seed11 completed600 App
frames with600 actual framebuffer readbacks. RSS at0/120/240/360/480/600 frames
was1007.0/945.2/948.8/944.7/944.9/945.1MB: the latter480 frames stayed near945MB,
past the prior480-frame4.79GB external-kill point. Wall time42.96s. This establishes
bounded native stability for this sample, not arbitrary full-run stability.

Outcome remained **timeout / frame budget, round1**, not clear. Actual accepted
shots were archer A01, mage M01 and knight S00; occultist charge had begun but not
released at the stop. Party horizontal movement1446.89, focus spent7, one enemy
received effective damage, jumps/drops0. Gzip was7895bytes. The all-attempt reader
reports timeout1, clear0, acceptance blocked. No statistical difficulty conclusion
is drawn from this mechanics sample.

Run ID: `887c139d-4cb7-424a-8401-e3e0e8681f08`; source hash:
`3081d112c9af83c9a2f8e2a382fae06d1a39f464d151810e7d412f98f567eb5b`.
Evidence: `_local/reports/native-readback-600/`. Remaining high-route/gimmick/
companions live baselines, effective jump/drop demonstration and end-to-end
31/34/39 completion are explicitly pending. No holdout manifest is frozen yet.

The freeze also covers entry-preset dependencies: production balance/entry-level
configuration, profile/progression/equipment/App preparation sources and all core
TypeScript sources. Changing the initial growth/skill/equipment rules cannot keep
the old controller hash merely because the adapter's code stayed unchanged.
This is deliberately conservative: a core change requires an explicitly new
freeze/version and independent reevaluation. Geometry/library-only candidate
changes remain identifiable through each run's full source hash.

#### Remaining policy branch calibration (2026-10-30)

One600-frame original31 sample per remaining policy, seed11, completed with real
Scene rendering/readback and the same source hash
`84d286e8319aaf5358b9dcbeb2c3150035e58898a66ebb526df5b3a5e90da7e7`:

| Policy | Accepted shots | Party horizontal distance | Final RSS | Outcome |
|---|---|---:|---:|---|
| high-route | A01, M01, S00 | 1446.89 | 990.5MB | timeout, round1 |
| gimmick | A01, M01, S00 | 1446.89 | 920.5MB | timeout, round1 |
| companions | A01, M03 | 1305.55 | 966.0MB | timeout, round1 |

All had jump/drop counts0. The initial section did not exercise high-route's
higher-support choice or a goal interaction; those two traces matched advance.
Companions demonstrably selected/fired mage M03 (focus spent27), but its later
knight charge was not a completed S04 action at the stop. No completed behavior
is inferred from merely selecting or starting a skill.

`_local/reports/v2-remaining-three/all-attempts.summary.json` includes all3 attempts:
timeout3, clear0, gate blocked. The earlier ranged-hold/advance mechanics samples
used different source revisions and must not be pooled into a frozen statistical
cohort. Each of the five policies has now executed an initial production-input
sample, **not** a competent full-route/clear demonstration.34/39 have independent
entry/movement sanity only. Full encounters, miniboss patterns, effective normal
jump/drop, all-party objectives,20R compliance and clear-rate targets remain
unverified. No candidate geometry was used and no holdout was frozen or tuned.

### Observation-based objective adapter (calibration v3)

After inspecting integrated production `act4-events.js` boarding configuration,
31's controller no longer contains6450/1860 destination constants. It reads the
current `honroAct4Design.boarding` geometry or actual generated `a4-boat-deck`,
intersects the safe interior with authored boarding bounds, and assigns each live
party member a distinct interior destination. Unknown/invalid geometry is a
controller error, never an invented destination. Production interaction probes,
all-party grounded boarding, quiet conditions and q.complete remain unchanged.
No teleport, route tape or enemy deletion is introduced.

Combat target selection now requires intersection with the current production
Scene viewport and the production spirit-visibility predicate; captured, hidden,
objective-only and optional39 wreck actors are excluded. Offscreen/hidden enemy
coordinates cannot select a target. Authored visible-objective destinations remain
usable even when not in the current camera rectangle. This is still a model of
observations, not human visual perception or terrain-occlusion certification.

Pure tests cover moved dock elevation, observed-deck priority, distinct party
slots, missing geometry, offscreen/hidden target exclusion and missing viewport.
No heavy candidate run has yet exercised v3; the v2 calibration results above are
not relabeled as v3 evidence. Full-round candidate execution awaits integrated
art/roster readiness and the shared engine slot.

### P01: official manifest omission invalidates calibration (v4)
Cause: the v3 adapter's app:false registry plus a manual post-App module list
omitted `act4-pilot-combat`. Candidate31 run
`0ea94672-0d93-49ee-a061-f45dd7b7d6a6` was stopped at observed frame12240,
exit130. Its original gzip and attempt remain in
`_local/reports/candidate31-full-calibration/`; the attempt records explicit
adapter-omission invalidation and remains an error denominator. Its legacy enemy
HP/damage/activity are NOT evidence about the authored pilot roster tuning.
Do not retry a manually assembled module list or retune HP from this run.
Alternative: one app:true official registry, selected-stage asset closure,
model/renderer/App/post-App evaluation in exact official order, every entry once,
per-entry SHA256, required pilot API/fresh-budget/activation assertions before
replay. Only main's automatic App creation is replaced by the documented harness
hook; DOM/audio/HUD presentation doubles remain explicit, actual Scene retained.
`tests/quantitative-playtest-manifest.mjs` covers missing/duplicate/unconsumed
modules and future appended modules. Existing seven focused units pass. Native
setup and full-manifest regression are verified by the follow-up below; v4 is
not gameplay or holdout acceptance.

### P04: grounded free-drop acceptance
Cause: the previous observer looked for moveLeft reduction or immediate airborne
state, but production drop is free and enters a grounded `platformDrop.prepare`
first. Do not reuse that predicate. The observer now requires a new prepare state
with actual contacts/originY and records the real `Engine.drop` boolean return
through a passive wrapper. `quantitative-playtest-activity.mjs` covers accepted,
repeated, rejected, falling, and contactless transitions. This unit checks the
observer, not an end-to-end candidate drop route; effective landing still requires
actual changed support/progress and is measured during real subsequent frames.

P01 native follow-up: complete module loading exposed missing DOM presentation
capabilities (`MutationObserver`, matchMedia change listeners). Do not remove
those production modules to hide setup errors. The harness now supplies those
explicit DOM doubles; native Scene is unchanged. One wrong-cwd patch command
accidentally retried the unchanged failure; this extra attempt is also retained.
All four probe attempts are under `_local/reports/v4-manifest-probe/`: three
frame0 setup errors and one frame1 timeout, never four clears. Final run
`1f2002fb-f0a0-4a38-a437-7a25f205bea3`, source
`468c395ab1aa919a9a9a731590a4fac8ee64978416b2d433c95edff6a1b56698`,
passed complete-manifest and live pilot sentinels, found34 enemies/0 awake and
consumed one actual5184000-byte readback. RSS after launch915MB/final945MB.
This is setup regression evidence, not long-run memory or gameplay acceptance.

Damage interpretation follow-up: old logs retained raw hurt before/after but did
not retain direct/skill-rank/source/guard context or exact critical feedback.
Do not infer per-cast totals or criticals from those old records. New logs retain
initial hero attack/armor/ranks/equipment, passive hurt provenance and production
`fx` damage-feedback with attackId/targetId/critical. The observer does not roll
RNG, invoke damage, or synthesize critical classifications. The activity unit
checks provenance snapshots and absence of inferred criticals. End-to-end hit
logging will be checked on the next authorized calibration; this change does not
retroactively fill missing old data.


### Controller competence boundary before full-round v4 calibration
v4 does NOT implement general multi-layer pathfinding. It steers toward the
current observed enemy/objective x, jumps after12 near-stationary decisions or
nearby upward goals, and only attempts drop near a downward goal. High-route is
a nearest forward upper-platform heuristic, not a connectivity/clearance graph.
It may fail on an easy but indirect route, or end a turn after airborne charge
rejection. These are controller limitations, not evidence to simplify geometry
or label the candidate too difficult. Full-round snapshots now preserve active
support, grounded/input/action state, move budget, jump cost, drop state and
distance to the selected current goal so these cases can be separated.
Before holdout, a new version should choose routes from public terrain/supports
and current actor physics, with generic support connectivity/clearance checks;
no per-stage victory coordinate tape, hidden enemies or future combat oracle.
Do not copy authored geometry probe success trajectories into the controller.

`preflight.mjs` exports actual App-created body/profile identity without advancing
battle or changing pose/HP. Verified stage31 output:
`_local/reports/actual-app-cohort-preflight.json` (38 bodies, actual normal campaign,
HP1085/1174/2036/1362). Missing requested body fields remain absent; do not invent
an existenceDefense value where production uses derived existence logic. This
artifact is for calibration identity comparison, not a gameplay result.

P01/P06 sentinel update: a loaded v2 reference now requires fresh actor v2 basis,
matching fixed referenceId, positive role/normalHp and all per-skill coefficients.
A stale v1 saved body cannot pass merely because the v2 module API exists. The
manifest unit covers stale version, mismatched reference and live coefficient
mismatch. Actual v2 App setup will be checked with the selected canonical source;
this unit alone is not a damage-matrix or gameplay result.

### P07: no pathfinding can masquerade as difficulty (v5)
Cause: v4's x-only steering/stuck-jump heuristic has no multi-support connectivity,
so a valid indirect route may be reported as difficult gameplay. Do not repeat a
long v4 run or simplify candidate geometry to accommodate it. v4 long replay is
cancelled before starting; its old failures remain unchanged.
Alternative: derive generic support samples from public terrain polygons, check
walk/jump/drop/walk-off edges with actual Engine locomotion, and choose a route
to the currently observed objective/enemy. A separate physics-only host contains
only public terrain/physics and a whitelisted copy of the current actor's body
and movement traits. It has no enemies, projectiles, battle clone, RNG, damage
forecast, authored stage route or stored successful trajectory. Combat/world
methods throw if called. Live App uses stick/jump/drop/defend inputs only.
The planner checks collision clearance and conservatively rejects falls over550
units from apex. It plans normal maxMove legs, but live execution ends the turn
when a leg exceeds remaining move budget; it never refills that budget. A future
objective lacking a physical support permits an explicitly marked approach-only
route, never a reachability/clear claim. Synthetic impossible goals fail closed.
Regression: `tests/quantitative-playtest-navigation.mjs` checks climb, one-way
drop, gap crossing, opposite-direction detour then three rises, and impossible
height; input world/actor are unchanged. A reactive follower drives actual
locomotion continuously without pose/HP/move-budget reset. Initial follower
oscillation spent extra movement and failed the detour; preserved at
`_local/reports/navigation-v5/first-follower-failure.json`. Fractional ordinary
stick near endpoints fixes the discrepancy without changing movement physics.
Actual31 App input sanity is verified by the follow-up below; this is not full-play acceptance.
Aim25-candidate preview, ±6-degree/±.07 power errors and prepared cohort stay fixed.

P07 actual31 input sanity verified (NOT full-play acceptance): v5 source commit
17b59f0b2 has identical shared/game runtime/config/vendor to root8e2cea7c2.
Run `6941d498-b92c-4e07-9d94-391c8b1f4589`, source hash
`42992ec9f56cc846be83b96a56de7cb5a4c79f808b68930fc57803d2e3ea9a37`,
advance/seed11/600frames/180wall: intentional frame-budget timeout at R1.
Actual App knight jump shore→west-step was accepted and landed on changed support
with objective progress (effective jump proxy1); horizontal integral330.674242.
A01/M01/S00 fired, first enemy died, hero HP loss0. Drop was not exercised here.
The new passive hit provenance and production critical feedback were emitted.
Readbacks600 ×5184000bytes; RSS frames240/360/480/600 approximately716/719/732/734MB.
Artifacts: `_local/reports/v5-candidate31-input-sanity/` (gzip+attempt+summary).
Only the synthetic fixtures establish generic drop/detour/rejection behavior;
this actual run establishes a short real movement/jump/combat path, not all31,
20R,34/39,clearRate,fun,art or deployed-browser acceptance. Controller/preset/error
distribution stayed unchanged during the run; future source changes require a
new controller hash and independently retained calibration/holdout records.

### Isolated GUI prepared-entry export (generation deferred to final integration)
After final geometry/art integration, run once:

```sh
node tools/quantitative-playtest/preflight.mjs 31 \
  _local/reports/final31-app-cohort.json \
  --export-profile _local/reports/SYNTHETIC-prepared-stage31-entry.json
```

The adapter invokes actual `App.export()` / `App.downloadProfile()` and captures
the normal application/json Blob. It does not construct an alternative save
format. Guards require normal/debug-off/training-off/custom-off, R1 and zero
shots. The separate `.receipt.json` records exact profile SHA/source/preset and
states that stages1–30 were NOT played: prior-clear prerequisite markers and
normal-growth allocations are a declared synthetic review fixture. Do not add
provenance fields to the actual imported game profile.
Use only the existing “기록·관리 → JSON 기록 가져오기” UI in an isolated localhost
preview; never overwrite public/user records. The export fixture owns only an
in-memory localStorage map. Root performs the actual mouse/keyboard GUI review.
Option syntax and adapter source checks pass; final export/import is intentionally
not executed yet, to avoid regenerating a stale pre-art candidate.

### P08: boarding coordinates before the public kill-all objective is satisfied
Cause: v5 resolved31 to the dock from the start. On a layered map it could take
the lower shortcut and never discover upper threats. Do not run a long v5 cohort
with that known objective mismatch, or read hidden enemy coordinates to fix it.
The production HUD already publishes “주변 위협을 제압하세요 · 남은 적 N명”
(`HonroAct4Content.objectiveState`); its target-coordinate lists are empty.
v6 consumes only that public instruction/count. With no currently visible foe
and positive published count, it selects an unvisited, locomotion-reachable
public support viewpoint instead of the dock. Exploration memory is formed from
actual viewports, nearby visited supports with public-solid line clearance, and
only passed-in visible enemy observations. Continuing an upper branch is favored
over immediate descent, avoiding synthetic up/down oscillation. There is no
stage-specific support order or stored route. Positive count with exhausted
reachable viewpoints is a controller error, never mission completion. Once the
published instruction changes to boarding, ordinary authored dock logic resumes.
Regression: `tests/quantitative-playtest-exploration.mjs` invokes the production
HUD function with hidden x/y getters that throw, and poisons world.units access
inside exploration. In a lower-dock/upper-threat synthetic map, two real jumps
reach x750/y280 before the moving camera first sees the unknown threat. The first
sensor fixture was too vertically permissive; its log is retained separately,
and the stronger fixture requires an elevated viewpoint and at least two jumps.
All pose/HP/movement budgets remain unchanged after synthetic entry. The tests
also cover public count parsing, no premature dock goal and exhausted search.
Actual v6 candidate exploration and full clear remain unverified. v5 input sanity
is retained, not relabeled as v6 proof. Aim/preset/uncertainty are unchanged.

P04 movement provenance follow-up: raw horizontal/ascent/descent integrals remain
unchanged and include every observed hero foot displacement. They are NOT the
criteria's effective physical-distance ratio. A separate conservative audit now
partitions every frame into commanded grounded route progress, pending/qualified
jump/drop episodes, scripted recovery/gate transitions, involuntary/skill motion,
or unclassified movement. Category distances conserve the raw integral. Unknown
movement is not silently credited. Public recovery receipts and gate-turn changes
exclude same-frame script transfers even if transient flags already disappeared.
Normal `walk-off` legs now open an observed fall episode when support is actually
lost; they were missing from the old App.drop-only ledger. Successful descending
support transitions contribute to effectiveDrops. New effectiveJumps additionally
covers checked necessary gap crossings; the old elevatedSupportLandings proxy is
retained separately. Per-actor support-face pairs/progress prevent repeated idle
jumps from earning credit. These remain conservative route-qualified measures,
not a substitute for semantic/manual target review; pending or unclassified
movement must remain visible. No historical run is retroactively reclassified.
`quantitative-playtest-movement-audit.mjs` verifies exact raw-distance conservation,
script/gate/knockback exclusion, episode transfer and genuine walk-off detection.
The hurt observer also retains actual target maxHp and owner side for future
per-attack damage percentages, instead of assuming initial maxHp stayed constant.

### P09: mixed sanity/holdout denominators and missing protocol provenance
Cause: old grouping used only source/stage/policy and terminal rows omitted
purpose/budgets, allowing a short sanity timeout to mix with a full holdout.
Do not relabel a completed sanity as holdout, drop errors, or choose only good
results. Every attempt remains retained. Before adapter/engine setup, the runner
now writes purpose, frame/wall budgets, controller/source hashes and a stable
cohort identity to both the attempt registration and run-start record. The same
identity is copied to terminal records. Set `HONRO_EVALUATION_PURPOSE` before
execution to `input-sanity`, `full-calibration`, `memory-probe`, `setup-probe`, or
`mechanics-calibration` (default). Only a validated preexisting holdout manifest
selects `frozen-holdout`; v2 manifests also bind exact candidate source hash.
Groups are isolated by all recorded protocol fields/cohort ID. Legacy logs may
recover only metadata that actually exists in their run-start, never inferred
purpose. Without a start registration, preserve the attempt as unclassified and
retain its original terminal claim separately. All-attempt, technical-error,
normal policy-failure, unclassified and repeated-seed counts are disclosed.
`clearRateNormal` is diagnostic only; technical errors in a requested holdout
block approval and cannot be removed from its preregistered denominator.
Regressions: stats/log-reader/freeze units cover mixed budgets/purposes/cohorts,
source/controller drift, partial gzip, absent starts, duplicate/repeated seeds
and requested-holdout technical errors. Old attempts are not promoted into new
cohorts. Full design-target evaluation remains explicitly blocked/unimplemented.

### Offline observed combat-action ledger
`analyze-combat.mjs run.jsonl.gz report.json` reads compact events only. It groups
an original attack by owner + globally recorded shot, not by pellet/tick or impact
round: a persistent cast crossing rounds remains one action. It keeps per-target
actual HP/shield loss, current maxHp, direction/guard/rank context and production
critical feedback; nominal overkill is not actual HP loss. Normal/mid/major boss
classification is separate where entry metadata establishes it. Fire time and
impact rounds are retained separately. No solver, engine tick, HP mutation or
combat forecast is involved.
Missing explicit shot provenance, actual allegiance, changing/missing maxHp or
unknown class remain warnings/null metrics, not inferred from initial stats or
legacy scalar budgets. New passive logger fields supply these on future runs.
The old v5 sanity yields2 observed shot groups and1 kill, but cannot retrospectively
prove action-count/HP-percent targets because those fields were absent. Its
original trace/denominator is unchanged. Unit tests cover multi-hit cross-round
casts, exact capped HP loss, critical context and missing-data rejection. Full
criteria/clearRate acceptance is still not implemented or claimed by this ledger.
