# Stage 36: native blue-dawn banks and protected mission courtyard

This is an isolated stage-only artwork/geometry revision. It does not write the
shared world or runtime. The existing house, door socket, `a4:door` instance,
mission events, units, encounter logic and play bounds remain unchanged.

## Sources and reproducibility

- `art/stage36-bank-silhouette-v4/play-{west,east}-skeleton.*`: actual source terrain;
  macro anchors, not the desired final ruler-straight surface.
- `play-*-concept-v2.png`, exact `play-*-prompt-v2.txt`: two gameplay-resolution
  imagegen concepts, 1774 × 887; a 92-world-unit actor is 34 source pixels tall.
- `play-*-source.svg`: actual desktop Inkscape six-color stacked trace, smooth,
  background removed; five native paths per bank. Embedded concept retained.
- `play-*-raw.svg`, `play-*-master.svg`, optimization report: immutable raw and
  selected geometry. Three simplification thresholds and two precision levels
  were tested against the same raw. The stricter 0.7-source-pixel silhouette
  bound rejected the simplified candidates; the already-safe raw was retained.
  Safe source cost is not permission to relax the error bound.
- `register-seam.py`: purposeful placement correction, **not** fidelity-bounded
  optimization. Native connected inner-plane depths meet at world x3600, fading
  through 650 world units. Outer contours are unchanged. One small source detail
  crossing the crop boundary is repositioned intact rather than discarded.
  Actual Inkscape normalizes the registered SVGs.
- `assemble.py`: macro-drift reconciliation, protected courtyard, exact matching
  terrain contact, restrained semantic palette and isolated stage-only module.

Run from repository root:

```sh
python tools/stage36-bank-v4/register-seam.py
python tools/stage36-bank-v4/assemble.py
```

The source project is `_local/reports/sea-silhouette-v3/project.json`. The output
`_local/reports/stage36-bank-v4/candidate-project.json` is a **review project**, not
an instruction to replace the full integrated world. Integrate only the selected
stage and reachable new assets from the corresponding `candidate-module-*.json`.

## Protected contacts and geometry honesty

The house footprint/courtyard is x1970–3190. Its original piecewise support is
preserved exactly, including the original vertices. The house and functional
door transforms are unchanged. Other noncolliding ruined-frame/foundation feet
are moved by the local terrain delta. Outside that courtyard, explicit new
terrain follows the native authored contour, flattened at 0.15 source pixels and
simplified at 0.6 world units. The same physical polygon clips the artwork.

Both bank sources use one full physical clip and canonical pixel-snapped slice
rectangles; separate vertical antialiased closures at their join are forbidden.
A same-color opaque continuation exists only below every authored shallow stratum
and prevents the source-image bottom edge from becoming a visible line. It adds
no decorative shape and changes no collider. Physical domain remains
x−6000…13200, bottom27100; new high-resolution bank coverage is −800…8000.

## Review and proof

- `capture-views.mjs PROJECT OUT 36 [comma-separated-view-ids]` uses the actual
  App/shared renderer with fixed inspection cameras. Views include normal,
  detail, portrait, whole stage, left/right camera margins. DOM/audio are doubles;
  this is not browser/mobile performance certification.
- `capture-door.mjs PROJECT OUT` uses the original ordinary 1020-input tape to
  reach standing → fallen door. It does not assign fallen state or receipts.
  Source/runtime hashes and actual door state accompany captures. The script
  throws if ordinary inputs do not reach fallen.
- Run one Native App process at a time under the shared QA lease. Source-only
  small SVG comparisons are separate from full App captures.
- First native `27148022` scene: organic contour and blue house/functional door
  direction accepted; obvious inner-strata seam rejected.
- `04dbed79` recheck: large seam removed; remaining light-plane/crop stitch found
  and corrected in `b41ebbcb` source. Actual final render, camera margins, ordinary
  door lifecycle and changed-bank movement/Continue remain mandatory.

No automatic `visualApproval` flag, fake approved revision, runtime budget
increase, or whole-project deployment is part of this module. Review failure
records are not production approval.

### Final margin correction and replay diagnostics

`85f35530` retains b41 terrain byte-for-byte. Actual b41 margin captures exposed
incompatible old far-body planes. Camera-only outer domains now continue the
native endpoint cross-sections, with two source pixels of overlap removing the
native image-edge closure. This is explicitly technical off-play coverage, not
a new gameplay bank or a substitute for authored gameplay silhouettes.

`play-inputs.mjs PROJECT OUT campaign-balanced-v1` is an owned copy of the existing
ordinary adaptive policy, adding round checkpoint tapes, terminal door/actor/modal
state and source/runtime finish guards. It changes no mechanics or resources.
`capture-door.mjs PROJECT OUT [TAPE]` independently replays a supplied tape and
asserts initial standing and actual fallen phases, recording the triggering frame
and tape/source/runtime hashes. The historical 1020-input tape failed on b41;
that old run did not record terminal state, so it establishes neither an
impassable terrain diagnosis nor a passing lifecycle. Fresh adaptive input and
independent replay remain required.

`5cd7a2b5` additionally associates technical camera-margin coverage with its
actual full-domain physical terrain via `collisionSource`, exactly like the
connected bank. Without that truthful link the renderer classified its pixels
as decoration and applied different saturation/contrast, which actual App
review caught despite seam-free source previews. No new collider or geometry
change is introduced; all four connected body assets now resolve to the same
runtime visual role.

`eec76ca1` is paint-only: the opaque base path now shares the same pixel-snapped
body range as native slices. Otherwise, the independently antialiased base's
vertical closure darkened two pixels over the adjacent native layer at x3600.
All stage data and terrain are exactly equal to `5cd7a2b5`; only the two native
body paint trees differ. The source-only join preview passes; actual App scene
verification remains required before accepting the correction.

Final `eec76ca1` actual App captures under runtime `9278a691` confirm the base
closure correction. House, west, east, whole-stage and portrait inspection views
were visually reviewed. Six interior-stratum rows have equal pixels across the
former vertical seam (screen x1264–1267). This is a targeted regression check,
not proof of all camera zooms or ordinary gameplay. Door lifecycle remains
separately queued through ordinary inputs and independent replay.
