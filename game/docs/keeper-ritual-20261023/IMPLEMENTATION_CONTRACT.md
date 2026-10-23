# Approved keeper ritual redesign — implementation contract

User approval 2026-10-23 Sentinel_d166abe624a88191b096164ec22810a2, after ritual-image review. Parent authors all story text and image art. Code worker implements narrow approved design, does not improvise lore/dialogue.

## Inputs
- Current public base aa4b7ab, with P0 S13 fix being prepared separately. Rebase onto parent's confirmed latest master before final build.
- Keeper portrait: approved ritual variant, NOT earlier muscular armoured design. Origin generated exec-5e062d84-51a5-4674-8102-ec79cff9d5a6.png. New image matching long dark robe, black cords, bronze seal plates held at chest, small seal ring, no shoulder armour or club.
- Parent exact narrative patch 25 strings. Preserve row metadata, camera flags, scene IDs, 19/20 farewell, source of souls inside bell, ancient history undisclosed. Do not touch other user rewritten dialogue.

## Art and staging
Render same recognizable ritual silhouette in actual in-game keeper (act2-keeper), story portrait and applicable catalogue/preview, not only portrait. Match current vector game styling, concise retained paths; no raster cutout replacing moving unit unless explicitly supported by project's established renderer. Subtle idle gesture/cord tension; cast is fingers tighten, plates rotate/float, distant chains react. No big weapon swing or muscular rush. Defeated human remains alive and bound, tools lowered; no combat effects during outro/19.
Keep physical dimensions/collision unless justified and tested. Critical render must work in both directions and zoom levels; don't allocate new paths per frame. Silence/cast cues use existing sound palette/filter if feasible, no new large BGM or audio assets.

## Narrative staging locks
- 14 witness: actual suppression ability first described, not just wicked manager. Existing scene length/row identities retained.
- 16 witness: black cords cut audible pleas, deliberate responsibility. Ancient transfer records unchanged.
- 17 work note: three separately-made seal plates, not pieces removed from main bell. Display a few matching work props only if they do not change paths/objectives.
- 18 introduction: stable camera includes keeper hands/tools and nearby chain context. Never extreme closeup hiding gameplay.
- Keeper beat: weakened grip at first line; hand release after Hwigyeom's final command; actual binding in outro. Do not depict already bound while dialogue threatens to resist.
- Sodan hears trapped souls through her established ability. Do not invent named victim voice recordings; subtle muffled ambience is sufficient, not a new voiced dialogue asset requirement.
- Keep existing 18 sideways-ash/shot-disappearance witness distinct from keeper abilities. Do not explain the larger world's distortion away as his spell.

## Combat scope
A ritualist controls local space, not an HP-heavy melee tank. Implement locally scoped current authored stage18 logic, not global combat rebalance. Three readable patterns, using existing mechanic primitives where possible:
1. Sealing boundary in a limited telegraphed area, restricting shots in that area; always a walk/jump/angle alternative. No global input lock or invisible wall. Visual boundary matches collision exactly.
2. Directed echo/return through a specific plate, with explicit direction cue and cap of one return per projectile/action. Do not reflect hero-body projectiles or move the hero; avoid infinite projectile/field recursion. Damage origin/coalition/contribution and save state must remain correct. If existing primitives cannot safely support this without engine scope expansion, report that specific blocker before choosing a different mechanic.
3. Telegraph a local floor binding, give at least one actionable player opportunity before activation. No immediate unavoidable hit, no persistent movement lock across turns. Existing cleanse/bound expiry semantics respected.
Optional counters: strike a seal connection or pressure keeper at close range to interrupt/weaken briefly. Seal props must NOT become required extra enemies/objectives. No mandatory three-item kill-order puzzle. Provide ranged and melee routes. Keep current keeper HP/other encounter density unless testing finds adjustment essential; do not raise HP to fake boss presence.
No extra health bar phase, no map enlargement, no extra mandatory holding turns. Keep current short stage18 flow, existing 2-turn hold and safe bell descent, <=15 turns target with normal prepared party. Do not change defeat/capture into death or break stage19.

## State and saves
Owner-tagged stage-specific states, expire on action/turn boundaries, cleanup on defeat, restart, leave, scene transition and Continue. Existing mid-stage saves must not duplicate waves/flags or silently reset whole battle. Old saved state lacking new fields needs explicit safe initialization, not fallback to old render/controller. Keep genuine protected historical published graphs as release retention, not source code fallback.

## Acceptance
1. Mechanic boundary/telegraph/counter tests including projectile types and next turn movement; no stalling or endless spawn/lock.
2. Actual PC/mobile screenshots and real input casts/counters, initial/dialogue/defeat states; minimum3 focused QA passes + holistic. Record normal-play coverage vs fixtures honestly.
3. Exact parent text patch + hero/name/quest/knowledge progression checks. Other 661-user-text changes preserved.
4. Full relevant build/typecheck/retention, P0 S13 and NPC portrait integration regression after parent's latest SHA.
Commit/push coherent units, report source candidate SHA promptly before large evidence packaging. Parent performs final master/Pages deployment.
