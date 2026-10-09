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
