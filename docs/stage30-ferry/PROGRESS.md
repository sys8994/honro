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

Browser availability was checked once using the cloud's installed Chromium. It exited before page creation with `socket() failed: Operation not permitted` in `process_singleton_posix.cc`. The single launch used the installed Playwright default arguments (its log includes the framework's default `--no-sandbox`). No additional launch flags, system security/permission changes, bypass retry or user-PC access was attempted. Actual browser keyboard/touch/UI/Pages and browser frame-rate validation remain unverified; Native canvas and Node App checks cannot stand in for them.

## Checkpoint 04: reproducible conservative rank-one fullplay baseline

The representative build uses four real equipped slots, all skills/prerequisites/passives rank1 and16 ordinary-stat points. Earned43: archer21 spent/22 unused, mage23/20, knight21/22, occultist24/19; each has two rank-one passives. This is distinct from the earlier skill-rank7–8 high-investment sensitivity and the40-stat movement-specialized basic-only sensitivity. `npm run test:stage30-ferry:fullplay` explicitly selects the conservative build and barge exit.

Fresh App/Engine normal-input runs on checkpoint02 production: low26/6, low20/4 and C-approach26/6 all won at R10, hold completeR7→gatherR10, four survivors, finite10, two actual export/load/Continue checkpoints, one actual boat transition and Act4 unavailable. Hero damage631/673/926; enemies remaining31/26/31. An independent reviewer replayed the candidate low run and its entire trace matched exactly. A separate real warning-save Continue branch fired rank-one M11 twice for830 total HP with real two-bounce contacts and also won atR10.

This is an honest **low-pressure baseline**, not final encounter approval. All three runs use the lower barge exit, including the C approach. E had zero enemy shots; reinforcement hold-contest contacts were zero. Candidate low reinforcement activity was6 actions/1shot/39heroHP; C was6/1/22. West follow-up2 had no action; D-east guard3 mostly defended behind a blocked line. The parent requested a narrow follow-up to entry location, warning timing and relevant activation/order so one finite defense group and one finite withdrawal group affect actual movement choices; total26/6+10, action3 and original goals stay unchanged. A genuinely upper E escape also needs its own normal-input run.

Test doubles cover DOM, rendering/storage transport and pause clock. No live combat position, resource, HP, objective or phase injection is used. Prior-clear reward ledger through29 is an entry fixture, not29 played chapters. Browser input/performance remains separately blocked and unverified.

## Checkpoint 05: actual skill contacts and Native render baseline

Six supported-pose tactical fixtures pass with rank1 four-slot skills and16 ordinary-stat points, unchanged initial26 enemies. M04 damages four clustered opponents; M11 really reflects from the quay stone and hits the east guard, while same-angle M01 stops at stone with partial splash and another free M01 aim directly hits; O04 records multiple samples inside that solid before hitting, while ordinary O01 is blocked and a free O01 shot from the stone top hits; S01 moves and strikes while an ordinary walk plus S00 also reaches; C's eastern shoulder fires a free A01 shot to the E frontline; identical low A01 aim is stopped by the bank before settling and hits the F hound after settling. Every claim uses actual Engine.fire/tick HP/contact/resource evidence. Hero supported starting poses and static before/after boat states are explicit fixtures, not arrival or normal-event claims.

Native production Scene QA covers3 boat states ×3 desktop/portrait/landscape viewports ×5 framing sites (45 samples,27 saved PNGs). Warm cache rebuilds0, resize/cache-versus-direct-vector branches, sceneVersion invalidation and battle-state purity all pass. On the final sequential run, ordinary close-up median/p95 render-call times span3.75–7.77/4.68–9.44ms desktop,1.37–3.29/1.85–5.54ms portrait,1.56–3.81/2.01–7.02ms landscape. The entire-world inspection zoom is more expensive and variable: maximum23.52/64.85ms, cold149.83ms. These are Native render-call timings, not game FPS, browser HUD cost or a human-device performance guarantee. Production baseline71a3f527 and test hashes are pinned in each report. The forthcoming gameplay pressure change needs a newly identified run, not relabeling this evidence.

## Checkpoint 06: finite defense/withdrawal pressure and true upper-route choice

No initial roster, terrain, goal, HP/XP, movement or global AI changes. The existing guard3 enters the western quay loft after map completion and actual quay-region approach, the original hound3 enters nearer the western steps, and the existing withdrawal archer2 enters the eastern landing planks. All warnings and same-side alternatives describe those actual entrances. Waves require the next safe actor boundary after their warning, not a separately completed player action; the boat's real `playerOpportunity` remains a distinct stronger condition.

Only new saved `honroFerrySpec.pressureVersion===2` filters E's existing combat-candidate list when no actual ordinary companion is on its connected high supports within1800 and no existing hit aggro is valid. Low jumps/summons/NPCs do not falsely activate E. The original candidates' order, lastAct, queue cap3, target selection, shot/movement planner, stats and loaded queue are preserved. Old specs and other stages keep their original eligibility.

The main acceptance evidence is now the choice of threats on the two real exits:

| Conservative rank1/stat16 | Low26/6 | High26/6 (strict C support) | Low20/4 |
|---|---:|---:|---:|
| Final round / hold round |11 /8|11 /8|10 /7|
| Post-hold gathering rounds |3|3|3|
| Survivors / defeated / remaining |4 /7 /29|4 /7 /29|4 /5 /25|
| Hero HP damage |854|797|808|
| Enemy completed actions / shots |30 /18|30 /15|27 /17|

Low26 defense guard2 physically drops from the loft to the quay, fires twice for159HP and enters the real hold-contest radius; the retreat archer2 fires twice for70HP. High26 instead passes the actual C launch support and E bank: E3 actions/2shots/71HP, F old guards3 actions/1shot/71HP, low retreat archers0actions. Low26 leaves E at0actions but takes F old guards4shots/129HP plus the new70HP. Low20 also sees defense113HP/2contesters and withdrawal70HP; E's late35HP occurs only on the final eastern ascent and is not claimed absent from every lower route. The unneeded west2 and hound3 have little/no damage contribution; the report does not credit all ten as attackers.

Four strict high launches start x5406.94–5407.99 on the actual `sf-granite-cape`, within8 ofx5400, with no extra westward loop or navigation failure. A prior contact-seam high run is preserved as exploratory816HP evidence, not the strict797HP result. All current runs keep10 finite births, real settlement1, export/load/Continue2, no consumables, four paid rank1 slots with unused points, and Act4 unavailable. High-route live M11 reflection and O04 rock phase use actual costs and contacts.

New safety: all initial30 actors retain complete fields in9 actual-geometry ingress cases (3groups × clear/primary-occupied/both-occupied); exact whole-wave spacing/support, same-side fallback, partial births0, repeated births0. Original factory comparison covers8 synthetic/real paths without stat/XP deletion. Runtime27 groups, App16 paths, Stage18 runtime8 and38 exact-history mutation rejections pass. Old after/before and original18 golden contracts are not overwritten; the separate current ferry review snapshot identifies this authorized delta.

Build and typecheck, game unit suite, migration, current48 routes, art/schema, exact history, existing Act3 maps/locations and Stage18 history/contracts pass. Browser-dependent aggregate verify remains blocked, not passed. The final fixed-SHA independent normal replay/basic-only check and freshly pinned Native rendering remain separately tracked.

## Checkpoint 07: final-ready evidence, no production changes

Final production is7db7a8e, remotely preserved as020db5f707c878c182e38fc74c81d89e3f88d854 with the exact same03a4b395 tree. The independent reviewer reports no remaining defect in the checked Native/App scope. Independent low26 reproduces the entire trace byte-for-byte; final-source high26 and20/4 replays also match their prior strict traces exactly. Independent stat16/rank1 basic-attacks-only winsR11/4survivors/31remaining/456damage/three post-hold rounds, firing only A01/M01/O01 and actual8MP S00. The selected skills remain learned/equipped but unused; no claim is made about removing all passives.

Final `npm run test:stage30-ferry` exits0. Fresh pinned7db7a8e Native45conditions/27images pass with451 production files' pre/post digest identical; all warm caches stable, resize/invalidation/state purity pass. Inspection overview is still costlier than ordinary closeups. No browser FPS or UI approval is inferred.

The recovery evidence archive includes fixed-source normal/high/control/basic traces, actual Continue saves, reward/build/allocation records, tactical contacts, ingress/old-save contracts, independent reports, current Native images/timing, build/type/regression logs and the Chromium blocker. Its per-file SHA256 manifest records116 source evidence files. Remote code/history bundle and this test evidence are separate recoverable artifacts.

**Final-ready for the parent's already-authorized master/Pages publication.** Parent/publisher own master integration, deployment and public exact-file verification. Chromium's socket EPERM and the shared cloud browser's inconclusive state remain explicit unverified browser limits. Publishing and later public input verification are separate completion states; no direct remote push was performed from this worktree.
