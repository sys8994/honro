# Act 4 vector production — official-source authoring plan

Scope: visual production for official stages 31–40, preserving existing gameplay. 31/35 are active pilots; this audit covers the other eight chapters. This is a production plan, not an art approval or completed-play report. User direction (2026-10-28): extend the adopted skeleton → concept → actual Inkscape → protected optimization → engine pipeline across Act 4.

## Source authority and checks

- `shared/data/act4/world.json`: official stages, terrain-domain polygons, platforms, placements, actor IDs, design/initialState contracts and Act 4 library.
- `shared/build.mjs`: merges official Act 4 world into campaign when enabled by `game/config/story-release.json`; do not regenerate official data from old preview seeds.
- `shared/map/compiler.js`: `compile` produces collision from **both terrain and element assets**, and full worldTerrain separately from play projection; `createBattle` carries official state, units, water materials and design into runtime.
- `shared/runtime/act4-content.js`, `act4-campaign.js`: official lifecycle, required survival, mission, carried residents, proof and ordinary-save integration.
- `shared/runtime/act4-events.js`, `act4-coast-events.js`: authoritative interaction/state/visibility/dynamic geometry.
- `shared/runtime/act4-art.js`, `act4-coast-art.js`, `act4-maps.js`: existing shared visual hooks, runtime mobile start view and preview authoring history. These are NOT a replacement for official world JSON.
- `shared/data/act4/content.json`, `reviewed.json`: official goals and reviewed dialogue IDs.
- `game/docs/VECTOR_AUTHORING_SOP.md`, `STAGE_PRODUCTION_SOP.md`, `.agents/skills/honro-environment/SKILL.md`: mandatory production and evidence requirements.

Audit executed the actual `HonroMaps.compile` against official JSON merged with the current base library. Compiled static terrain counts (including element collision): 32=3, 33=3, 34=3, 36=1, 37=7, 38=4, 39=3, 40=2. Dynamic runtime surfaces are additional. The first attempt to use the test helper's default project alone found no Act 4 stages; explicit official JSON merge corrected that test input. No runtime files were changed; no gameplay or art approval follows from compilation.

Important official/preview differences: stage 32 door and shelter metadata are at x4784, while NPC starts x4890 and runtime observation/opening still refers to x4890; stage 34 wrong-exit target is (3100,3420). Preserve these existing contracts, do not silently align them by rewriting geometry. Old `design.act4.water/dialogue` prose on 31/35/36 is historical; runtime event implementations govern actual behavior.

## Shared production contract

1. Export each skeleton from compiled official source, including collision-bearing elements, full terrain domain, one-way lines, ceiling lower contours, actor scale, contacts and dynamic protected areas. Use overview plus representative play views; do not use old screenshots as sole geometry authority.
2. Adopt the pilots' actual accepted style plate, not only a text prompt. Korean mature dark-fantasy, overcast daylight/blue mist; large silhouettes and 2–4 major material planes. Keep existing image far backgrounds and shared water/atmosphere.
3. Author separate meaningful BODY / REAR / SURFACE / FORE assets. These labels map to existing Canvas terrain/L1 passes; they do not request new engine layers. Never trace a complete chapter screenshot and call color paths semantic assets.
4. Contact edges, overhead clearances, collision wall profiles, platform ends, docks and interaction sockets are protected. Art can shape internal faces, but may not redraw walking/collision geometry. No dummy skirts or duplicate solids outside play bounds.
5. Retain concept, raw trace and source SVG; use actual Inkscape edits. Compare optimized candidate to raw at real and maximum display sizes, with protected masks. Record paths, subpaths, commands and bytes separately. Pixel metrics select candidates only; inspect actual pixels and engine result.
6. Keep dynamic water, net state, doors, probes, gestures, boats and warnings outside cached static BODY. Existing semantic IDs are runtime selectors: replacing their art must retain ID/anchor/scale/collision behavior or provide a deliberately compatible mapping.
7. Preserve actor rosters, enemy groups, missions, physics/gravity, one-way behavior, camera policies, dialogue/event receipts and profile/save contracts. No new stage-specific gravity is called for. Stage 39 artillery has its own existing gravityScale=1 trajectory and must remain untouched.
8. Stage delivery: three distinct visual reviews (structure; playable-scale readability; camera/mobile/state), final-source integrated review and relevant real inputs. Test automation is not art approval or normal complete-play evidence.

## Reusable families and boundaries

| Family | Reuse | Constraints |
|---|---|---|
| Shore rock/earth transitions, wet lower face, erosion ledge | 31/33/34/37/38/39/40 | Shared material fragments; chapter-specific continuous BODY and exact surface remain unique. Never stamp identical polygon islands across slopes. |
| Reed tufts, bank grass, low rock foreground | 31/33/40, selected 32/37 | Grounded back variants; sparse FORE variants below feet/aim/exit visibility. Do not hide tide line or warnings. |
| Wood beam, pier foot, joint, rope | 32/33/37/39/40 | Socket/deck anchoring and real support depth; do not stretch arbitrary columns to fake contact. Preserve one-way openings. |
| Port house/shed, drying frame, skiff | 32/40 | Separate rear-building shell and props; never bake moving return boat into scenery. |
| Old wall and rubble | 32/35/36/37 | `a4:old-wall` is collision-bearing; `a4-art:rubble-wall` is not interchangeable gameplay geometry. Preserve collision IDs and profile. |
| Empty foundation/bare frame/charred frame | 36 (+ restrained 32/40 variants) | Village identity: absence of iron, not a generic crowded ruin. Preserve door pivot and empty yard. |
| Crack/anchor motif | 34/38/39/40 | Reuse visual vocabulary, not interaction identity; entry, exit and observed dynamic marks remain separate. |
| Haul footing/winch | 34/37/38/39 | Structural context only where actually supported; no invented walk route. |

## 32 — 빈 포구 (6600 × 3200)

**Contacts / IDs.** `a4-32-land` is rolling earth (surface y1900–2010). `a4-32-back-alley` is one-way wood: (1200,2010) → (1660,1760) → (2300,1760) → (2600,2000). `a4-32-prop-4` uses `a4:old-wall` at (2390,1832), scale1.15, and adds `a4-32-prop-4:collision:0`; keep its ballistic obstruction. Door `a4-32-prop-6` / `a4:door` at (4784,2010); `a4-shelter-speaker` starts (4890,2010). Required hero archer. Safe manifest `shelter-person-0..6` and report `A4.S32.MISSING.01` are mission proof, not decorative crowds.

**Art.** BODY: connected quay earth/courtyard foundation. REAR: port sheds at 950/3030, houses at1900/5000, drying frames and grounded skiffs. SURFACE: exact alley boards with separately authored supporting piers; legible courtyard to door and x6200 exit. FORE: sparse broken pottery/low grass only, keeping reunion actors unobscured. INTERACT: separate hinged door; do not embed it in the house SVG.

**Must-test inputs.** Walk/jump upper alley versus lower street; shot blocked by wall versus clear angle. After enemies clear, approach door, select archer and observe NPC walk to x4770, reunion and missing-four report. Offscreen/pan-away must not fabricate receipts; replay missing report if skipped; E and UI tap once; save/reload during door/reunion. Keep all living party beyond exit threshold. No tide mechanic here.

## 33 — 물 빠진 갯길 (7600 × 3400)

**Contacts / IDs.** `a4-33-land` has two low tidal channels. `a4-33-upper-west` spans x900–3050 (tops around1930–2010); `a4-33-upper-east` x3100–5300 (tops1890–2030), both one-way. Conductive shallow materials `a4-33-west-channel`, `a4-33-east-channel` remain. Tide low2280/high2135; warning configured round2, nominal high5/low7 but runtime adjusts to preserve action opportunities. Recovery zones `33-west` x900–2900 and `33-east`3100–5200 return to declared same-entry-side dry banks.

**Art.** BODY: unique continuous exposed mud/rock basins. REAR: stranded skiff family, sparse stone anchors, reeds on true banks. SURFACE: distinctly raised refuge ledges/pier timber without painting false bridges across the gap or erasing one-way underside clearance. FORE: low channel edge fragments. FX: live tide/wet edge stays dynamic, not baked into raster concept or SVG.

**Must-test inputs.** Normal low-route travel; climb/jump both upper refuges; advance turns through rising/high/low and observe tide + upper route. Drop into high water from both sides: 25% maxHP recovery damage, action spent, MP preserved, same-side dry landing; occupied recovery bank waits rather than teleports to opposite/high bank. Real aim/fire from high and low paths; visibility of warning at mobile zoom. Exit x7100 with living party grounded.

## 34 — 파도에 깎인 절벽 (7600 × 6200)

**Contacts / IDs.** `a4-34-land` rises from y5100 to2200. `a4-34-natural-overhang` is solid ceiling (lower edge across x0–3400, y4000→3500), not backdrop; leave its underpass and ballistic clearance. `a4-34-return-cut` is one-way (3700,3570)–(3900,3570). Optional wrong-exit actor `a4-34-g0-1`: entry(2520,4329), exit(3100,3420). `34-shore` recover x0–1050 at5350; `34-open-sea` lethal x7100–7600 at5800.

**Art.** BODY: chapter-specific tall marine cliff plus overhang mass as separately editable connected geology. REAR: broad strata/erosion and limited grounded dead pine; no mesh-like repeated triangles. SURFACE: climbing route edge, overhang top/underside and tiny return-cut distinctly legible. FORE: sparse lip accents not hiding platforms. INTERACT: paired crack artworks must remain recognizable at their different heights.

**Must-test inputs.** Climb each steep transition using actual move/jump; descend/land on return-cut; shoot below overhang and compare roof blocking. Pan/zoom from bottom to summit on mobile without exposing empty body edges. Observe optional actor enter/emerge; killing that actor early must not become a new mission lock. Shore recovery versus open-sea lethal boundary remains. Exit x7200 grounded party.

## 36 — 쇠가 없는 마을 (7200 × 3100)

**Contacts / IDs.** Single `a4-36-land`: entrance1800, hollow2040 at x3090–4200, exit1800. No extra collision for village ruins or door. Dynamic `a4-36-door-4` / `a4:door` is (2460,2013.846), scale1; interaction checks knight within220 of x2370. Required knight; elite `a4-36-g0-0` carries `honroAct4RewardTag: eq-hw-36` → `eq_hw_t3b`. Preserve `A4.S36.DOOR.01/.02` receipts.

**Art.** BODY: worn village earth/stone basin, not random rock platforms. REAR: bare doorframe1520, home-ruin2570, charred frames4550/5740 and empty foundation3540; negative spaces tell the location. SURFACE: quiet uninterrupted yard and door footing. FORE: isolated rubble margins and fallen bamboo (reuse35), not dense combat occlusion. INTERACT: pivoted door authored independently so standing/falling/fallen all remain coherent.

**Must-test inputs.** Fight first two enemies, retain elite reward. Knight approach/E triggers door, observe fall plus break audio then quiet delay (not offscreen timer only); skipped/missing door rows can be requested again. Walk to x6100 for leave and party beyond6500 for exit. Mobile initial overview has special startCamera; move/aim resumes normal follow. Save/reload during falling and after fall; no extra doorway collision introduced.

## 37 — 곶의 뒤편 (7800 × 4300)

**Contacts / IDs.** `a4-37-land` rises3200→2200 with an eastern dip. One-way `a4-37-haul-ramp` x1800–3400 and `a4-37-broken-wall` x5100–6000. Four `a4:old-wall` instances `a4-37-prop-0..3` each add solid collision at x1400/2750/3800/5500. Signal design(7500,1780), backgroundOnly:true; `a4-coast:signal-outcrop` at(7500,2200) supports its visual identity but does not imply new playable ledge.

**Art.** BODY: unique cape ridge and depression. REAR: sparse haul winches/footings, ruined wall bodies, fallen bamboo and contextual distant sea. SURFACE: preserve haul-ramp/wall top lines and wall silhouettes; differentiate routes from scenic signal outcrop. FORE: sparse grass/stone at safe margins. INTERACT: distant gesture silhouette and signal are live observed state, not painted human figures.

**Must-test inputs.** Move/jump both ramps and wall obstacles, aim along and over wall cover; descend eastern dip then regain ridge. From beyond x5900 actually observe unobscured signal/gesture for0.6s; ensure mobile normal follow can reveal it without artificial camera relocation. Panning away does not earn receipt. Finish signal rows, grounded party to x7300 exit threshold; no new climb requirement to signal outcrop.

## 38 — 어긋난 해식굴 (7200 × 4400)

**Contacts / IDs.** Solids: `a4-38-land`, `a4-38-east`, `a4-38-cavern-roof`, `a4-38-emergency-ledges`. Emergency route runs (3200,3050)→(3440,3230)→(3670,3210)→(3800,3140)→(4060,2940)→(4300,2790)→(4550,2600). It must remain physically visible/usable, not a fatal void. Connection entry(3180,3050), destination(4520,2600), return(2980,3050); zero MP cost, stage-only and not permanent skill. `a4-rescue-0..3`, fourth=도식, and pursuers `a4-38-pursuer-0/1` remain. `38-low-water` recovery x3300–4300, surface3330.

**Art.** BODY: separate ceiling/west/east/emergency-rock pieces with coherent cave geology; all gaps and headroom protected. REAR: restrained cavern wall and crack pair, water behind low route. SURFACE: emergency stepping terrain and both connection landing sockets. FORE: no stalactite/rock across living actors or probe. INTERACT: probe object, incorrect-return phase and fixed-connection mark remain live; static crack motif is reusable34/39.

**Must-test inputs.** Cave approach/roof blocked shot; actual emergency route traversal even without mage; observe residents and pursuer motion in vista, Escape restores follow. At entry E probe→observe wrong return→mage E anchoring→connection traversal. Save/reload each phase, no free MP refill; occupied destination does not overlap actor. Any resident death fails. Exit x6700 with party grounded, physical-route alternative remains valid.

## 39 — 돌아오는 물 (9000 × 4600)

**Contacts / IDs.** `a4-39-land`, one-way `a4-39-west-upper` x1450–4600 and `a4-39-east-upper`4600–6000. Boss `a4-wreck` at(3500,2571.43), aquatic, fixed, radius520,height390, HP7800; killing boss is **not required**. Rescue `a4-rescue-0..3`; net(5470,2000), anchor(6130,2000); safeX6900/7050/7200/7350 on y1700, safeZone x6600–8000/y1600–1760. Preserve recovery-bank/enemy-exclusion bounds. Tide2610→2050; recover x1700–4450, lethal channel x8250–9000/surface3400.

**Art.** BODY: broad tidal wreck basin, east rescue slope/high refuge. REAR: structural pier supports without filling underpasses; wreck visual stays bound to boss, not generic abandoned-skiff clone. SURFACE: both elevated paths, low work area, exact rescue ramp and occupancy-clear high ground. FORE: no net/anchor/hand/shot-marker occlusion. INTERACT: detachable net `a4-coast:net`, crack/anchor, live artillery warning, actual residents and helping-hand remain separate.

**Must-test inputs.** Travel and shoot during tide warning; observe artillery warning then real projectile resolves. E anchor/net with mage/occultist and other valid heroes at existing ranges; interrupt by moving/actor change, no false completion. Four NPCs actually walk after both actions; blocked route/occupied safe ground cannot auto-complete; airborne arrival is not grounded safety. Boss killed early still requires rescue; boss alive rescue possible. Optional hand near x6570–6740 remains visible. Escape with all residents safe and party beyond8240; save/reload carries facts and residents into40.

## 40 — 돌아가는 배 (6200 × 3200)

**Contacts / IDs.** `a4-40-land` inlet x2850–4950; `a4-40-high-walk` one-way x2810–5100 at y1720–1790. Runtime adds `a4-return-boarding` (2820,1950,w180), moving `a4-return-deck`(boatX−180,1950,w360), later `a4-return-gangway`(4820,1950)→(4980,1916). Boat origin(3100,2010), destinationX4660. Four carried residents: first2 boat, last2 high route. `40-return-inlet` recover x2890–4910, surface2050. End proof requires stage32 safeSeven + stage39 rescued IDs/run linkage: total13/living11/priorDeaths2.

**Art.** BODY: shore inlet and far landing rise. REAR: port-house/workshop family, exact pier supports. SURFACE: high walk, embarkation and destination sockets, separate gangway art matched to its late appearance. FORE: sparse wet banks without hiding boarding feet. INTERACT: boat remains independent movable asset with its original anchor and deck; passengers are real actors; final small-dislocation mark stays dynamic. Do not paint residents or boat into static concept.

**Must-test inputs.** Clear entrance combat; observe boat/high route and approach to start boarding. Watch two residents embark and sail while two climb high route; hold/occupy destination to verify no overlaps; landed gangway and all four grounded safe positions visible. Continue mid-sailing preserves boat/passenger offsets. Check reunion→thirteen→next, no false roster without official32/39 proofs. Party beyond5300 + E finishes to normal safe rest. Camera mobile/zoom must show both route choices and no fake floor over inlet.

## Work sequence and evidence

Finish 31/35 pilot asset/renderer contracts before bulk integration. Then create reusable coast wood/rock/ruin families and stage-specific production cards in dependency order: 32→33→34→36→37→38→39→40. Concepts may be prepared separately, but each stage is assembled and inspected against its own contacts and current source. Never substitute batch generation or identical stretched BODY for stage-specific geology.

For each stage record: source SHA/changed files; official static/dynamic geometry fingerprint; reference/concept lineage; raw/optimized SVG hashes; protected contact masks; asset origin/support/socket metadata; command/subpath/byte counts; three distinct actual views and final review; real input cases passed/failed/not run; commit/push/master/Pages verification separately. Art direction and final runtime pixels require direct visual review, not automatically assigned approval flags.
