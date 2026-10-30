# Stage39 — 돌아오는 물 vector production

Work in progress, not art/gameplay approval. Official source is
`shared/data/act4/world.json`; all original terrain, one-way, actors, rescue,
water/tide, IDs and artillery mechanics remain authoritative.

## Pipeline / concept lineage

`node tools/stage39-production/skeleton.mjs` snapshots the actual production
compiler and separate BODY/collision skeletons. BODY mapping is world
(-300,1400,9600,3200), native skeleton2304×768. Generated concept uses the BODY
skeleton as structure and Stage31 `body-small-concept.png` as style only.
Built-in imagegen output exec-0d0e7404-0547-4bd9-8f31-677a1a2ce2c8.png is
preserved as `art/stage39-vector-production/body-concept.png`.

Prompt: BODY-only connected tidal basin geology; exact3:1 silhouette with left
shelf/descent/basin/center work shelf/right high refuge. Small/medium blue-grey
natural rock planes, 2–3 flat values, ~10 colors, thin muted sand/olive cap,
perfectly uniform dark deep third. No water/waves/sky/mist/props/actors/ships/
rope/net/anchors/platforms/supports/text; no gradients/noise/stipple.

Direct concept review: natural asymmetric planes, clear broad basin and separate
high refuge. Original exact collision clipping/contact binding will constrain
small generated contour drift. Dynamic water, one-way paths, net, anchor,
artillery warning and living ship stay separate.

## Native mission policy

`play-inputs.mjs` uses original App, earned stage-entry SP training, ordinary
move/jump/drop/select/fire/defend/interact only. Boss is deliberately not a
required kill. Record tape is exploratory until independently replayed.
Native Scene sampled every300 unchanged simulation ticks because repeated
continuous Native Canvas draw can leak memory; not a browser/HUD substitute.
Prepared stage-entry progression is not a chapters1–38 walkthrough. Dialogue
skip currently retires story rows, not a claim those lines were presented.

## Selected production vectors (2026-10-28)

Actual Inkscape GUI traces by the shared artist are preserved as input/source/
raw SVG, raw PNG and trace-check receipts. Both native viewBoxes2172×724.
BODY12color trace11paths; wreck14color trace13paths. Source/raw paths match,
no embedded runtime images. Wreck v1 concept rejected as excessively textured;
imagegen edit exec-cc4e0469-b230-4a61-9f40-a3dc142add97 preserved silhouette/cannon
but replaced grain with larger flat planes. Transparent original was white-
composited solely for Inkscape background removal;14 enclosed alpha holes remain.

BODY raw deep gradients caused two almost-identical noise layers. `clean-body.py`
removes those two paths and merges the deep value to#2a3647, within raw error
limits (whole raw MAE~.406/255 final). Real Inkscape selective .0003 Simplify on
only path4/path3 plus .001 precision reduces raw22408commands/1317subpaths to
4961commands/307subpaths. All four original contact/cap paths keep exact source
numbers: whole-source precision produced a protected one-pixel alpha change and
was rejected. Raw940KB→selected221KB, runtime BODY~218KB.

Wreck global simplification trials did not fit unchanged importer budgets.
Selected wreck uses GEOS only on oversized opaque compounds: bounded Bézier
flatten .01, polygon tolerance .02, coordinate grid .01 source units; combined
local bound.037071. Original outer two trace paths retain exact source numbers.
This is budget-safe partition, NOT a claimed command-count reduction: raw18450
commands→73945 line/curve commands across45source paths. Normalized runtime~1.34MB,
within existing per-path/tree limits; single actual wreck camera warm draws~4ms
in this Native environment. No budget raised. Cannon/windows/holes and silhouette
were directly compared. Both final source comparisons pass at1400/2940 pixels;
all protected alpha silhouette offsets0px. `verify-max-crops.py` additionally
passes three BODY crops and full wreck at actual1.1world zoom (not a downscaled
whole-map substitute); raw/candidate pixels directly inspected.

`select-vectors.py` reproduces actual Inkscape selective cleanup, exact-contact
restoration, bounded partition and import. `assemble.mjs` clips/maps against the
original land, extends existing domain appearance using exact symbols, and adds
only opt-in `design.vectorWreckAssetId:'s39v:wreck'`. Dynamic boss position/bob,
health/hitbox/dead behavior remain original. Domains~226KB each instead of~4.8MB
repetitions, and assembly asserts dedup success. All original gameplay fields,
actors/events/one-way/support/net/anchor element IDs and compiled collision stay
identical. Older sparse footing/support/net props are intentionally retained;
parent's common prop production is separate.

## Actual review / mission receipts

Final original App candidate replay: boss **alive**,36725frames, all four
residents alive and really grounded in their safe slots, all heroes escaped.
Actual App stopBattle/persist/Continue at5612 preserved exact units/event state/
round/active/phase. Original App outcome persisted completed[39] and rescued
provenance; it is genuine39proof from a prepared stage-entry profile, **not** a
claimed historical32→40 campaign.9 real artillery projectiles resolved after
observed warnings.6 left-bank recovery events checked declared bank,25%maxHP,
action/MP preservation; other-bank/lethal-boundary branches not claimed.

The exploratory boss-alive run exposed a real artillery knockback deadlock:
residents0/1 overlapped and ordinary escort reverted every separating step.
Narrow runtime fix d5259d9 permits only supported ordinary walk steps strictly
reducing existing resident-pair overlap; no new overlap/other actor/wall/airborne
bypass, teleport or success-condition change. Exact prior failed tape now reaches
all4safe; fresh normal run and independent final replay win. Deterministic
negative regressions are explicitly synthetic, not fake mission passes.

`probe-interruption.mjs net|anchor` replays real prefixes and starts actual work,
saves/Continues pending elapsed action exactly, then cancels via ordinary actor
change (net) or walking out of range (anchor). Neither falsely completes.
Separate early-boss-kill ordinary policy also won; independent final replay and
receipt are stored separately. Killing boss did not auto-complete rescue.

`review/` contains actual common-renderer whole/normal/maximum/mobile/left-right
edge images, boss and net-state snapshots. Direct review found coherent cap,
continuous natural body, preserved underpass and readable focal cannon/windows;
no edge void or new false walkway. Corrected inspector loads the actual coastal
unit-body renderer (an earlier diagnostic omitted it and displayed the underlying
warden; that discarded pass is NOT final evidence). Camera-only high-tide views
come from a real normal-input prefix, never injected tide state. Render timing
fields are two warm Native samples, not p95/browser/mobile hardware benchmarks.

Remaining explicit limits: browser/HUD/Pages verification belongs to publisher;
optional helping-hand encounter, intentional resident-casualty failure, right-bank
recovery and lethal-channel branch were not exercised. NPC blocking/de-overlap
regressions do not substitute for a complete human difficulty test. Dialogue skip
retires story rows rather than proving every line presented. No automatic or user
art approval claimed.

## Reproduce

```
python tools/stage39-production/prepare-config.py
python tools/stage39-production/select-vectors.py
node tools/stage39-production/assemble.mjs
python tools/stage39-production/verify-max-crops.py
node tools/stage39-production/inspect.mjs final-review art/stage39-vector-production/candidate-project.json.gz
node tools/stage39-production/verify-app-observations.mjs art/stage39-vector-production/candidate-project.json.gz tools/stage39-production/fixtures/boss-alive-inputs.json _local/reports/stage39-production/final-boss-alive.json
node tools/stage39-production/verify-resident-separation.mjs
node tools/stage39-production/verify-wreck-hook.mjs
```

### Common timber and coastal footing polish

Six former polygon piers now reuse the actual12-color Inkscape timber-brace
source from Stage40 (14 runtime nodes), preserving original feet and visible
upper attachment heights. A render-only vertical fit handles each existing
height; no collision or underpass route changes. Four scenic rock footings reuse
common traced coastal boulder at restrained360-unit ink width, rigidly aligned
to each original land/platform support. Full old718-width fitting was visually
rejected because it covered the functional anchor fissure. Final natural rock
is smaller, while net/crack landmarks and all gameplay remain unchanged.

`remnant-review/` contains actual Scene wreck, western approach, rescue work and
portrait-high-ground views. Assembly asserts all gameplay and compiled collision
unchanged. Manifest preserves prior actual mission proof with its old package
hash; this appearance pass does not claim a rerun or browser verification.

The functional anchor crack now references shared natural `s39v:crack` rather
than the primitive gray polygon. Original element/event IDs, foot coordinates,
scale, interaction position and physics are unchanged. Actual rescue-work and
portrait bank views were reviewed in `crack-review/`; original upright pose on
this flat bank remains. Protected shared trace lineage and optimizer evidence
are in `art/vector-common-production/cracked-sea-rock-*`.
