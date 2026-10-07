# Campaign objective revision 2

Approved on 2026-10-07. `shared/runtime/objective-revision.js` is the single content/canonical objective delta; `objective-guidance.js` is read-only presentation. `objectives.js` removes unrelated Act 1 round floors but preserves genuine defense, escort, ritual and post-objective stabilization requirements.

## Authoring contract

`HonroObjectiveRevision.author(project, {minStage: 11, maxStage: 30, force: false})` returns a new project with changed stage copies. It does not mutate the caller. Already revision-2 maps are unchanged unless `force:true` is requested. The shared Game/Workshop bundle applies this projection. `tools/map-forge/apply-objective-revision.mjs --max-stage=N` persists a requested canonical prefix without regenerating unrelated geometry.

The location generator can use `{minStage:23,maxStage:30}` to preserve its input stages 1–22 exactly. Do not set `honroObjectiveRevision` before authoring. Existing goal marker coordinates are preserved. Stage 27 must author a `party-reunion` marker at its actual central floor; only older production geometry without one uses the petition-record point as a temporary fallback.

Attack targets remaining: stage 5 `cliff-cleat`; stage 8 `bier-knot-0` and `bier-knot-1`; stage 18 `upper-chain`. Stage 18's lower-chain interaction remains part of the four-person ritual.

Stage 22: archive-seal opens archive-door, ledger-case opens upper-door, upper-register retrieves the actual upper-floor register, compare-ledgers holds for two enemy ends, archive-exit completes the chapter. Case/register display names are the same in steps, markers and HUD.

Stage 27: water-release and fire-screen share parallelGroup fire-control and are both interactions. The timer stops only when both are complete. party-reunion is splitOnly and requires `HonroSplitCampaign.allPresent(b)`, allHeroes and the same-floor radius. Existing NPC, record and escort keys are unchanged.

## Saved battles

New maps store revision 2 and their explicit ordered steps. Existing battles without that revision retain their serialized terrain, markers and steps; missing historical step snapshots fall back to the captured pre-revision content. Historical guides and completion beats use the historical content view. Continue does not add a new document, remove a latch or open a gate. Retry creates a fresh revised map using normal existing reward-ledger rules.

A `splitOnly` objective is visible only when `b.honroSplit.version===1`. Split state is owned by split-campaign.js; this module never creates a roster, heals units, resets an inventory, replaces returnProfile or changes retry navigation.

## Verification

- `npm run test:objective-clarity`: current/finish/failure display, true timers, four-device count, canonical idempotence, gate/marker/step coherence, both fire orders, split reunion, historical steps and hold re-entry.
- Source/state fixtures do not replace a normal-input run or actual browser QA.
- Follow-up release must test old Continue and new Retry, all required reach/escort routes, build both HTML files and verify the exact published tree on Pages.
