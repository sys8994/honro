# Act 3 authored map plan

The approved dense canal city and cutaway archive studies become production maps 23 and 22. The other eight maps are independently composed places. The ten source events remain in their original order. The setting is a large riverside walled town; mansion scale is architectural reference, not a declaration that this is the royal palace or capital.

| Stage | Place and silhouette | Physical route | Palette / sight lines |
| --- | --- | --- | --- |
| 21 | Gate, crescent outer wall, market awnings | Street rescue and refuge, stair-accessible battlements | Clear daylight; gate eaves interrupt high arcs |
| 22 | Large archive cutaway, tall central atrium | Ground → middle bridge → upper balcony | Cool pale interior, warm paper; floor slabs block cross-level shots |
| 23 | Dense canal granaries and loading walls | Continuous lower escort quay plus optional roof galleries | Green river and ochre cargo; three separated canal crossings |
| 24 | Abandoned branch-family mansion and garden | Terraced courtyards, pond bridge, shrine gallery | Broad pale walls, muted red wood, garden voids |
| 25 | Hidden rear archive and record pavilion | Interior offset stair flights and rear escape | Dark timber, narrow paper-lit openings |
| 26 | Burnt casting workshops | Broken kiln court, water race, surviving upper work floor | Charcoal, copper clay, exposed sky |
| 27 | Archive roofs above a threatened document court | Rapid access to both fire controls, continuous roof escort | Late light, orange fire context, stepped roofs |
| 28 | Outer offices and long town rampart | Long wall walk, government courts and cross-wall stairs | Stone / blue-grey, open high firing lanes |
| 29 | Night sluice and sealed river storage | Low sluice approach, upper store, open exit quay | Ink-blue water, sparse warm lanterns |
| 30 | Riverside ferry loading complex and old road | Wide grounded final escort / whole-party departure | Moonlit river, low pavilions, broad river void |

Every map uses one canonical large terrain domain around stable play bounds. Buildings contain real roof / eave / floor collision; cutaway rear walls and rear posts are explicitly non-colliding scenery. Primary routes and required objective floors must be accessible with ordinary walking / basic jumps for all four heroes. Carrier routes require continuous grounded walking. Optional upper routes are separately tested.

Marker, target, wave and gate IDs follow ACT3_RUNTIME_CONTRACT.md. Validation distinguishes isolated movement / projectile / native render evidence from actual campaign objectives, saves, victory, browser input and normal play. Map-only checks do not establish full game completion.

Source: HONRO Story Design v0.1, 26 pages, Part II B–E. Source stages 3-1 through 3-10 retain their information-release order. Stages 1–20 remain byte-equivalent in the canonical project.

## Geometry and art implementation

- Canonical stage IDs are 21–30, with `campaign: true`, Act 3 metadata and `honroAct3Revision: 1`. There is no template-13 runtime substitution. Every stage has the four normal hero records and a unique route / scene composition.
- Outdoor maps contain 9–12 primary buildings. Stage 22 is two large archive wings containing twelve distinct floors, bridges, flights and archive sections; those sections are not counted as twelve separate buildings.
- The city and archive studies are converted into stages 23 and 22. The actual three-arch bridge and open galleries use the production SVG versions. The seven later maps consume the new mansion, burnt-foundry, sluice and ferry architecture.
- All former campaign stage objects 1–20 and the existing 105 library entries remain unchanged. New asset IDs use the `a3-` prefix. Art-only skyline / support revisions preserve all thirty compiled terrain arrays.
- Buildings have colliding roofs and floors. Wall panels, rear columns, far city buildings and rear masonry supports are named rear scenery. Rear planes do not create invisible front-plane movement barriers. Structural collision polygons are authored with their visible surface or explicitly selected from the production SVG solid contract.
- The 22 stair flights and the 23 convoy ramps join their adjoining floor / bridge in one continuous collision contour. Separate coincident slab edges caused movement or head contact at apparently flush joins, particularly for the wider civilian body. The canonical unions remove those seams without changing the engine.
- Stage 23 retains a lower continuous quay for the carrier and a separately reachable western roof route. Stage 22 connects the eastern mandatory upper balcony to the optional west balcony by a higher cross-gallery; this clears the required stairwell below.
- Water uses the existing finite water-pool renderer and physics. It does not introduce flowing water, moving boats or an automatic drowning rule. The two-state gates remain the existing breakable-terrain mechanism.

## Reproducible checks and evidence boundaries

- `node tests/act3-production-maps.mjs`: canonical validation, four-body required / authored optional traversal, measured movement consumed and minimum movement-turn lower bound, marker floor exposure, and walk-only carrier routes in 23 and 27. Enemies and gates are cleared for this geometry fixture; movement budget is replenished between probe inputs. It is not normal combat completion.
- `node tests/act3-production-shots.mjs`: actual A01 shots damage every breakable objective from its authored firing marker, actual unit hits in open lanes, and real architectural collision blocks high shots. The target fixtures do not prove browser aiming controls or campaign tactics.
- `node tests/act3-map-safety.mjs`: initial-body clearance, stable play bounds inside canonical large terrain, canal-area boundary-knockback recovery and low-HP death followed by a fresh-map retry. Actual App save / retry / mission restoration belongs to the runtime regression suite.
- `node tools/environment/validate.mjs`: shared environment schema, support, depth, scale and coverage validation.
- `node --expose-gc tools/environment/capture-act3-production.mjs --stages 21,22,23,24,25,26,27,28,29,30`: shared native renderer at panorama, architectural close-up, 400px portrait and short landscape sizes. Canvas caches are released between views. The manifest records the exact project hash and whether rendering was state-pure.
- The capture supports `--runtime` and the native probes support `HONRO_RUNTIME_ROOT` for integration against the separately owned, real 21–30 runtime. This option is an explicit development input, not a stage-ID or template fallback.

Current gameplay-scope limits: normal human campaign playthrough, browser HUD / input, performance under the deployed page, and all skills / enemies on every optional roof are separate verification. Source-only map success does not establish those results.
