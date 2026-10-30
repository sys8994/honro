# Native module contact fit

`fit-module.mjs source-asset.json config.json output-asset.json` reuses unchanged
native path data in an internal symbol and maps explicit source contact anchors
to existing collision/support top points using piecewise affine transforms.

```
{
  "id": "stage31:reviewed-native-shelf",
  "semanticLayer": "REAR",
  "sourceTop": [[0, 100], [200, 90], [400, 105]],
  "targetTop": [[6220, 3570], [6450, 3500], [6650, 3520], [6830, 3600]],
  "depthScale": 1,
  "forbiddenPaths": []
}
```

This is a schema example, NOT an authored asset or approved source anchors.
SourceTop must be visually reviewed and span full artwork X, including foliage
extension; otherwise extraction/overhang design must be resolved before fitting.
TargetTop must come unchanged from stage layout. DepthScale is an explicit
intentional art proportion change, not raw-to-optimized fidelity. Source and target
must have strictly increasing X. Only normalized opaque filled path/group input
is accepted; strokes, source clips and preexisting symbols fail closed.

Output anchor is world origin. Place with x=0,y=0; output asset bounds/viewBox are
computed from transformed-and-clipped native paths, not guessed from target top.
Original source path strings are preserved. Collision remains empty. The tool
checks native fill-rule holes when evaluating explicit forbidden corridor paths,
exact contact mapping, and existing expanded 512-node/24-depth/60,000-path limits.
A missing forbiddenPaths list is **not** evidence that corridors were verified.

No source silhouette, collider, bridge geometry or shadow collider is generated.
This is only a contact-fitting mechanism. Pixel seams, natural proportions, actual
scale, source anchor correctness and final playable/camera views still require
visual/engine QA. The report never marks art approved.

Run focused mathematical tests: `node tools/act4-pilot-native/test-fit-module.mjs`.

## Explicit decorative overhang and baked output

`decorativeOverhangMaxSourceUnits` permits a bounded native exterior beyond the
reviewed support endpoints. Only the *art mapping* is linearly extrapolated there;
`targetTop` remains exactly the reviewed physical support and collision remains
empty. The report distinguishes support from extended decorative art. This must
not turn a decorative end into a false walkable support.

`bakeGeometry: true` applies native path affine transforms and Boolean clipping
offline, unions each source paint's slices, and serializes at .0001 world-unit grid.
It partitions only when needed to stay below 58,000 characters. This avoids
expanding a 50–60-point source profile into >512 repeated symbol nodes. Baked
geometry is explicitly **not unchanged source path strings**; the original source
file is unchanged and this is a deliberate contact deformation, not a fidelity
optimization. Focused actual Canvas fixtures compare baked/symbol pixels.

Failure prevention: fine contact anchors with repeated symbols may exceed the
fixed node budget. Do not loosen the anchor error or raise engine limits merely
to fit. Use measured offline baking, then validate/render the actual output.
Physics/straight-line design acceptance remains independent; do not approve a
fit to a failed long-straight terrain layout.
