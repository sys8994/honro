# 배경 공간 분류 목록

자동 생성: `node tools/environment/inventory.mjs`. 수치와 모드는 `shared/map/environment.js`의 registry를 참조한다.

| Asset | 기준 높이(m) | 역할 | 접지 | 사용 깊이 | 묶음 / 수직 모드 / 구역 | 대기 표현 / 렌더링 |
| --- | ---: | --- | --- | --- | --- | --- |
| rock_small | 2 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| rock_large | 2 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| rock_ledge | 2 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| ancient_pine | 8 | tree | 지형/지지면 필수 | L2 | landscape-L2 / WORLD / landscape | static / cached-vector |
| dead_pine | 7.2 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| branch_thick | 2 | branch | 풍경/하늘 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| grass_tuft | 0.7 | vegetation | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| fern | 0.7 | vegetation | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| reed | 0.7 | vegetation | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| shrine_gate | 4.5 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| hut | 4.5 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| warehouse | 4.5 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| cart | 1.5 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| lantern | 1.5 | light | 지형/지지면 필수 | L2 | valley-bottom-L2 / WORLD / valley-bottom | glow / cached-vector |
| grave_post | 1.5 | prop | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| env:ridge | 20 | ridge | 풍경/하늘 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| env:cliff | 20 | cliff | 풍경/하늘 | L3 | slope-L3, valley-bottom-L3, upper-ridge-L3 / WORLD / slope, valley-bottom, upper-ridge | static / cached-vector |
| env:cloud | 9 | cloud | 풍경/하늘 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| builtin:ancientPine | 9 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:scree | 4 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:fernPatch | 4 | vegetation | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:rockPile | 4 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| builtin:giantPine | 9 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:fallenTree | 9 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:spiritKnot | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:oldGate | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:ravinePine | 9 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:funeralGate | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:reedBank | 4 | vegetation | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:ferry | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:brokenDock | 5 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:waterShrine | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:cargoScaffold | 5 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:warehouse | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:oldHall | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:refugeeCarts | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:villageWall | 5 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:cliffFace | 10 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:burnedHouses | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:watchtower | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:waterfall | 15 | waterfall | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | flow / cached-body/live-flow |
| builtin:receiverStone | 4 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:cliffShrine | 10 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:deadPines | 9 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:brokenBridge | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:bridgePillar | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:bell | 4 | light | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | glow / cached-vector |
| builtin:greatTree | 24 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:rootHut | 4 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:hollowRoot | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:rootShrine | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:gravePosts | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:bierRest | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:incenseYard | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:royalGate | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:ritualDais | 4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:upperShrine | 5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| env:forest | 12 | forest | 풍경/하늘 | L3 | landscape-L3, slope-L3, valley-bottom-L3 / WORLD / landscape, slope, valley-bottom | static / cached-vector |
| env:rock | 3.5 | rock | 지형/지지면 필수 | L2 | slope-L2, valley-bottom-L2 / WORLD / slope, valley-bottom | static / cached-vector |
| env:shrine | 6 | building | 지형/지지면 필수 | L3 | slope-L3, valley-bottom-L3 / WORLD / slope, valley-bottom | static / cached-vector |
| env:waterfall | 18 | waterfall | 지형/지지면 필수 | L2 | slope-L2, valley-bottom-L2 / WORLD / slope, valley-bottom | flow / cached-body/live-flow |
| mockup-granite-large | 2 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| mockup-granite-small | 2 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| mockup-granite-shelf | 2 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| builtin:placeDetail | 5 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:cave-house | 3.5 | building | 지형/지지면 필수 | L1, L2 | , a2-scene-14-upper-homes, a2-scene-14-market-hamlet, a2-scene-14-lower-homes / WORLD / world,  | static / cached-vector |
| act2:cave-house-lean | 3.2 | building | 지형/지지면 필수 | L1, L2 | , a2-scene-14-upper-homes, a2-scene-14-market-hamlet, a2-scene-14-lower-homes / WORLD / world,  | static / cached-vector |
| act2:cave-house-ruin | 3.3 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| act2:temple | 5.2 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| act2:bell | 15.5 | light | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | glow / cached-vector |
| act2:hoist-frame | 5.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:lamp | 1.4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:ritual | 2 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:timber-rack | 2.8 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:mine-rail | 0.65 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:water-trough | 1.4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:memorial | 2.2 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:bundles | 1.5 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:rock-column | 10 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| act2:hanging-cloth | 2.4 | prop | 지형/지지면 필수 | L1, L2 | , a2-scene-14-upper-homes, a2-scene-14-market-hamlet / WORLD / world,  | static / cached-vector |
| act2:stone-table | 1.4 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:old-soul-stone | 8.5 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:rock-bank | 2 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| act2:pine | 12 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:sluice | 6.133333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:scene-longhouse | 5.366666666666666 | building | 지형/지지면 필수 | L1, L2 | , a2-scene-14-market-hamlet / WORLD / world,  | static / cached-vector |
| act2:scene-market-awning | 3.9833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:scene-temple-corridor | 5.8 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| act2:scene-stone-threshold | 16.333333333333332 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:scene-work-shelter | 5.7 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:scene-market-walkway | 10.833333333333334 | building | 지형/지지면 필수 | L2 | a2-scene-14-market-hamlet / WORLD / 미사용 | static / cached-vector |
| act2:scene-upper-stair | 10.833333333333334 | building | 지형/지지면 필수 | L2 | a2-scene-14-upper-homes, a2-scene-14-lower-homes / WORLD / 미사용 | static / cached-vector |
| act2:scene-court-wall | 4.116666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| act1-scene:pine-grove | 12.8 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| act1-scene:ritual-grove | 11.2 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| act1-scene:valley-granite | 9.8 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:ferry-house | 5.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:refuge-gate | 7.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:refuge-courtyard | 5.6 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:bridge-abutment | 5.8 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:ruined-court | 6.8 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:root-sanctuary | 45.6 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:ritual-hall | 8 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:rooted-sacred | 11.2 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:rooted-pine | 12.8 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:wall-stair | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:gate-wall-walk | 2.183333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-ground-west | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-ground-east | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-middle-west | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-middle-atrium | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-middle-east | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-upper-west | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-upper-east | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-upper-atrium | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-1 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-2 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-3 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-4 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-6 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-7 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-8 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-10 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-11 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-shelf-12 | 4.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-bundle-cabinet | 3.6666666666666665 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-scrolls | 12 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:merged-archive-west-stairs | 8.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:merged-archive-east-stairs | 8.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-attic-gallery | 2.183333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:attic-rear-piers | 9.666666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:entry-record-wall | 14 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean-town-21-L3-bank | 23.333333333333332 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-0 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-0 | 2.3666666666666667 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-1 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-2 | 4.75 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-2 | 2.3666666666666667 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-3 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-3 | 1.7666666666666666 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-4 | 5.283333333333333 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-5 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-5 | 1.7666666666666666 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-6 | 6.366666666666666 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-6 | 2.3666666666666667 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-7 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-8 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-8 | 2.3666666666666667 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-9 | 4.75 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-9 | 1.7666666666666666 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-10 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-11 | 5.283333333333333 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-11 | 1.7666666666666666 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-12 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-12 | 2.3666666666666667 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-13 | 6.366666666666666 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-14 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-14 | 2.3666666666666667 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-house-15 | 4.25 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L3-wall-15 | 1.7666666666666666 | building | 지형/지지면 필수 | L3 | a3-korean-town-21-L3 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-bank | 23.333333333333332 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-0 | 4.25 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-0 | 2.3666666666666667 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-1 | 4.25 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-2 | 4.75 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-2 | 2.3666666666666667 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-3 | 4.25 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-3 | 1.7666666666666666 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-4 | 5.283333333333333 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-5 | 4.25 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-5 | 1.7666666666666666 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-6 | 6.366666666666666 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-6 | 2.3666666666666667 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-7 | 4.25 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-8 | 4.25 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-8 | 2.3666666666666667 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-9 | 4.75 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-9 | 1.7666666666666666 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-10 | 4.25 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-11 | 5.283333333333333 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-11 | 1.7666666666666666 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-house-12 | 4.25 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean-town-21-L2-wall-12 | 2.3666666666666667 | building | 지형/지지면 필수 | L2 | a3-korean-town-21-L2 / WORLD / act3-world | static / cached-vector |
| a3-korean:21:entry-shop | 4.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:cloth-yard | 4.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:west-gate-wing | 6.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:east-gate-wing | 6.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:tea-market | 4.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:east-stables | 5.283333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:office-porch | 6.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:east-watch | 4.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:gate-tower | 14 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:stair-retaining-wall | 12.166666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:market-roof-stair | 2.7333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:korean-street-wall-0 | 1.9666666666666666 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:korean-street-wall-1 | 1.9666666666666666 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:21:korean-street-wall-2 | 1.9666666666666666 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:22:archive-rear | 21.583333333333332 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:22:archive-west-roof | 6.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-korean:22:archive-east-roof | 6.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:23:west-stone-loading-bridge | 2.6666666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:23:east-stone-loading-bridge | 2.6666666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:23:western-vault-wall | 8.666666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:eastern-vault-wall | 9.166666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:loading-bay-0 | 8.166666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:loading-bay-1 | 8.166666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:loading-bay-2 | 8.166666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:loading-bay-3 | 8.166666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:loading-bay-4 | 8.166666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:canal-maintenance-ledge | 0.6666666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:23:canal-maintenance-access | 2 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:23:canal-bridge-bearing-piers | 10.166666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:23:west-masonry-water-arch | 7.133333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:east-masonry-water-arch | 7.3 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:23:sluice-arches-and-loading-ports | 10.333333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:24:empty-servants-house | 4.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:24:family-main-hall | 6.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:24:family-shrine-hall | 6.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:24:abandoned-study | 4.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:24:wall-0 | 2.0166666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:24:wall-1 | 2.0166666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:24:wall-2 | 2.0166666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:25:low-west-stone-passage | 10 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:25:record-chamber-rear | 8.333333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:25:low-east-stone-passage | 10 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:25:low-jaesil-entry | 4.25 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:25:hidden-records-0 | 3.1333333333333333 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:25:hidden-records-1 | 3.1333333333333333 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:25:visible-earth-roots | 6.5 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:25:record-room-oil-lamps | 3.8333333333333335 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:25:record-chamber-retaining-masonry | 11 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:28:old-courier-record-shed | 5.283333333333333 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:28:blocked-road-watch | 5.033333333333333 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:28:blockade-road-embankments | 16.666666666666668 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:29:under-sluice-inspection-bridge | 2.6666666666666665 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:29:sealed-understore-rear | 8.039007092198585 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:29:sealed-archive-chest | 3.0833333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:29:single-sluice-pavilion | 5.033333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:29:upper-sluice-road | 0.6666666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:29:real-sluice-rear-piers | 18.333333333333332 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:30:last-ferry-gangway | 3.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:30:far-town-0 | 4.25 | building | 지형/지지면 필수 | L3 | a3-place-L3 / WORLD / act3-world | static / cached-vector |
| a3-location:30:far-town-1 | 6.366666666666666 | building | 지형/지지면 필수 | L3 | a3-place-L3 / WORLD / act3-world | static / cached-vector |
| a3-location:30:far-town-2 | 4.25 | building | 지형/지지면 필수 | L3 | a3-place-L3 / WORLD / act3-world | static / cached-vector |
| a3-location:30:far-town-3 | 5.283333333333333 | building | 지형/지지면 필수 | L3 | a3-place-L3 / WORLD / act3-world | static / cached-vector |
| a3-location:30:small-ferry-shelter | 5.283333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:30:river-boatkeeper-house | 4.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:30:moored-ferry-boats | 4 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:21:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:21:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:21:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:21:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:21:pine-art-0 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:21:pine-art-1 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:21:pine-art-2 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:22:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:22:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:22:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:22:pine-art-0 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:22:pine-art-1 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:23:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:23:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:23:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:23:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:23:ground-vignette-3 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:ground-vignette-3 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:pine-art-0 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:pine-art-1 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:pine-art-2 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:pine-art-3 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:pine-art-4 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:24:broken-garden-boundary | 17.5 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:25:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:25:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:25:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:25:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:25:ground-vignette-3 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:25:pine-art-0 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:25:pine-art-1 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:25:pine-art-2 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:ground-vignette-3 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:ground-vignette-4 | 2.9166666666666665 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:pine-art-0 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:pine-art-1 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:pine-art-2 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:pine-art-3 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:pine-art-4 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:pine-art-5 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:pine-art-6 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:pine-art-7 | 8.333333333333334 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:28:broken-garden-boundary | 17.5 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-refine:29:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:29:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:29:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:29:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:29:ground-vignette-3 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:29:pine-art-0 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:29:pine-art-1 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:29:pine-art-2 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:29:pine-art-3 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:ground-vignette-3 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:ground-vignette-4 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:pine-art-0 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:pine-art-1 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:pine-art-2 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:pine-art-3 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:30:pine-art-4 | 8.333333333333334 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act1-scene:guardian-tree | 27.6 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:25:continuous-masonry-waterline | 293.3333333333333 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:small-tally-office | 6 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:entry-lamp | 8.833333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:stone-quay-0 | 53.46666666666667 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:great-sealed-store | 11.25 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:final-seal-lamp | 8.833333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:stone-quay-1 | 53.46666666666667 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:broken-haulway-0 | 2.25 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:family-bundle-17 | 4.416666666666667 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:25:family-bundle-18 | 4.416666666666667 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:26:water-work-bridge | 2.8333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:26:far-ridge | 309.8333333333333 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:26:burnt-casting-house | 5.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:26:artisan-home | 4.25 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:26:tool-shed | 5.283333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:26:open-air-casting-tools | 6 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:26:optional-shooting-bank | 3 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:26:drying-gallery-timber-supports | 5.666666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:26:foundry-kiln-cooling-and-metal-zones | 9.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:ground-vignette-3 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:ground-vignette-4 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:burnt-trunk-0 | 3.08 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:burnt-trunk-1 | 2.1791666666666667 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:burnt-trunk-2 | 2.9233333333333333 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:26:burnt-trunk-3 | 3.1975 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:26:burial-record-room-rear | 7 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:26:ancestor-records | 2.9 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:26:record-room-lamp | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:27:continuous-masonry-waterline | 303.3333333333333 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:small-tally-office | 6 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:entry-lamp | 8.833333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:stone-quay-0 | 53.46666666666667 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:abandoned-loading-shed | 7.5 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:loading-oil-lamp | 8.833333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:stone-quay-1 | 56.8 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:household-inspection-dais | 5.5 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:inspection-lamp | 8.833333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:stone-quay-2 | 50.13333333333333 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:great-sealed-store | 13.666666666666666 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:final-seal-lamp | 8.833333333333334 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:stone-quay-3 | 53.46666666666667 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:broken-haulway-0 | 2.25 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:broken-haulway-1 | 2.25 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:broken-haulway-2 | 2.25 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:numbered-family-bundle | 4.416666666666667 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:sunk-family-tools | 4.416666666666667 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-waterworks:27:manifest-bundle | 4.416666666666667 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:27:far-ridge | 309.8333333333333 | building | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| a3-location:27:far-town-0 | 4.25 | building | 지형/지지면 필수 | L3 | a3-place-L3 / WORLD / act3-world | static / cached-vector |
| a3-location:27:far-town-1 | 6.366666666666666 | building | 지형/지지면 필수 | L3 | a3-place-L3 / WORLD / act3-world | static / cached-vector |
| a3-location:27:far-town-2 | 4.25 | building | 지형/지지면 필수 | L3 | a3-place-L3 / WORLD / act3-world | static / cached-vector |
| a3-location:27:far-town-3 | 5.283333333333333 | building | 지형/지지면 필수 | L3 | a3-place-L3 / WORLD / act3-world | static / cached-vector |
| a3-location:27:west-fire-gallery | 6.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:27:central-petition-hall | 6.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:27:east-water-control | 5.033333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:27:burnt-corridor-supports | 14.666666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-location:27:charred-door-frames-and-archive-bays | 14.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:27:weathered-ground-washes | 11.666666666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:27:ground-vignette-0 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:27:ground-vignette-1 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:27:ground-vignette-2 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:27:ground-vignette-3 | 2.9166666666666665 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:27:burnt-trunk-0 | 3.08 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:27:burnt-trunk-1 | 2.6100000000000003 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-refine:27:burnt-trunk-2 | 2.9625 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:separate-decisions-0 | 2.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:separate-decisions-1 | 2.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:court-wall-0 | 3.35 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:court-wall-1 | 3.35 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:court-wall-2 | 2.2666666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:court-wall-3 | 2.2666666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:petition-courtyard-store | 5.283333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:salvaged-paper-0 | 1.8666666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:salvaged-paper-1 | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:salvaged-paper-2 | 1.5833333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:court-charred-papers-and-beams | 2.3333333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:28:court-record-lamp | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:23:surface-granary-0 | 5.283333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:23:surface-granary-1 | 5.283333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks:23:surface-granary-2 | 5.283333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:vertical-depot-shell | 496.6666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:masonry-vault | 11.7 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-0 | 36.583333333333336 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-lamp-0 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:haul-number-0 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-1 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-lamp-1 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:haul-number-1 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-2 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-lamp-2 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:haul-number-2 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-3 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-lamp-3 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:haul-number-3 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-4 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-lamp-4 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:haul-number-4 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-5 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-lamp-5 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:haul-number-5 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-6 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:gallery-lamp-6 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:haul-number-6 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:west-maintenance-stairs | 10.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:inspection-room-roof | 2.033333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:inspection-room-east-wall | 2.3666666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:maintenance-recess | 5.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:west-lookout-roof | 2.033333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:west-lookout-wall | 11.033333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:west-lookout-recess | 9 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:upper-checkpoint-roof | 2.2 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:upper-checkpoint-east-wall | 51.53333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:sluice-side-pier | 10.133333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:upper-checkpoint | 7.583333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:lookout-stair | 5.333333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:lookout-balcony | 1.2 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:household-inspection-dais | 5.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:inspection-lamp | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:great-sealed-store | 6.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:family-bundle-17 | 4.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:family-bundle-18 | 4.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:25:broken-haul-bridge | 2.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:vertical-depot-shell | 503.3333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:masonry-vault | 11.7 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-0 | 54.916666666666664 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-lamp-0 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:haul-number-0 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-1 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-lamp-1 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:haul-number-1 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-2 | 51.583333333333336 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-lamp-2 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:haul-number-2 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-3 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-lamp-3 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:haul-number-3 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-4 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-lamp-4 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:haul-number-4 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-5 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-lamp-5 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:haul-number-5 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-6 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-lamp-6 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:haul-number-6 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-7 | 4.15 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:gallery-lamp-7 | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:haul-number-7 | 1.9166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:entry-haul-stairs | 10.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:return-inspection-stairs | 10.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:manifest-stairs | 10.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:loading-office-roof | 1.7 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:loading-office-east-wall | 2.533333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:abandoned-loading-shed | 7.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:loading-oil-lamp | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:far-passage-roof | 2.8666666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:far-passage-wall | 51.03333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:far-passage-buttress | 35.13333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:far-sealed-store | 10.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:ledger-room-roof | 2.533333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:ledger-room-west-wall | 24.033333333333335 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:ledger-vault | 9.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:household-inspection-dais | 5.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:inspection-lamp | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:numbered-family-bundle | 4.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:sunk-family-tools | 4.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:manifest-bundle | 4.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-waterworks-v3:27:broken-haul-bridge | 2.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-rear-cliff-contact | 107.5 | mountain | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-west | 63.333333333333336 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-saddle | 11.113260490533579 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-saddle-rv-saddle-canopy-landing | 6.371091082834543 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-saddle-rv-saddle-fallen-trunk | 32.59682791173351 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-saddle-rv-saddle-swept-bough | 3.888562245533649 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-saddle-rv-saddle-broken-arm | 4.219114715100674 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-ravine | 6.354524088453308 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-ravine-rv-root-west-return | 31.293530870189535 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-ravine-rv-root-east-descent | 18.46076863637627 | tree | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-east | 60.35714285714286 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-ritual-ledge-pine | 8.5 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-cliff-ledge-pine | 8.5 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-refuge-ledge-pine | 8.5 | tree | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-ritual-clearing | 7.166666666666667 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-refuge-bundle | 3.1666666666666665 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage11:ravine-shoulder-rv-ritual-reflection-ledge | 1.580666666666669 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage11:ravine-shoulder-rv-east-upper-fire-bay | 3.297619047619052 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| stage17:worksite-rear-cavern | 72.16666666666667 | mountain | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-low-vault-shoring | 12 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-west-gallery | 15.833333333333334 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-east-gallery | 15.833333333333334 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-west-switchback-frame | 25.25 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-shaft-service-frame | 24.5 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-east-gallery-frame | 35.44761904761905 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-trestle-ws-east-fire-access | 8.33137254901961 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-trestle-ws-east-fire-deck | 10.54320987654321 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-trestle-ws-service-tool-ledge | 3.4 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-trestle-ws-notes-work-deck | 5.316666666666666 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-main-hoist | 32.583333333333336 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-control-drive-link | 29.633333333333333 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-west-work-remains | 7.666666666666667 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-lower-service-remains | 7.666666666666667 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-timber-store | 6.083333333333333 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-tool-bench | 5.783333333333333 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-axle-tool-bench | 5.783333333333333 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage17:worksite-oil-lamp | 5.333333333333333 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-rear-cavern-courts | 80.91666666666667 | mountain | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-great-hall | 28.833333333333332 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-folded-west-cloister | 42.10555555555555 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-shelter-veranda | 13.574603174603165 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-hall-side-gallery | 11.166666666666666 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-east-return-gallery | 22.333333333333332 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-processional-crossing | 14.577777777777783 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-archive-cloister | 14.022222222222217 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-lower-prayer-ledge | 5.381481481481478 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-stone-lamp | 4.533333333333333 | architecture | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| stage16:temple-stone-buddha-cliff-colossus | 72.97036666666666 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |

## 현재 맵

| 맵 | 거리 preset / atmosphere | L1 장식 / 지형 / 물 | 구역 | 풍경 묶음 | 지지면 | 배경 개체 |
| --- | --- | --- | --- | ---: | ---: | ---: |
| stage-1 | forest / forest | 44 / 5 / 1 | landscape | 1 | 1 | 0 |
| stage-2 | valley / valley | 40 / 8 / 2 | upper-ridge, slope, valley-bottom | 5 | 5 | 13 |
| stage-3 | forest / forest | 37 / 9 / 1 | landscape | 3 | 3 | 6 |
| stage-4 | forest / burned | 31 / 9 / 0 | upper-ridge, slope, valley-bottom | 2 | 2 | 0 |
| stage-5 | valley / valley | 19 / 15 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 13 |
| stage-6 | valley / valley | 20 / 11 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 10 |
| stage-7 | forest / enclosed | 11 / 15 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 15 |
| stage-8 | forest / temple | 14 / 12 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 2 |
| stage-9 | forest / forest | 10 / 8 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 7 |
| stage-10 | forest / otherworld | 13 / 11 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 2 |
| stage-11 | forest / forest | 11 / 31 / 0 | upper-ridge, slope, valley-bottom | 2 | 2 | 0 |
| stage-12 | valley / valley | 8 / 3 / 0 | upper-ridge, slope, valley-bottom | 1 | 1 | 0 |
| stage-13 | valley / valley | 12 / 5 / 0 | upper-ridge, slope, valley-bottom | 3 | 3 | 6 |
| stage-14 | enclosed / enclosed | 20 / 8 / 1 | upper-ridge, slope, valley-bottom | 8 | 8 | 23 |
| stage-15 | enclosed / enclosed | 11 / 10 / 1 | upper-ridge, slope, valley-bottom | 3 | 3 | 7 |
| stage-16 | enclosed / enclosed | 16 / 26 / 0 | upper-ridge, slope, valley-bottom | 5 | 5 | 3 |
| stage-17 | enclosed / enclosed | 22 / 41 / 0 | upper-ridge, slope, valley-bottom | 3 | 3 | 0 |
| stage-18 | enclosed / enclosed | 12 / 6 / 0 | upper-ridge, slope, valley-bottom | 5 | 5 | 10 |
| stage-19 | enclosed / enclosed | 23 / 5 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 10 |
| stage-20 | valley / valley | 8 / 4 / 0 | upper-ridge, slope, valley-bottom | 1 | 1 | 0 |
| stage-21 | forest / temple | 23 / 1 / 0 | act3-world | 2 | 2 | 79 |
| stage-22 | enclosed / enclosed | 36 / 3 / 1 | draft-world | 0 | 0 | 0 |
| stage-23 | forest / forest | 13 / 1 / 2 | act3-world | 0 | 0 | 0 |
| stage-24 | forest / forest | 22 / 2 / 0 | act3-world | 0 | 0 | 0 |
| stage-25 | enclosed / enclosed | 42 / 1 / 1 | act3-world | 0 | 0 | 0 |
| stage-26 | forest / forest | 22 / 3 / 1 | act3-world | 0 | 0 | 0 |
| stage-27 | enclosed / enclosed | 46 / 1 / 1 | act3-world | 0 | 0 | 0 |
| stage-28 | forest / forest | 26 / 5 / 0 | act3-world | 1 | 1 | 4 |
| stage-29 | forest / forest | 15 / 3 / 1 | act3-world | 0 | 0 | 0 |
| stage-30 | forest / forest | 19 / 1 / 1 | act3-world | 1 | 1 | 4 |

## 코드가 생성하는 요소

| 요소 | 공간 / 지지 | 대기·애니메이션 | 실제 소스 |
| --- | --- | --- | --- |
| 능선·절벽·후면 지면 | L2–L4, surface와 group 공유 | 깊이별 큰 색면, 정적 Path2D | environment.js / environment-renderer.js |
| 하늘·달·큰 구름 | L5, viewport | preset gradient / radial glow / 정적 fog card | environment-renderer.js |
| 능선 안개 | L3 group / zone | 미리 그린 유기적 card, translate | environment-art.js |
| 빛기둥·동굴 입구 빛 | zone / viewport | gradient, 낮은 opacity 변화 | environment-art.js |
| 낙엽·날씨 | L5, viewport; enclosed 제외 | 기존 Scene.time | renderer.js |
| 물웅덩이·강 | L1 실제 water material polygon | depth gradient, clip, 5개 재사용 곡선, 진입 파문 | environment-renderer.js / environment-art.js |
| 전장 폭포 | L1 authored landmark의 절벽 | 캐시된 암면, clip 내부 흐름, 포말, 하단 mist | map-art-polish.js / environment-art.js |
| 원경 폭포 | L2 group, 절벽 상단 support | 같은 흐름 primitive / group transform | environment-renderer.js |
| 전장 장식·구조물 | L1, authored terrain/contact | WORLD, 기존 world raster cache | elements.js / map-art-polish.js / art-dark.js |

L1의 back/prop/front는 깊이가 아닌 그리기 순서다. 캐릭터·탄·조준선은 WORLD이며 대기 효과 뒤에 그린다.
미사용 에셋도 기준 크기와 미술 역할을 분류한다. 모든 인스턴스의 stage/support/group/zone/atmosphere 상세는 생성 JSON에 포함된다.
