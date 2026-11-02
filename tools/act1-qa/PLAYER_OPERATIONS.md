# Player-operation mapping (baseline292, 2026-11-03)

This mapping separates **Engine-action/model physics**, **native App action simulation**, and **actual browser input**. Production Engine calls are not automatically current UI actions. No old outcome is erased; its exact limitation is retained. A new adapter must reject unmapped methods rather than silently call them.

| Operation | Current UI → production path | Required guards / model limitation |
|---|---|---|
| Move | arrows/A/D or stick → App.frame → Engine.move(axis,1/120), main.js1236–1249 | App.canInput-equivalent frame gating: no modal/dialogue/turn banner/done; axis[-1,1]. Direct Engine.move only checks Engine.canAct, so old direct ticking is a model. |
| Facing / aim | stick facingIntent → Engine.face; App.adjustAngle, main.js538–541,652–656 | Facing-relative pitch[-85,90], right world[-85,90], left[90,265]. Native instantaneous App aim is idealized gesture, not pointer precision evidence. |
| Skill switch | Digit1–4 / skill button → cancelInput, selected, selectedByUnit, main.js856–859 | Equipped/available skill only; cancel charge/input. No live loadout or rank edits. |
| Fire | Space/pointer beginCharge → elapsed chargePower → releaseCharge → Engine.fire, main.js543–553 | App.canInput, grounded, affordability/cooldown/loadout, no retreat, actual elapsed charge. Engine.fire independently checks grounded/loadout/resources (engine.ts578), but direct fire skips App time and modal/turn guards. Native8–10 direct-fire runs remain model actions on App frame, not full player-operation evidence. |
| Secondary fire | beginCharge may detonate ice gourd/manual dive/turn arrow before ordinary charge | Must preserve this branch; no forced launch or cooldown reset. |
| Jump | Control / jump button → App.jump → Engine.jump, main.js555–557 | App.canInput plus Engine grounded/movement/active guards. Must use current actor. |
| Drop | Alt release / drop button → App.drop → canDrop/Engine.drop, main.js558 | App.canInput, active eligible support, input cancel. No manual support/landing mutation. |
| Unit select | Tab / portrait → App.selectHero → Engine.select, main.js1182–1188 | App.canInput, alive/unacted, cancel old input and restore selected skill. Direct select is not complete App action. |
| Defend | F/button → App.defend, main.js536,845–848 | 4% HP, shield12%, focus recovery; guarded current actor. **Engine.wait differs**, including12% no-combat healing: reject as a current UI action. |
| Consumables | No current UI binding found for Engine.item | Reject in player-operation mode. Preserve old finite-item runs as Engine-only diagnostics. |
| Interact | E/context button → HonroInteractions.use, interactions.js5–21 | Existing eligibility checks distance/height/class/ritual/active/App.canInput. Use visible candidate, never set flags directly. |
| Dialogue next | Next / Enter / Space → HonroStory.next, story.js54 | Preserves staging skipMotion and receipt/disabled gates. Advance production App.frame while physical scenes run. |
| Dialogue skip | visible dialogue-skip → HonroStory.finish, main.js1133–1134 | Real UI action, but guides do not expose skip and mandatory staging/receipt semantics differ. Generic finish-every-dialogue model is NOT full reader-input proof. New adapter uses Next only. |
| Time | App.frame(now), main.js1209–1262 | Includes story tick, modal/turn pause, charge, mission, outcome and physical staging. Engine.tick+missionTick alone is model physics. |

## Historical classification

- Registered Stage1 Engine policy cohort remains a frozen finite model result (12/12, mean6.33R), not a human rate. Only the route policy has independent real-browser corroboration. Full App-operation scope must not be inferred from the cohort's source hashes alone.
- Old2–7 traces retain actual production physics/outcomes and useful strategic diagnostics. Item/wait use and duplicate generated-controller hashes are explicitly identified. `appdefend` only repairs defend semantics; it does **not** by itself change their frame/fire scope.
- Stage5 final-input driver uses actual App begin/release charge, movement intent/frame and interactions, with rendering/clock doubles. Its interactive requested stream contains rejected commands; only recorded accepted actions are the replay reference.
- Modern8–10 uses App.frame and guarded outcomes, but direct Engine fire means idealized Engine-action input, not full App charge simulation. Real UI receipts stay separate.

No new large acceptance batch should begin until the common App-operation adapter passes unsupported-method/guard tests and representative calibration. Direct actor/resource/phase/goal writes remain forbidden in every mode.

Browser calibration follow-up (41496219330): Stage5 R10 shot at near maximum range and Stage10 R5 point-blank M11 had no predicted viable shot. New controller policy permits at most three 120ms ordinary arrow-key pulses, approaching a distant declared target or retreating from one within120 units, then replans the same skill/target. Every correction records before/after. No safe plan still fails; this is a separate adaptive controller revision, not retroactive success of prior traces.

Production HUD selection prelude: productionInputActions now keeps real updateHUD, with a source-anchored early return immediately before DOM skill-button painting. Remembered/available/fallback/melee-follow selection stays exact at original call sites. Production renders before its >0.11s periodic HUD refresh, so automatic actor changes can briefly retain a stale selected skill; the regression waits natural0.12s frames, not an invented immediate reconciliation. Actual preview consumers must retain this cadence and disclose authored-observation effects. Default legacy harness is unchanged. Act1 earlier no-render simulations explicitly selected equipped skills before every launch; no actual render-preview parity is claimed.
