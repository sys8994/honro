# Stage38 — 어긋난 해식굴

Official-source portable candidate ready for parent review, not user-approved/deployed. Preserve
all four exact solid terrains, including the emergency ledges; no fatal void or
invented bridge. Keep connection entry/return/destination, zero-MP stage-only
anchoring, residents including 도식 and pursuers, low-water policy and failure
conditions unchanged. Source fingerprints are in source-contract.json.

BODY concepts derive from actual compiled full-world geometry. Floor source is
a common geology sheet to be separately clipped into original west/east/real
emergency-route pieces; ceiling is a separate exact-shape source and asset.
No ceiling/water/NPC/probe is baked into the floor. Root style reference is
Stage31 body-small-concept. Built-in image generation: broad blue-slate planes,
8–10 flat colors, thin grey weathered rim, white exterior, no fine texture,
no props/water/figures. Floor's lowest quarter is requested uniform #273c49;
verify actual trace before domain continuation. Imagegen cannot approve contacts.
Actual Inkscape trace, optimization, in-world art and normal input review pending.

## Official baseline input evidence

Ordinary earned-SP App policy won in16,096frames /5rounds /14shots. All four
heroes and four residents survived. Actual native Scene observed residents,
pursuer movement, entry probe, wrong-return probe, and anchoring. Original mage
E created stage-only zero-MP connection; no pose/resource/HP forcing was used.
Independent replay also won, with exact original stopBattle/persist/Continue at
vista4895, entry5749, wrong-exit6001, anchoring6740 and connected7071. Checkpoints
wait until a skipped reader is reconciled by the original event tick; the
original snapshot intentionally retires an already-skipped reader otherwise.
Dialogue rows were skipped/retired, not falsely counted as presented receipts.
Nonmage knight physically walked the real emergency slope; a separate no-
connection input policy and deliberate original roof-blocked shot are pending.
Evidence is baseline-only until final art integration/replay.

Actual Inkscape10-color Smooth/Stack/rembg traces are preserved as floor/roof
source/raw SVG+PNG with native full viewBoxes, no Simplify. Direct bounded import
succeeds for both (13nodes each), so no approximation was introduced. Floor
rows .80/.85/.90/.95 are uniformly opaque#273a48 across the1886pixel interior;
this establishes the deep-fill continuation color. In-world clipping still
needs independent review; tracing alone is not art approval.

No-connection ordinary policy also won:14,206frames,7rounds,11shots, all four
heroes/residents alive. Independent replay verified an original projectile
impact against a4-38-cavern-roof, original Continue during vista3453 and physical
emergency-route4434, and no probe/connection ever created. A separate synthetic
occupied destination fixture at6860 blocks anchoring completion without moving
the mage or changing HP/MP. This synthetic fixture is not a normal clear claim.

## Final portable candidate

`package/stage.json` + `package/library.json` contain only the scoped Stage38
appearance changes. Original4colliders, all units/NPCs, water/connection rules,
events and mission metadata remain exact. BODY has four original-solid pieces;
SURFACE uses an18-world-unit rim from original contact lines and traced palette.
Overlapping floor bodies have pixel-snapped nonoverlapping appearance ownership
inside the exact original union, removing an AA seam at the emergency/east join.
REAR and live connection/probe/residents remain separate; no FORE spikes were
added across the tight cave/headroom. Three internal symbols save482,101bytes;
all16 actual native plain/symbol PNGs are pixel-identical.

Final-source ordinary connection and physical-alternative replays both passed,
including the five-phase and physical-route Continue checks. Actual original E
traversal at13710 moved archer2975.49→4520 with MP391→391. Physical-only replay
never creates probe/connection, hits the real cavern roof, and contains150
recorded grounded nonmage emergency-route samples. Actual Escape at4895 restores
follow; separate synthetic occupied destination waits without overlap/HP/MP
changes.720×1100 replay also wins with the same five phase checkpoints. All4
residents live in every normal completion. Details/hashes are in package checks.

Direct review covered whole structure; contact/headroom/underpasses; camera,
mobile vista/probe and left/right domains. Screenshots remain in ignored
`_local/reports/stage38-production/contact-rim/` and final replay-shots folders.
Some raw trace midplane patches and symmetric distant reflections remain;
legacy rear shapes are retained. Native snapshot/DOM limitations are explicit.
Parent browser HUD/continuous camera/performance and final release review are
not claimed by this package.

Reproduce:
```
node tools/stage38-production/skeleton.mjs
node tools/stage38-production/assemble.mjs
node tools/stage38-production/inspect.mjs contact-rim art/stage38-vector-production/candidate-project.json
node --expose-gc tools/stage38-production/verify-app-observations.mjs art/stage38-vector-production/candidate-project.json tools/stage38-production/fixtures/normal-earned-inputs.json _local/reports/stage38-production/final-connection-replay.json
S38_PHYSICAL_ONLY=1 node --expose-gc tools/stage38-production/verify-app-observations.mjs art/stage38-vector-production/candidate-project.json tools/stage38-production/fixtures/physical-earned-inputs.json _local/reports/stage38-production/final-physical-replay.json
```
Run native-heavy replays sequentially; a concurrent verification attempt was
killed by container memory pressure, then passed in isolation. This is not a
reproduced deployed browser memory leak.

## Decorative footprint follow-up

Six collision-free rock/haul-footing instances now reuse the actual Inkscape
common coastal boulder (450-unit haul-footing width instead of718), preserving
native instance coordinates/scales and rotating to
existing floor/roof support tangents. Only the obsolete noncolliding scenic
`a4-coast-38-art-2` cavern-wall element is removed; the actual finite ceiling,
all four collision solids, emergency route, two connection crack cues and live
residents/probes are unchanged. Existing distant scenery supplies depth behind
the readable channel. Current Native views: `natural-props/`.

This supersedes the earlier statement that the flat cavern-wall/rocks remain.
Prior App evidence keeps its original source fingerprint, not a fabricated new
replay pass. The assembler verifies exact geometry/gameplay equality; final
browser and integrated release review remain outstanding.

### Shared protected connection fissures

Both functional connection-marker appearances now use scoped `s38v:crack`, the
same actual imagegen→Inkscape common trace used in34/39. Original element/event
IDs, coordinates, rotations, scales, interaction sockets and compiled physics
are unchanged. Source/destination dark splits were directly checked in actual
Scene entry-roof, resident-bank and portrait emergency views in `crack-review/`.
The original entry socket is20units before its ledge edge, so the existing scenic
marker footprint overhang remains; it creates no extra standable surface.
Previous full-App/cosmetic reports remain bound to their historical hashes, not
relabelled as rerun or browser evidence for this paint-only change.
