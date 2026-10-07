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
| act2:temple | 5.2 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:bell | 15.5 | light | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | glow / cached-vector |
| act2:hoist-frame | 5.5 | building | 지형/지지면 필수 | L1, L2 | , a2-scene-17-hoist-rear-bay / WORLD / world,  | static / cached-vector |
| act2:lamp | 1.4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:ritual | 2 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:timber-rack | 2.8 | prop | 지형/지지면 필수 | L1, L2 | , a2-scene-17-hoist-rear-bay / WORLD / world,  | static / cached-vector |
| act2:mine-rail | 0.65 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:water-trough | 1.4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:memorial | 2.2 | prop | 지형/지지면 필수 | L1, L2 | , a2-scene-16-court-wing / WORLD / world,  | static / cached-vector |
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
| act2:scene-temple-corridor | 5.8 | building | 지형/지지면 필수 | L1, L2 | , a2-scene-16-court-wing, a2-scene-16-hall-side-gallery / WORLD / world,  | static / cached-vector |
| act2:scene-stone-threshold | 16.333333333333332 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:scene-work-shelter | 5.7 | building | 지형/지지면 필수 | L1, L2 | , a2-scene-17-hoist-rear-bay / WORLD / world,  | static / cached-vector |
| act2:scene-market-walkway | 10.833333333333334 | building | 지형/지지면 필수 | L2 | a2-scene-14-market-hamlet / WORLD / 미사용 | static / cached-vector |
| act2:scene-upper-stair | 10.833333333333334 | building | 지형/지지면 필수 | L2 | a2-scene-14-upper-homes, a2-scene-14-lower-homes / WORLD / 미사용 | static / cached-vector |
| act2:scene-court-wall | 4.116666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
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
| a3-background-day-L3-house | 8.083333333333334 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L3-office | 11.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L3-granary | 9.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L3-market | 6.583333333333333 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L3-bank | 25 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L2-house | 8.083333333333334 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L2-office | 11.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L2-granary | 9.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L2-market | 6.583333333333333 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-day-L2-bank | 25 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-21:entry-shop | 8.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:cloth-yard | 9.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:west-gate-wing | 16.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:gate-tower | 16.583333333333332 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:east-gate-wing | 11.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:tea-market | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:east-stables | 9.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:office-porch | 12.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:east-watch | 10.916666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-background-town-gate | 14.083333333333334 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-21:rear-stair-piers | 11.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:wall-stair | 8.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:gate-wall-walk | 2.183333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-21:market-roof-stair | 5.083333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-rear | 29.833333333333332 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-west-roof | 7.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-22:archive-east-roof | 7.366666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
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
| a3-23:west-shop | 7.916666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:cloth-hall | 10.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:west-quay-tower | 7.083333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:market-house | 12.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:granary | 13.916666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:bridge-tower | 7.416666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:customs-hall | 12.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:east-house | 11.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:canal-watch | 6.583333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:east-granary | 9.916666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:west-roof-bridge | 2.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:central-water-bridge | 2.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:central-roof-bridge | 2.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:east-water-bridge | 2.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:east-roof-bridge | 2.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:office-upper-gallery | 10.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:gate-upper-gallery | 10.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:upper-rear-posts | 7.833333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:west-stone-bridge | 5.666666666666667 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:canal-quays | 7.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:office-step-0 | 1.8333333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:office-step-1 | 1.8333333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:office-step-2 | 1.8333333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:west-quay-up | 3 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:west-quay-down | 3 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:grand-convoy-quay | 4.666666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:east-convoy-quay | 4.666666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:west-quay-seam | 2.183333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:roof-entry | 5.166666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:roof-west-link | 3.9166666666666665 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-23:canal-upper-gallery-rear-piers | 28.333333333333332 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-background-garden-L3-house | 8.083333333333334 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L3-office | 11.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L3-granary | 9.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L3-market | 6.583333333333333 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L3-bank | 25 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L2-house | 8.083333333333334 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L2-office | 11.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L2-granary | 9.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L2-market | 6.583333333333333 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-garden-L2-bank | 25 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-24:terraced-garden-walk | 7.833333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:family-main-hall | 15.866666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:family-shrine-hall | 15.866666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:west-servants-house | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:gate-court-wing | 9.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:west-study-wing | 9.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:garden-pavilion | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:pond-store | 8.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:east-guard-wing | 11.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:shrine-side-wing | 9.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:rear-lodge | 8.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:grounded-rear-architecture | 31.666666666666668 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-24:pond-shore-garden | 2.1666666666666665 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:hidden-stair-and-gallery | 12.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:hidden-west-record-hall | 15.866666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:hidden-east-record-hall | 13.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:sealed-entry-porch | 10.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:first-stair-house | 11.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:record-wing-west | 10.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:record-wing-east | 10.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:empty-courtyard-house | 10.916666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:rear-stair-pavilion | 12.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:upper-keeper-room | 9.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:back-watch | 9.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:grounded-rear-architecture | 31.666666666666668 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-25:record-house-rear-cutaway | 21.333333333333332 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-background-burnt-L3-house | 8.083333333333334 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L3-office | 11.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L3-granary | 9.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L3-market | 6.583333333333333 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L3-bank | 25 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L2-house | 8.083333333333334 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L2-office | 11.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L2-granary | 9.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L2-market | 6.583333333333333 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-burnt-L2-bank | 25 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-26:casting-yard-access | 6.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:burnt-casting-house | 14.116666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:east-smithy | 14.116666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:charred-gatehouse | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:broken-pattern-shop | 10.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:artisan-home | 8.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:kiln-stair-shed | 10.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:casting-west-wing | 10.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:charcoal-store | 8.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:water-wheel-store | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:east-tool-hall | 8.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:hill-side-kiln | 11.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:grounded-rear-architecture | 31.666666666666668 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-26:broken-kiln-chimneys | 15.833333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-background-late-L3-house | 8.083333333333334 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L3-office | 11.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L3-granary | 9.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L3-market | 6.583333333333333 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L3-bank | 25 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L2-house | 8.083333333333334 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L2-office | 11.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L2-granary | 9.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L2-market | 6.583333333333333 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-late-L2-bank | 25 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-27:continuous-archive-roof-escape | 9.666666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:west-fire-porch | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:water-control-shed | 9.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:first-roof-gallery | 9.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:petition-office | 11.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:west-archive-tower | 9.916666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:high-record-gallery | 12.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:east-archive-tower | 11.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:rear-roof-gallery | 8.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:outer-guard-house | 9.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:escape-lodge | 8.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:fire-court-open-archive | 10.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-27:grounded-rear-architecture | 31.666666666666668 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:outer-rampart-and-office-walk | 13 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:west-official-record-hall | 15.866666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:east-official-record-hall | 15.866666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:western-wall-watch | 9.916666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:wall-stair-tower | 12.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:west-order-office | 9.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:archive-cross-court | 10.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:closed-account-hall | 9.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:middle-guard-office | 10.916666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:east-ramp-watch | 12.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:east-order-office | 9.916666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:outer-wall-gate | 11.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-28:grounded-rear-architecture | 31.666666666666668 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-background-night-L3-house | 8.083333333333334 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L3-office | 11.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L3-granary | 9.75 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L3-market | 6.583333333333333 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L3-bank | 25 | building | 지형/지지면 필수 | L3 | a3-town-L3 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L2-house | 8.083333333333334 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L2-office | 11.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L2-granary | 9.75 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L2-market | 6.583333333333333 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-background-night-L2-bank | 25 | building | 지형/지지면 필수 | L2 | a3-town-L2 / WORLD / act3-world | static / cached-vector |
| a3-29:sluice-inspection-and-exit-walk | 8.333333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:sealed-night-storage | 15.866666666666667 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:great-sluice-pavilion | 14.883333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:night-customs-house | 9.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:sealed-entry-wing | 11.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:west-store-wing | 10.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:lock-master-house | 8.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:low-basin-store | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:east-lock-stair | 9.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:sluice-side-watch | 10.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:ferry-road-house | 9.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-29:grounded-rear-architecture | 31.666666666666668 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:ferry-decks-to-old-road | 4.833333333333333 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:main-ferry-pavilion | 11.9 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:old-road-loading-pavilion | 11.9 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:western-inn | 9.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:ferry-ticket-house | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:rope-store | 8.083333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:west-loading-house | 8.75 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:east-loading-house | 8.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:night-granary | 11.416666666666666 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:ferry-watch | 10.25 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:old-road-shelter | 9.583333333333334 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| a3-30:grounded-rear-architecture | 31.666666666666668 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |

## 현재 맵

| 맵 | 거리 preset / atmosphere | L1 장식 / 지형 / 물 | 구역 | 풍경 묶음 | 지지면 | 배경 개체 |
| --- | --- | --- | --- | ---: | ---: | ---: |
| stage-1 | forest / forest | 44 / 4 / 1 | landscape | 1 | 1 | 0 |
| stage-2 | valley / valley | 40 / 8 / 2 | upper-ridge, slope, valley-bottom | 5 | 5 | 13 |
| stage-3 | forest / forest | 37 / 8 / 1 | landscape | 3 | 3 | 6 |
| stage-4 | forest / burned | 31 / 8 / 0 | upper-ridge, slope, valley-bottom | 2 | 2 | 0 |
| stage-5 | valley / valley | 19 / 14 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 13 |
| stage-6 | valley / valley | 20 / 10 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 10 |
| stage-7 | forest / enclosed | 11 / 12 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 15 |
| stage-8 | forest / temple | 14 / 11 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 2 |
| stage-9 | forest / forest | 10 / 8 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 7 |
| stage-10 | forest / otherworld | 13 / 9 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 2 |
| stage-11 | forest / forest | 11 / 2 / 0 | upper-ridge, slope, valley-bottom | 2 | 2 | 0 |
| stage-12 | valley / valley | 8 / 4 / 0 | upper-ridge, slope, valley-bottom | 1 | 1 | 0 |
| stage-13 | valley / valley | 12 / 5 / 0 | upper-ridge, slope, valley-bottom | 3 | 3 | 6 |
| stage-14 | enclosed / enclosed | 19 / 5 / 1 | upper-ridge, slope, valley-bottom | 8 | 8 | 23 |
| stage-15 | enclosed / enclosed | 10 / 4 / 1 | upper-ridge, slope, valley-bottom | 3 | 3 | 7 |
| stage-16 | enclosed / enclosed | 16 / 4 / 0 | upper-ridge, slope, valley-bottom | 7 | 7 | 14 |
| stage-17 | enclosed / enclosed | 16 / 6 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 10 |
| stage-18 | enclosed / enclosed | 12 / 4 / 0 | upper-ridge, slope, valley-bottom | 5 | 5 | 10 |
| stage-19 | enclosed / enclosed | 23 / 3 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 10 |
| stage-20 | valley / valley | 8 / 6 / 0 | upper-ridge, slope, valley-bottom | 1 | 1 | 0 |
| stage-21 | forest / temple | 13 / 2 / 0 | act3-world | 2 | 2 | 79 |
| stage-22 | enclosed / enclosed | 31 / 4 / 1 | draft-world | 0 | 0 | 0 |
| stage-23 | forest / temple | 31 / 3 / 3 | act3-world | 2 | 2 | 77 |
| stage-24 | forest / temple | 17 / 4 / 1 | act3-world | 2 | 2 | 61 |
| stage-25 | enclosed / enclosed | 13 / 4 / 0 | act3-world | 0 | 0 | 0 |
| stage-26 | forest / temple | 14 / 2 / 1 | act3-world | 2 | 2 | 60 |
| stage-27 | forest / temple | 13 / 4 / 0 | act3-world | 2 | 2 | 76 |
| stage-28 | forest / temple | 13 / 3 / 0 | act3-world | 2 | 2 | 69 |
| stage-29 | forest / temple | 12 / 4 / 2 | act3-world | 2 | 2 | 64 |
| stage-30 | forest / temple | 12 / 3 / 2 | act3-world | 2 | 2 | 55 |

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
