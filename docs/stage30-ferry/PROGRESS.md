# Stage 30 ferry redesign — staged production work

Base: remote master `b56bfb4f6e6d35166e05c37cad6dd21a6ccde236` (2026-10-09).

## Checkpoint 01: reproducible geometry, not activated production

This first checkpoint stores the authored coordinates, generator, immutable original Stage 30/balance snapshot, and real-input geometry checks. It deliberately does **not** activate the new map in `campaign.json` or bundle unfinished integration. Run:

```sh
node tools/map-forge/apply-stage30-ferry.mjs --no-art
node tests/stage30-ferry-traversal.mjs
```

The traversal test also constructs the graybox privately when the repository campaign still contains the old Stage 30. Optional art is a later integration (`--art`); the first checkpoint's geometry has no art dependency.

### Preserved contracts

- Original three steps: `transport-map` interaction; `ferry-hold` for three enemy-team ends with the original three-hound wave; `old-road` gathering of every surviving ordinary companion.
- Interaction radius 260 with same-floor enemy contest 220; hold radius 540, contest 230; gathering radius 440. Same-floor foot difference <=150 and distance `hypot(dx,.75dy)`.
- No extermination gate, new NPC, forced 2+2 party split, extra ritual, or public Act 4.
- Four physical hero bodies, height 92/radius22. Default jump `vy=-660`, actual actor gravity1000, nominal rise217.8. Required authored jump rises <=150; normal walk slope <=1.35. No drowning or artificial river walls.
- Candidate initial26/elite6, finite2+3+3+2=10. Population upper bound36 is distinct from the unchanged simultaneous enemy action limit3. Paired controls: originalBudget20e4 and countControl20e6.
- A new battle opts into the ferry revision; old serialized battles remain their own geography and state. Save/event integration is a subsequent checkpoint.

### Geometry result at checkpoint 01

All four classes × twelve declared routes passed using the existing Stage16 ordinary walk/jump/drop helper and current Engine. No mid-route coordinate assignment, recovery teleport, required fall damage, or special traversal skill. Movement pools are replenished and other actors are removed: this is **geometry evidence only**, not combat, completion, browser, or human play-time evidence.

- Terrain SHA256: `4dbd82b90d067a68c3894c9f7b3d2eb33e5b4b2ba1e2d05d6ba02b4e1177f2cb`
- Routes SHA256: `ceeca2e20dfa09f83fc5b970380e44ad568fb1e822cf021454b677184d6e7cf6`
- Defense-center → west return teeth → settled ferry → original gathering radius costs: archer5535, mage5529, knight5534, occultist5874; 2.87–3.14 respective movement pools. This generally means3–4 integer turns from the center, or3 after useful west-side defense positioning.
- Both wet recovery shores return by ordinary movement to their own original route. The channel has no continuous bottom shortcut.
- Removed a disconnected V-shaped draft platform because it had no proved gameplay purpose.

### Explicit open work

1. Independent review found the compressed gathering at `(9300,4850)` lower than C's summit `(4190,4510)`. The parent approved keeping a short exit while raising/sculpting the nearby final high road. This checkpoint records the low-G experiment; it is **not final geography**. Re-run all route/body checks after that revision.
2. Activate final map, Korean river art, narrowly swept safe boat/bank state, finite atomic entries, public cap hook and bundle hooks in a separate coherent checkpoint.
3. Exact new30→old30→old18 history boundary, old saves, Continue/Skip, generator preservation and original contracts.
4. Legal normal-input candidate26e6 versus original20e4 combat, real skill sight lines, movement/wait/tail-enemy records and actual ending.
5. Production UI/browser input, responsive screenshots, performance, final review, remote master and existing Pages deployment.

Remote writes and Library recovery are owned by the designated publisher. This branch has no independent push step. Existing Stage18 workspace remains read-only.

## Checkpoint 02: integrated ferry revision and near, higher gathering

The new battle is now activated with Korean river/stone/boat vector art and a shared Game/Workshop bundle. The nearby final gathering is `(9450,4300)`, datum-height2200, 210 above the granite cape summit. A short folded cut in the eastern rock replaces the earlier low-G experiment rather than moving the goal far away again.

- Final terrain SHA256: `58ec5373f94f176a26181b1f7441e9f68b2a9fd50a7c38c3eaa7d11ef346a99f`.
- All48 ordinary routes pass again. All30 initial bodies keep their authored positions without constructor repair; no overlap;8 seconds at1/120,1/60,1/30 preserves support/HP; all route and jump/drop anchors fit all four bodies.
- D-center→west teeth→barge→final gathering radius: archer6379, mage6370, knight6374, occultist6715 move (3.30–3.59 untrained movement pools). The marker keeps its original same-floor150/radius440 acceptance, including nearby sloped arrivals; it does not require four actors on the exact marker center.
- Candidate26/6 + finite10 uses saved population cap36 and action cap3. Original30 saves without the revision retain their original terrain, actors, goals and cap30/23. The only generic spawn change is calling the existing public cap hook.
- Boat: progress1 warning, a genuinely offered/completed ordinary companion action, progress>=2, and a clear safe boundary. Occupancy covers body/summon/enemy/stake/projectile/field shapes in the actual hull sweep plus the removed bank.0.8-second visual settling ends with a single atomic broken-flag swap in both terrain arrays. No moving-body physics, teleport, actor damage or mandatory wait for victory. The original high exit stays open.
- Old/new App export/import/Continue, dialogue Skip safety, settling interruption, repeated load and victory cancellation pass. The public animation-shortening function is tested separately; a dialogue Skip does not bypass a waiting boat.
- Fifteen new local vector assets preserve all545 older assets and all29 other complete maps. C rear support is irregular granite; D rear piers are masonry; E is a recessed rock shoulder. These clearly rear-painted supports have no collision or false bright walk rims. Boat top is the exact solid polygon; wet recovery shores and the deep water gap remain distinct.
- The new exact30 review boundary verifies all allowed deltas before reversing them into the unchanged Stage18 golden leaf.32 mutation-negative checks, current Stage18 history/contracts and shared Game/Workshop build pass. Regeneration keeps the new map in generic encounter/location/art rebuilds.

### Combat evidence, separated from geometry

The movement-specialized **legal** basic-only entry invested40 ordinary-stat points plus3 paid rank-one slot skills out of43. It is not the representative skill-build balance result. With actual input, enemy AI, resources and original seed, both finite10 and all four survivors reached the real ending: candidate26/6 at round8 with31 enemies alive; original20/4 at round7 with27 alive. Both took two rounds after their third valid defense enemy-end. Continue was exercised twice and Act4 remains unavailable. Prior29-stage XP is an explicit real-reward-ledger entry fixture, not a claim of playing29 chapters.

Existing hold progress is retained across a contested enemy interval; the requirement is three valid defense enemy-ends, not three globally consecutive unbroken rounds. No hold rule was changed. A balanced16-stat/27-skill build, C approach comparison, skill-specific hit/occlusion tests, remaining older-map regressions and actual UI/browser/performance review remain separate work and are not claimed complete here.

## Checkpoint 03: preserve historical Act 3 tests while checking the live ferry

Nine existing test files now validate the exact approved Stage30 boundary before using the immutable original30 for historical location, architecture, ordered-objective and fiend assertions. Existing golden fixtures are not rewritten. Live canonical round-trip, initial-body/recovery, full art regeneration and six current encounter firing probes still run against the current30 map.

Twelve affected checks passed: historical geometry84 routes (including original30 four-class routes and original20/4), current safety62 checks, canonical30 stages, art regeneration30 stages, runtime, fiend contract/scope, location shots36 and encounter shots46. Separate exact-boundary negative controls reject18 project,14 runtime and6 semantic mutations. The current48-route and normal-combat evidence remains separately identified. No production, bundle, actor, geometry or objective changes are included in this checkpoint.

Browser availability was checked once using the cloud's installed Chromium. It exited before page creation with `socket() failed: Operation not permitted` in `process_singleton_posix.cc`. No security flags, permission change, retry or user-PC access was attempted. Actual browser keyboard/touch/UI/Pages and browser frame-rate validation remain unverified; Native canvas and Node App checks cannot stand in for them.
