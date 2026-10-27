# Chapter 15 reviewed binding · Phase B

This private candidate binds the 25 rows from `v4-review/HONRO-CH15-parent-final.json` without changing their IDs, speakers, conditions, or text. `shared/data/reviewed/act23-v4-ch15.json` retains that manuscript and adds `revision: 1`. The chapter requires both Phase A and the explicit chapter-15 Phase B switch; its map revision is **515**. Normal and Phase A-only builds keep their previous presentation.

The runtime owns the chapter-specific observations in `act23v4.reviewedChapter.physical`. The shared reviewed bridge owns the exact row whitelist, living speakers, event acknowledgements, saved row cursors, optional rest filtering, and reviewed objective presentation. Existing physical ownership stays with `act23-v4-act2-scenes.js` / `act23-v4-act2.js`: wheel death, water drainage, safe ledge activation, route A/B receipt, the force field and three finite knock events.

| Reviewed rows | Actual guard / presentation |
| --- | --- |
| Arrival | Existing wheel and water; two broken pulley remains on existing supported surfaces. Arrival framing includes the low wheel and the nearby remains. |
| INTRO.01–02 | The living low wheel has visibly rotated at least 0.06 radians and a hero has approached its view. The wheel's possession ring uses the saved rotation; the existing wheel actor remains the combat target. |
| INTRO.03, CHOICE.01 | Hero reaches the sluice approach and the existing dry shoulder is visible. The opening wheel observation finishes first. |
| UI_CHOICE.01–02 | Exact approved labels on actual sluice / upper-route navigation targets. The player still chooses by traversing the physical route. |
| BRANCH.01 | First eligible low-sluice interaction, after the wheel is stopped and the local approach is clear. Dialogue precedes drainage; another interaction operates the sluice. A saved line is suppressed if water has already drained. |
| BRANCH.02 | Archer actually stands on an existing upper support; a production projectile collision ray toward a living lower enemy hits real terrain. The guard rechecks that ray and the archer's current position on resume. Merely setting a route flag is insufficient. |
| MID.01–02 | First and repeated visible droplet passes in the existing fixed field. The field remains `ax: 36`, zone `(5600,3300,1500,1300)`. |
| POPUP.01 | The droplet observation exists and the fixed force is active. The existing Engine predictor and live projectile integrator share that force. |
| MID.03 | A living archer's actual visible production arrow preview crosses the force zone. Hidden `collect=false` probes, another actor's preview, body skills, martial skills, and stakes cannot create this arrow observation. A shot is optional. |
| MID.04 | Exactly two newly created, living `ghost` units from `reviewed.15.merge-pair`, admitted above the real basin. Existing enemy counts cannot satisfy it. The shared atomic spawn placement and population cap apply; occupied entries defer the whole pair, including after Continue. |
| MID.05 | Both admitted spirits are dead and actual local merge threats are clear. Remote and unchosen-route enemies stay optional. |
| MID.06–07 | First real metal knock, then repeated knocks from the deeper eastward hollow. The second source is below the existing bed; no civilian, words, living-survivor inference, or invented rescue target is added. |
| COMPLETE.01 | All three saved knock events have occurred; the deep-direction reaction is acknowledged and the party is at the merge approach. |
| COMPLETE.02 | Actual approach to the chosen exit after the temple-direction scene. Existing A/B receipt generation is preserved. |
| JOURNAL.01 | After the deep knocks / temple scene, with repeated droplet observation and either a visible non-body/non-martial production projectile preview or an actual projectile observed in the field. Saved exactly once. Without projectile observation, the exact journal is withheld, `journalWithheld.reason = projectile-not-observed` is saved in the battle and outcome history, and chapter completion remains available. |
| OBJECTIVE.01 | Exact reviewed objective through the shared presentation bridge. |
| Optional archer / mage / occultist | Exact reviewed text through the shared recruited / actual living speaker and cursor guards. |
| Optional knight | Additionally requires this run's actual observation of the existing crown return bridge, the lower ledge still inactive, and the current water surface above that lower platform. A stored bridge observation alone never permits the line after drainage. |

The current initial roster remains **22 enemies**, with the existing four-actor action cap. The finite two-spirit response is chapter-owned; no legacy wave source is reintroduced. Terrain geometry, water renderer, skill costs, damage, party membership, growth, and other chapters are unchanged.

`node tests/act23-v4-reviewed15.mjs` passes using the production App, Story, compiler, Engine, and save/load paths. It checks exact equality with all 25 source rows; the wheel, upper ray, both complete A/B routes; real prediction/fire terminal agreement (endpoint error **0**); atomic two-spirit admission and occupied-entry deferral; Continue before/after admission and during the first knock; one exact journal; living speaker and stale rest-cursor filtering; no-preview/no-shot completion; completion with a dead archer; and a mage preview that permits the factual journal without creating an arrow line. No-shot completion saves the withholding reason and requires no optional skill/class action.

Focused model evidence is `_local/reports/act23-v4-reviewed15/summary.json`. Supported positions and combat deaths in that test are explicit fixtures; its DOM, audio-device output, and rendering are doubles.

## Actual Chromium acceptance · 2026-10-27

`python3 tools/testing/act23-v4-reviewed15-browser.py` passes against the parent's shared immutable private build at `http://127.0.0.1:8768/HONRO.html`, using real Chromium, DOM, Canvas, Enter controls, and localStorage page reloads. The script does not rebuild or edit the generated candidate. The chapter runtime SHA-256 is `372f865131afed1de10bfbc48166a7672b703f71a3fa5a3367e726f703e68a6b`; the capture manifest also records the parent checkout's HEAD. No runtime correction was needed during this visual check.

The actual Canvas aim guide creates the field-crossing preview observation. A real A01 launch subsequently receives the same force and reaches the predicted collision with endpoint error **0**. Two actual new ghost IDs and the unit count survive a full browser reload without duplication. The middle second-wheel line, repeated-droplet line, spirit-pair line, and first-knock line resume with their reviewed text and cursor. The knock count remains three and the exact journal is written once. The lower route produces the existing A receipt.

The actual optional knight button first opens the approved flood line after the bridge observation. Its interrupted rest cursor remains saved while the suspended battle proceeds through the actual sluice interaction and drainage. On returning to rest, that old line is suppressed, its cursor clears, and the knight button is disabled. This check uses the real generated rest dialogue and storage path, rather than a fabricated optional line.

Evidence and captures are in `_local/reports/act23-v4/reviewed15-browser/`; `capture.json` contains every row, camera/viewport/water state, wheel animation evidence, prediction/impact result, pair IDs, saved optional cursor, and page errors (**none**). The following distinct inspections were opened and viewed:

| Inspection | Viewed captures and findings |
| --- | --- |
| Structure and supported facts | `01-arrival-wheel-pulley`, `02-wheel-live`, `02b-wheel-motion`, `04-return-bridge-blocked-ray`, `05-flooded-lower-platform`: the wheel, broken pulley, upper return shelf and lower basin are visible on existing supports. Two real Canvas rasters of the same wheel row differ as visual time advances. The upper view shows the real rock that blocks the lower firing line. |
| Detail and cause/effect | `08-production-preview-field`, `09-real-shot-field`, `10-first-droplets`, `11-shared-force-guide`, `12-two-real-spirits`: the dotted arrow preview, small droplet bias, live shot, nearby broken transport remains, and both newly admitted spirits are identifiable. |
| Mobile and changed states | `05b-mobile-flooded-platform`, `13-two-real-spirits-mobile`, `14-mobile-drained-postknock`, `15b-mobile-drained-platform`, plus `07-stale-knight-suppressed`: 390×844 controls and reviewed text remain readable; both spirits are visible; the basin water lowers below the revealed ledge; the stale flood conversation is unavailable. An initial mobile pair capture was taken during the common reinforcement camera's 1.5-second wide insert. The final capture waits for that normal insert to return and shows both spirits clearly; no camera source change was required. |
| Final overall source | `16-final-overall-inspection`, `17-lower-exit`: the final drained state and existing arch/floor connections remain coherent, and the reviewed departure line frames the lower exit. The wide overview uses an explicit QA inspection camera. |

Hero placement, combat deaths, and inspection cameras are declared fixtures. Simulation is stepped explicitly while real visual rendering/animation continues. This is scoped browser/visual acceptance of the changed chapter facts and presentation; it is not a continuous normal-input full playthrough, an audio-device listening check, or a public deployment record. Commit, master integration, and deployment remain with the coordinating parent.
