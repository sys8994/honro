# Stage34 — 파도에 깎인 절벽

Official-source visual production in progress; not an art approval or release.
Source: `shared/data/act4/world.json`, actual compiler `worldTerrain` / collision.
No geometry, actor, encounter, time, water policy, exit, or event changes.

## Authored units

- BODY land: ascending marine cliff, independent from finite overhang.
- BODY overhang: exact solid ceiling and open underpass; separate editable source.
- SURFACE: tiny one-way return-cut remains original, never bridged by BODY.
- REAR/FORE: original grounded dead pine, rock, haul footing and crack IDs retained.
- INTERACT/FX: water, wrong-exit actor/paired marks remain live runtime elements.

Generated concepts use `art/stage31-vector-production/body-small-concept.png`
as style reference and actual compiled skeletons as edit targets. Built-in imagegen
on 2026-10-28. Prompt contract: preserve exact silhouette; opaque white exterior;
8 flat blue-slate/ochre colors, small irregular natural two-tone rock planes,
shallow detail band, uniform deep #283e4a; no water/props/actors/platforms/noise.
`body-concept.png` is 1536×1024. `overhang-concept.png` was returned as 2172×724
rather than scaffold 2048×512: must fit to official silhouette during assembly,
not assume identical pixels. Both require actual Inkscape trace and exact source
clip; concept outline is never collision authority.

## Evidence

`source-contract.json`: exact source and compiled geometry hashes.
`inspect.mjs`: original production Native Canvas Scene; no far-art override;
sparse two-sample warm timing is NOT a performance percentile.
`app-adapter.mjs` / `play-inputs.mjs`: actual App/Engine/Story coastal events,
prepared earned-SP entry profile. DOM/audio/storage scheduling are doubles;
actual scene snapshots every 300 physics ticks, not continuous browser gameplay.
No actor/resource/event forcing. Baseline and candidate receipts kept separate.

Remaining: actual trace/optimization, three distinct visual review passes and
final integrated review, final-source normal-input mission and save/Continue,
scoped publication by coordinating parent.

## First structure/readability review

Actual common renderer `_local/reports/stage34-production/body-first/` reviewed
whole, first-contact, summit-mobile, both extreme domain edges. Exact ascending
contact/underpass retained; no rectangular coverage holes at either domain edge.
Right-side v1 rock slabs were too large at actor scale. They are not accepted as
final: targeted generated `body-v2-concept.png` reduces slab size and cap thickness,
keeping the same terrain silhouette. V1 trace retained as provenance.

## Normal-input baseline

`fixtures/normal-earned-inputs.json`: 114 ordinary input commands completed the
original App mission at frame20,333, round8. All four heroes alive; six original
enemies defeated. Optional wrong-exit actor naturally completed entering/inside/
emerged flow, not forced. Original runtime won with archer/mage/knight x≈7247 and
occultist x6916 (its actual exit tolerance, not a new contract). Input policy first
needed bounded aiming cadence and routing past the overhang tip rather than
chasing the emerged actor's x from below the ceiling. Two incomplete exploratory
runs were interrupted; those are not engine failures or completed play evidence.
No HP/MP/actors/event/geometry overrides, and no change to original Engine ticks.
Sparse Native Canvas samples every300 frames use ~1.7GB RSS by end; not a measured
browser leak. Baseline is not final-candidate validation.

Independent baseline tape replay also won and performed actual stopBattle/persist/
Continue at frame4847, preserving exact units/objective/phase/round/active hero.
All three original enemy groups produced damage events. Wrong-entry/wrong-exit
were observed through actual Scene samples. Dialogue policy skipped the optional
three rows, so they are **retired, not presented**; no false presented receipts.
Baseline focused shore/lethal boundary, early-kill variant, controlled roof-shot
comparison and intentional return-cut landing are not yet run. Source parity is
not a substitute for those behavioral cases.

## Final conservative optimization and contact review

Selected BODY is actual Inkscape `body-v2-raw.svg`, overhang `overhang-raw.svg`.
Independent Inkscape Simplify .00001/.00005/.0001 and numeric5/4-digit trials are
preserved in reports. Global Simplify failed protected tolerances. Selective BODY
paths4/5/7 passed numeric limits (4240→4115 commands) but introduced thin warm
interior seams at maximum-scale direct review, so **rejected visually**. Overhang
selective reductions also failed protected silhouette tolerance. No budget raised.

Final `*-runtime.svg` instead retain all raw curves, commands and subpaths with
absolute .001-source-unit coordinate precision. BODY4240commands/205subpaths,
overhang5922commands/184subpaths,11paths each; importer15nodes each. Normalized
asset bytes BODY215128→177978, overhang306806→255708. This is precision/storage
optimization, not claimed curve-count reduction. Exact-subtree symbols compress
repeated domain appearances without changing rendered paths.

Raw→selected actual Native SVG comparison passed at whole-source widths1400/2940.
Additionally `verify-max-crops.py` tests actual **1.1world-unit zoom**, using five
bounded1540×990 source crops rather than mistaking a downscaled whole map for
maximum display scale. All protected silhouette offsets0px, maximum protected
RGB MAE.00834/255 in those crops. Whole-source and maximum crop pixels directly
reviewed; small original quantization freckles remain, no new warm seams.

Assembly maps source artwork only. Exact original roof polygon clips a1.02x/1.15y
coverage fit and35unit original-top cap; underside no longer has a warm matte rim.
BODY deep material matches measured opaque source #263e4c; an original-top+1800
quiet fill suppresses isolated deep trace islands. No new solids or skirt.

Final review uses `_local/reports/stage34-production/final-review/`: whole,
first contact, overhang, return-cut maximum, summit portrait/mobile, both wide
outer domain edges. Prior distinct passes are body-first (structure), smaller-
planes (readability), roof-fit/quiet-depth (camera/underside/domain). Actual
Scene/actors/far art, not composite screenshots; Native, not browser hardware.

Separate `probe-roof.mjs` replays normal input prefix to mage(2959.7,4158.1),
then legal M01 at70deg/full power actually hits original ceiling(3179,3596).
55deg prediction clears the roof and reaches uphill land. No synthetic poses,
resources or event states. This is a focused branch, not a second full victory.

Reproduction of selected source precision/import:
```
python tools/stage34-production/prepare-config.py --body-v2
python tools/vector-production/quantize-svg.py art/stage34-vector-production/body-v2-raw.svg --output art/stage34-vector-production/body-runtime.svg --grid .001
python tools/vector-production/quantize-svg.py art/stage34-vector-production/overhang-raw.svg --output art/stage34-vector-production/overhang-runtime.svg --grid .001
python tools/vector-production/import-svg.py art/stage34-vector-production/body-runtime.svg --config art/stage34-vector-production/body-v2-config.json --output art/stage34-vector-production/body-asset.json
python tools/vector-production/import-svg.py art/stage34-vector-production/overhang-runtime.svg --config art/stage34-vector-production/overhang-config.json --output art/stage34-vector-production/overhang-asset.json
node tools/stage34-production/assemble.mjs
python tools/stage34-production/verify-max-crops.py
```

## Delivery status

Final precision-selected package independently replayed the same114 ordinary
inputs: won frame20333/round8, exact normal App save/Continue at4847, all four
heroes alive, original wrong-exit observations/terminal state retained. Final
receipt project SHA matches `candidate-project.json.gz`; `final-app-receipt.json`
and `package/manifest.json` carry exact hashes. The inside/emerged actual Scene
samples were directly viewed. Static compiled collision and all original game
fields/element IDs remain byte-equivalent under the assembly assertions.

Ready for coordinating publisher's integrated review, master/Pages deployment
and actual browser/HUD check. Untouched older rock/dead-pine/haul-footing props
remain visibly more primitive than the new BODY. No automatic/user art approval
claimed. Shore recovery/lethal-sea branch, early optional-actor kill branch and
intentional one-way return-cut landing were not exercised; normal ascent/mission,
wrong-exit observation, real roof collision and save/Continue were exercised.

### Final package-depth correction

A final serialization audit found exact-symbol dedup had fallen back on domain
assets because identity-only wrapper groups consumed the unchanged depth budget.
Assembly now flattens only identity groups (no style, clip or transform), and
asserts both domain assets successfully deduplicate. Each domain is now about
190 KB instead of4.4 MB. `dedup-render-check.json` records pixel-exact equality
for all14 actual Scene/collision views against the directly reviewed final set.
The corrected candidate independently repeated the actual App mission and
save/Continue with the same20333-frame victory; final receipts use its new hash.

### Shared boulder final polish

Once the common natural boulder existed, all five original `env:rock` instances
were replaced by scoped `s34v:coastal-boulder`, reusing actual trace provenance in
`art/vector-common-production/coastal-boulder-source.svg` via Stage33's imported
asset. Instance IDs/x/y/uniform scales, alpha foot and aspect are retained;
noncolliding asset adds no physics. A flat orientation visibly floated on the
steep x3490 incline, so rigid rotation now follows the exact original land
segment tangent at each existing foot. No support or coordinates were invented.
Normal contact, overhang and summit portrait screenshots are committed under
`boulder-review/`; the small original dead pine remains, not a dominant new prop.

Before/after independent real App replay with the same tape has **exact** trace,
shots/impacts/damage, transitions, final units/event state,20333-frame victory and
save/Continue parity. Only per-run sourceRun/campaignRunId values are normalized.
`prop-parity-check.json` and updated final receipt/manifest bind the new package
hash. Compiled collider equality remains asserted during assembly. Prior note
about primitive rocks is superseded; older haul-footing/dead-pine art remains.

### Remaining scenic footing cleanup

The four separate `a4-coast:haul-footing` instances now reuse the actual common
boulder at original718-unit ink width, with uniform scale and their unchanged
feet. Support-tangent selection uses the nearest original terrain edge, including
the finite overhang; it asserts the original foot matches within1world unit.
Paired `a4-coast:crack` landmarks retain their distinctive fissure silhouette.
Assembly asserts original gameplay and compiled collisions unchanged. Three
actual Scene views in `remnant-review/` were directly inspected. Existing full
mission receipts remain explicitly bound to the prior candidate; this decorative
pass does not relabel them as fresh replay/browser evidence.

### Protected shared fissure landmark

Both functional crack appearances now reference `s34v:crack`, the shared actual
imagegen→Inkscape asset with darkest fissure paths unchanged during optimization.
Original element/event IDs, x/y, scale, interaction geometry and physics remain.
Rigid display orientation follows the original supporting floor/roof segment
about the unchanged foot, fixing the visibly floating edge of the old upright
pose. Actual paired-overhang and maximum return-cut views in `crack-review/`
show the dark split readable on both differently oriented supports. Source and
bounded-error evidence live in `art/vector-common-production/cracked-sea-rock-*`.
