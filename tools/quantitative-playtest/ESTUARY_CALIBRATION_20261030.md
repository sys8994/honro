# Low-estuary input sanity and single full calibration · 2026-10-30

These are **calibration, not holdout or gameplay acceptance**. The later native
natural-top/art candidate may differ. Keep these outcomes and identities; do not
promote the short run or erase the defeat after a source/controller change.

## Frozen execution identity
- Candidate commit: `833000fc1afd3f3af1b2888bf64e2a4053621965`, based on root `60d17dd5f`.
- Supplied stage SHA: `11a84ac9a68028715118a966f1d42735682402f7ab39d0f99b3cdc3c1bd80234`.
- World transport SHA: `bc5fbf0c5044f644834cc71230e7bdb3b2b1331ea6e9abdb2e9c98e6ed78dc04`.
- Source hash: `8be24c35b00faaeda0327ad7363df00c6a5807f8d2dd8611b9180ee29318261e`.
- Controller hash: `791629b04f1ede6692bf1dc36716080c2659f53d066def3f2e98b45cf266bbec`.
- Controller v6, advance, seed11. Normal prepared cohort, six legal stat
  investments, starter equipment; initial HP1085/1174/2036/1362. Actual prior
  stages1–30 were not played. No position/HP/refill or enemy deletion mutations.
- Actual production App + official manifest + fresh v2 budget sentinels,
  authored bounds7000×1800, NativeCanvas Scene and per-frame pixel readback.
- The candidate commit only pins the supplied temporary roster for calibration;
  **do not cherry-pick its world into the final canonical candidate**.

## Observed outcomes
| Purpose / run | Registered budget | Outcome |
|---|---|---|
| input-sanity `8decbc10-b8e9-4659-aed7-df188c3e4c60` |600frames /180s|frame-budget timeout,R1;36.38s wall|
| full-calibration `74f9a0ef-7ab5-4185-bb42-97e556e9da20` |60000frames /1800s /20R cap|production defeat,R7,6989frames;274.02s wall|

Each has an authoritative pre-execution registration and distinct protocol cohort.
Neither cleared. No technical error was reported. This is not a clear-rate sample
large enough to infer human difficulty. Wall time is not human playing time.
The sanity's 240→600frame RSS was768.7→771.2MB with600 actual readbacks.

Full calibration killed5 enemies and damaged7, all in the first shoulder group.
First enemy HP loss: R1/frame149. The next reverse-side group was observed by
camera but not damaged or physically entered. Maximum awake enemies8; accepted
acting enemies at most6/R. No water recovery. Normal route-qualified movement
762.16wu versus raw944.08wu; no meaningful jump/drop episode was required here.
The revised geography-first SOP treats vertical counts as diagnostics, not quotas.

| Hero | Actual skill / fires | Fires with enemy HP loss | Enemy HP removed | Own HP removed | Minimum sampled living moveLeft |
|---|---|---:|---:|---:|---:|
| archer |A01 /7|3|440|1085|1872|
| mage |M01 /6|4|626|1174|1969|
| knight |S00 /2|2|465|2117|1725|
| occultist |O01 /5|3|291|1362|2078|

Own HP removed is accumulated actual hurt, not initial-minus-final (production
healing can make cumulative loss exceed initial HP). The knight's2117 is not a
profile mutation. No sampled movement-budget exhaustion occurred; one navigation
`arrived` defend occurred atR3/frame3228. The run cannot establish that total map
length does or does not fit20R: the party died before traversing it.

All20 allied shots used basic skills; selecting the first affordable ready skill
means the advance policy does not demonstrate trained-skill tactical competence.
Eight casts caused no enemy HP loss. Their aim-time ranges were489–796wu, but
successful casts also reached789wu. Mean absolute angle perturbation from the
fixed preview grid was2.72° for the12 HP-damaging casts and3.35° for the8 others.
These small, confounded observations do **not** identify ±6° as the sole cause.
The existing raw log lacks the unperturbed best preview distance/end collision;
terrain occlusion, coarse grid choice, charge discretization and random error
cannot be causally separated from these observations alone. Do not tune the
frozen error distribution or cohort from this defeat. Retain failure; use actual
GUI observation and passive preview diagnostics before any independent reevaluation.

## Local evidence and official GUI import
Under `honro-pilot-estuary-calibration/_local/reports/`:
- `estuary-v6-sanity/`: attempt, compact gzip, summary, memory log, combat ledger.
- `estuary-v6-full-calibration/`: same plus movement-and-shots and observed aim association.
- Full ledger has explicit original-shot provenance and no missing-data warnings;
  it records48 damaging attack groups across both sides, not48 allied fires.

`estuary-v6-full-calibration/SYNTHETIC-prepared-stage31-entry.json` was produced by
actual App.export → downloadProfile → normal JSON Blob, freshR1/shot0 with
`debug=false`, `training=false`, `customMap=false`. SHA256:
`3dfa72e5d5ed7ce58133020e813514bc28fa758e663094460364b61e7c6c4714`.
The adjacent receipt and export-preflight contain source/module/asset/body IDs.
Import only through official JSON import in a separate localhost record. It is
synthetic prepared entry, not earned campaign history or a public-user save.
Root owns direct GUI verification; this export alone does not prove import/play.

## V8 same-graybox comparison — control model, not human difficulty
Run `a5ae9734-b662-4a73-ae73-42f6d43dc92c` used the same world/stage, prepared
starting cohort andseed11/advance. New controller/source were preregistered:
- Controller `e100348958f22f251958679104527257d8e7678a5516543ab08941b7e16f0a9c`.
- Source `475aa8f6c719182237b5b4aeb6b4262005323c018dd1ab16c397bb0cbf5d4a92`.
- Budget60000frames/1800s/20R. Result **production defeat,R6,6802frames**,332.09s.
-11 enemies killed/13 damaged; next reverse-side group first damaged inR4.
- Normal qualified movement4684.49wu/raw5047.65wu; water recovery0; max awake10,
  actual acting enemies6/R. No pose/HP injection or movement-budget refill.

| Hero | Actual accepted skill counts | Enemy-damaging casts | Enemy HP removed | Minimum sampled living moveLeft |
|---|---|---:|---:|---:|
| archer |A01×4,A14×1|5/5|1122|1165|
| mage |M01×4,M02×2|5/6|1096|1736|
| knight |S00×4,S06×1|5/5|1493|1725|
| occultist |O06×1,O01×3|4/4|278|1346|

An enemy-damaging cast can be partial splash or hit a different visible enemy;
it is not a direct-target hit or full damage-budget success. The other-ally
friendly-fire count fell from baseline3 to0 in this single paired seed. Self
O01 splash remained twice,21+21.3HP: the current safety check excludes the caster
from both path and impact proximity. That is an unresolved control defect,
not an excuse to lower enemy numbers. No v8 behavior was patched during the run.
No defense input was used; deliberate threat response, healing/defense timing,
cover choice and party coordination remain incomplete. The defeat is **not**
evidence that ordinary human players cannot win or that the map is too long.

Public selected-preview rejections: visible ally path22/contact12/near impact4,
terrain short of target14, away from target10. One actual charge-power preview
was rejected at release. These are declined observations, not fired attacks.
The fixed25-point aim grid and ±6°/±.07 sampler are **uncalibrated control models**,
not measured average-human accuracy. Safety filtering conditions executed shots.
Future coarse aim, bounded public-trajectory adjustment and precise-input upper
bound must be separately preregistered; none is a human clear-rate estimate.

Evidence: `_local/reports/estuary-v8-full-calibration/` contains registered
attempt/gzip/summary, explicit-shot combat ledger and `control-diagnostics.json`.
Full real-HUD nonbasic input and core navigation regressions passed immediately
before this run (`_local/reports/v8-input-regression/`). No screenshots were
captured by the frozen runner; later native captures must not be presented as
images of this run. Browser GUI review remains separate/unverified.

## Actual graybox Scene captures (new attempts, not old-run screenshots)
Capture-only source hash `f1d59c3c0da1a8662f5b1598dda1ea9eb0f24bcc890352b3b91015647c5afa73`,
controller `82614e4b19b1710c963eee66944a1048ccb3abeb8fe97436faccf36c6ecfb3a1`.
Same supplied graybox stage/world and entry cohort. Both attempts were registered
before setup and ended at their own frame budget, not at gameplay clearance.

- `b3818188-abc9-455e-a8fe-56d4b4165cf0`: input-sanity600frames/180s,
  R1/enemy phase. `_local/reports/estuary-v8-scene-capture/`.
  PNG SHA `6a0695a0a461aefae1940dee44d7c356e96822f89d34cfbe80b3c3719a4be6db`.
- `1fb46309-8da1-4073-8e36-f2639b648bf8`: setup-probe1frame/180s,
  R1/aim. `_local/reports/estuary-graybox-initial-capture/`.
  PNG SHA `8fbb7d579f0a293158a2a83c7e0d437337cf43fff463770053d31e64aad46464`.

Both actual1440×900 canvas images were inspected. The600frame image shows the
first engagement on graybox slopes. The1frame image is the official arrival-tour
camera's eastern dock view; it shows only part of the initial enemy placement,
**not all34 enemies or the complete battlefield**. Neither is the newly authored
native-art candidate, an HTML HUD/browser screenshot, or a reconstruction of the
older full calibration. Exact frame/phase/source/pixel hashes accompany each PNG.
