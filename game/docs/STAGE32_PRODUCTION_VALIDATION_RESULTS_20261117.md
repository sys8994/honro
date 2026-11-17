# Stage32 lower non-walk transition: bounded production candidate

## Status and immutable references

Candidate branch `fix/stage32-lower-transition-20261117`, reviewed code/test HEAD `13d671e3cc80a9e70ab0a299d45860094bfe3181`. Production helper SHA256 `aab056752d65b36fcb620f5e3896ee4404926170de4c67d9fc33aa83fea22953`. No master/Pages deployment. Lower horizontal seam improved; internal fine green seams remain, so this is not whole-stage art acceptance. Raw BODY/25 paths/gray selection, actual roads and existing collision/physics are untouched.

CI44169626563 and44169626456 both succeeded: original frozen V1 contract, new bounded-buffer contract, source/provider/isolated synthetic codec roundtrip, actual independent Chrome captures, strict comparisons and official Act4 build. Artifacts14367771766 (2-view/performance),14367446989 (5-view matrix). Historical adapter comes from remote e89242ee, documented tree-equivalent of local be99eb99; exact adapter SHA assertion remains.

The original V1 one-buffer assertions remain verbatim. Its historical helper passes; its expected allocation assertion4!=1 against new production is explicitly recorded, not silently weakened. New checks preserve state restoration, opacity/shear fallback pixels, source/custom/large-canvas behavior, cache invalidation, clear, exact logical byte accounting and bounds. Frozen helper's initial local extra LF was caught by its hash assertion in CI44165429770 and corrected in661161a0 without changing the assertion.

## Visual evidence and protection

The two desktop captures retain exact original-control PNG hashes. Production PNGs are also byte-exact before/after draw-local mask optimization:
- lower: `db362ea1c2fd5a85e9ec2a00dab8a1d1ddf0398d1e814c85d1bb4f147eae065b`
- left: `433ee070c4a868b336687a58438066bcafef57af8e108316d74a487c1da77b65`

All ten matrix PNGs are byte-identical to the pre-optimization images directly reviewed from artifact14367720979. Lower seam reduction is visible; internal fine green lines remain visible at walking scale. No new road/grass silhouette damage or clipping observed in these views.

| CSS viewport/view | Actual camera x,y,scale | Changed pixels | Protected world y<=1700 |
|---|---|---:|---:|
|390x696 overview|1689.6,1200,.057352941176470586|1198|0|
|390x696 bottom extreme|1689.6,2492.8,.057352941176470586|1158|0|
|844x390 overview|1689.6,1200,.12411764705882353|3658|0|
|844x390 bottom extreme|1689.6,2492.8,.12411764705882353|2999|0|
|1331x763 walking|1689.6,1342,1|4051|0|

`shared/map/bounds.js` defines minimum zoom=max(width/6800,3.75/66), capped at1.65. These values are smaller than .24. The fixture uses the computed minimum, records after-constrain and after-render cameras, and requires final scale to equal the minimum. No additional Stage32 zoom clamp took effect in the complete loaded renderer/Act4 stack. Bottom-pan input y1e9 is clamped normally. No normal App/input/user battle/save was accessed. These are DPR1 CSS viewport diagnostics, not real mobile hardware.

## Memory and production behavior

One existing material buffer plus three module-local auxiliaries. For desktop views: material1,065,024 + auxiliaries1,882,368 =2,947,392 logical RGBA bytes. Auxiliary dimensions516x198,516x198,516x516;3 allocations/3 resizes. `clear()` returns all allocated buffers to1x1 (16 total bytes). Auxiliary device-plane cap is1M pixels; old material cap remains8M. Unsupported axis/alpha/opacity/composite/filter/shadow/canvas states use the previous renderer. These logical bytes exclude Scene tile caches, browser/GPU overhead and decoded images.

The optimization caches only the identical source-band material-copy/gradient mask within one BODY draw. No cross-draw/global cache, fill, mask, geometry or rendering behavior changed. Roads21–24 retain original fills. Source780..904 ROI and world1716 transition start unchanged. World1700 protection is a diagnostic criterion, not represented as a direct user requirement; any future intentional replacement of this criterion must be explicitly documented with concrete road/grass/object/collision protection, not silently relaxed.

## Real-clock timing, not gameplay FPS

CI44167410948's virtual-time10/60 timing arrays were all zero and are invalid performance evidence. A real-clock CDP runner replaces virtual-time for subsequent independent Chrome fixtures. Chrome157.0.8103.50 binary SHA256 `cce8581219e59c17bcc60bff0cdfdcb2405a6d63acb1f3c32670a40814ba558c`; final full runtime SHA256 `60e0a768606cf85e253979e80cf0a5fa428b6f9a6352f9a6f120e6ce1f6a9a42`.

Ten cold in-memory Scene builds reuse decoded assets but reset helper/Scene caches. Sixty warm calls reuse a Scene and assert no material rebuild. Sixty pan calls move16 world units/frame and apply normal bounds. All timings are synchronous CPU submission, not GPU-complete render latency, device FPS, launch/load costs or gameplay. Nearest-rank percentiles; n10 p95 is the maximum. Same-run baseline/optimized results in milliseconds:

|View/metric|Original p50/p95|Optimized p50/p95|
|---|---:|---:|
|lower cold full Scene|14.7/16.3|33.6/37.8|
|left cold full Scene|14.8/16.7|29.5/30.5|
|lower cold world-build|4.8/5.2|24.0/27.8|
|left cold world-build|4.9/6.3|20.3/21.5|
|lower warm|.2/.5|.2/.5|
|left warm|.2/.5|.2/.4|
|lower pan|.3/.9|.2/.5|
|left pan|.2/.5|.2/.4|

Both pan tests rebuilt material on1 of60 frames. Maximum pan time original lower11/left10.6 versus optimized25/26.3ms. Thus the p95 conceals the isolated rebuild spike and is not sufficient to claim smoothness. Cold costs remain approximately twice the original total Scene time. Prior unoptimized real-clock cold lower40.1/41.3 and left34.4/34.7ms suggest improvement, but cross-run runner differences prevent a formal paired speedup claim. No invented performance acceptance threshold.

## Minimal integration delta relative to396bac79

Exactly six runtime/source files activate this32 feature; taking only the helper will not work:
1. `shared/act4-handoff-art.mjs`: two material providers, retired-provider compatibility IDs and door BODY reference.
2. `shared/build.mjs`: register stage32-foundation-art before act4-pilot-art, preserving other registrations.
3. `shared/data/act4/handoff-art/32-foundation.json`.
4. `shared/data/act4/handoff-art/32-material-protection.json`.
5. `shared/runtime/act4-pilot-art.js`: new BODY contact-underpaint key and helper draw hook, preserving other terrain deltas.
6. `shared/runtime/stage32-foundation-art.js`: use final SHA above, not prototype/frozen V1.

The first five are unchanged from d1cc421f; final branch has the sixth. Original32.json remains unchanged. Do not replace shared build/adapter/pilot files wholesale on an integrated tree with other stage/monster changes; merge the explicit32 hunks. Related tests include unchanged `tests/stage32-material-cache.mjs`, `tests/stage32-foundation-contract.mjs`, frozen fixture, new bounded contract, lower-production browser3 files, matrix browser3 files, real-clock Chrome driver and2 workflows. Historical rejected raster art/prototype diagnostics need not be selected as runtime changes.

Raw BODY843367 bytes is intentionally retained instead of optimized684521 (+158846). The old alias's relative-m semantics invalidate the unchanged subpath selection; it remains unapplied. This byte increase is separate from transition overhead.

## Still unverified / not accepted

Internal green seams, optimized alias compatibility, whole-stage naturalness, other dynamic states, physical mobile devices, public UI and normal input, real-save migration and gameplay quantitative acceptance remain outside these results. Retained original providers and synthetic codec roundtrips are not real-save acceptance. Combined terrain/monster integration requires its own regression. No deployment or whole-stage approval is claimed.
