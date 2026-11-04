# Stage8 current gameplay review · 2026-11-04

Status: native baseline complete; candidate full run and browser completion pending. This is not a taste approval or a release claim.

## Source and scope

- Public/master source inspected: `f85a108a29d27cc5488d69d42034d58ac7699c0d`. Its product source is `3985352a09ec5ca30e0472696f7fd9de98b4cc12`; f85 adds Stage6 publication records only.
- 434 local product files were matched against remote Git blob IDs, including runtime, engine, map loader and map-forge sources. The record does not claim every asset was independently hashed.
- Act1 Stage8 only. No Stage9, 17 or 24 design changes. Entry is a lawful first-clear reward fixture through Stage7, not a continuous earlier campaign.
- Native policy: actual App movement, jump, charge/release, selection and defense; DOM, paint, audio and clock doubles. Seed1228, `story`/원정, `focused-modern-routefirst-flowall-meleeclose-noitems-appops`. No Engine.item, actor writes, resource overrides or recovery calls.
- The live production telegraph renderer is invoked with a canvas double so warning observation and normal response actions occur. This does not prove real-screen readability.

## Latest-master baseline

- Won at R18. Both bindings were broken, the boss was defeated, reward was paid once, result led to rest and ordinary Stage9 introduction. No Stage9 battle was played.
- 37 living enemies initially, plus two objective target records. Total enemy-side records44 after five reinforcements;36 enemies remain at victory. No all-enemy clearing or all-three-survival requirement was added.
- HP damage taken1343. No external state writes or forced recoveries. Exact whole-battle Continue passed after the first binding.
- Route observations:34 jumps,17 drops,51 matched landings,46 movement records. No unmatched landing was observed. These are one route policy, not every terrain alternative.
- There were11 voluntary `clear-bier-road` movements over8 rounds. R17 used three defenses after moving to release the bier path. Much of this delay is the controller repeatedly giving way, not new narrative content or proof that enemy HP is too high. A single result does not establish a median or justify a blanket HP/count nerf.
- First reinforcement wave acted five times but exchanged no measured damage on this route. Low-health wave acted three times and caused36 HP damage. The first wave's tactical value remains unproven for this policy.

## New monster effect in a real encounter

- The naturally encountered `s8-15` prepared HWD02 at R4. Production warning observation set seen, the knight received a normal R5 response, completed its action and the cast resolved in the enemy phase.
- The route policy moved the knight outside the original fixed footprint. No HWD02 HP damage occurred. This was ordinary objective movement, not an independently optimized reaction strategy.
- Separate one-round counterfactual: exact Continue from the unmodified R5 save, then normal defense by each hero. HWD02 actually hit the knight and consumed26 shield (115→89), without HP loss or push. Other hostile hits were also absorbed. Defense is a useful alternative; this does not demonstrate a naturally landed push.
- The first counterfactual observer incorrectly expected HP damage despite defense and failed that expectation. Failure log is preserved. A second observer counted all hurt calls and exposed shield absorption. No product value was changed to make it pass.

## Reproduced old unpublished crow defect and narrow candidate

The master run naturally settled the living bier at R17. The crow warning was shown and the knight completed its offered response. At R18 `stage8-settled-crows` still had status `blocked` and spawned zero crows. Existing saved slots use y3830 and spacing105, narrower than the184px flight envelopes.

This candidate reuses the already-written fixes from `6b00abe2`, `fece7f62` and `386a7be5`, rather than inventing another balance change:

- Three collision-clear slots at x5950/6170/6390, y3930, spacing220. An occupied east edge can use the west alternate x5750/5970/6190.
- A derived pending-crow objective/minimap marker and short portrait-HUD instruction. The existing boss goal stays visible. The marker itself does not acknowledge a warning or mutate a save.
- Existing saved battle specs remain unchanged on Continue. Fresh battles get the corrected authored spec. Old saves can still defeat the boss without requiring this optional wave.
- The current Stage6 `HonroStage6DescentView.avoidObjective` hook is preserved when applying the old objective-label patch.
- No terrain, enemy count, HP, story, action cap, rewards or victory condition is changed. Only the Stage8 crow spec/event metadata is changed in campaign.json; all other stage objects are identical.

Focused production placement/save and warning tests passed on the latest-source candidate: primary/alternate admission, atomic rejection, response gate, population cap, nonduplication after Continue, unchanged old saved spec, boss/parallel warning retention and label separation with canvas doubles.

## Browser and execution limits

The official browser opened public Stage8 through visible settings/debug/journey controls and showed its R1 introduction. Subsequent DOM and screenshots timed out. The original tab later disappeared without this worker resetting or closing it. A fresh tab reached resource-loading UI, then DOMSnapshot and Page.getLayoutMetrics timed out. No permission denial was observed and no alternate browser mechanism was used. Full browser play and visual acceptance remain incomplete.

One initial native attempt exited137 at R1 without a game assertion. The bounded768MiB retry completed. This is not proof of an out-of-memory cause. Existing logs and evidence were preserved; heavy runs use the shared lock.

Master merge and Pages publication are not performed by this candidate commit. Final product acceptance needs the candidate run plus live browser verification; human enjoyment is not inferred from automated success.
