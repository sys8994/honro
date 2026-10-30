# Act 4 pilot functional layouts

These are **collider/anchor drafts**, not artwork or release-ready campaign maps.
`build-skeleton.mjs` reads the canonical chunked world source without overwriting it;
only one stage is emitted per draft. Story/objective contracts are retained.
The enemy roster is deliberately empty so the combat owner can place existing slots
at `design.pilotSkeleton.enemyAnchors` without double-counting.

```sh
node tools/act4-source/world-source.mjs materialize
node tools/act4-pilot/build-skeleton.mjs 31
node tools/act4-pilot/probe-skeleton.mjs 31
node tools/act4-pilot/test-boarding-config.mjs
```

Outputs: `_local/reports/act4-pilot/stage31/skeleton/`.
Render its technical SVGs with Inkscape `--export-type=png`; these are collision
masks, not generated game art. Gray is solid, blue is one-way. The real shared
terrain-domain author extends the single geography; no dummy skirt is authored.

## Physics evidence boundaries

`kinematics.json` tests individual support edges with four production bodies. Each
edge begins at a declared valid pose: this is geometric reachability, not play.
`continuous-route.json` starts each body once at the stage entrance, then uses
move/jump/drop/walk-off and real finishAction/tick turn transitions without further
pose, HP or movement-budget writes. This is a movement-only route, not party combat,
App event completion, a GUI recording, or a successful campaign run. Input counts
are not yet the normal-combat effective-movement metric. SHA-256 binds reports to
the exact draft stage; continuous-only reruns reject stale edge evidence.

The engine's ordinary jump uses vy=-660 and **jumping gravity 1000**, not world
projectile gravity 320. Its ideal unskilled apex is 217.8 world units. Stage 31
therefore uses broad walkable climbing contours between conservative jump seams;
no engine or player-size change is permitted to make tall steps pass.

Stage 34 has real-Engine edge and continuous upper-court reachability evidence,
but its direct ascent has no drops; meaningful tactical descent usage and the
final exit approach remain acceptance gaps. Stage 39 has been reauthored for the
real jump envelope and retains original resident/net/safe coordinates; its exact
new geometry is awaiting Engine and four-resident movement checks. Neither is
ready for artwork freeze or release merely from these source files.

World height, authored support extent and measured grounded trajectory are separate.
The blueprint's `geometryNotes` preserves these distinctions; blank sky and the
solid below-ground mass do not count as reached playable height.

## Visual authoring contract

Gray masks are functional solid volumes, **not a prescribed painted silhouette**.
The artist should replace repetitive narrow-waisted appearances with asymmetric
folded coastal rock and arched supports. `visual-constraints.json` separates
protected walking tops, cover colliders and objective seams from that freedom.
Keep actor headroom and verified travel pockets open; don't expose invisible
blocking volumes or paint false usable ledges. The final visual/collision overlay
must be checked at gameplay scale. Technical PNG review is not that art approval.
