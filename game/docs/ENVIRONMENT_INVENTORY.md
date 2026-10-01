# 배경 공간 분류 목록

자동 생성: `node tools/environment/inventory.mjs` · 스키마 4 · environment 1

기준 수치와 프리셋은 `shared/map/environment.js`의 `HonroEnvironment`를 참조한다. 아래 크기·사용처는 `shared/data/campaign.json`에서 생성했다.

| Asset | 기준 높이(m) | 벡터 경계(x,y,w,h) | 부착점(x,y) | 사용 깊이 / 스테이지 |
| --- | ---: | --- | --- | --- |
| rock_small | 2 | -33.5,-20.2,65.9,46.4 | 0,26.1 | 미사용 |
| rock_large | 2 | -67.1,-47.1,144.2,99.6 | 0,52.4 | 미사용 |
| rock_ledge | 2 | -90,-32,184,56 | 0,24 | 미사용 |
| ancient_pine | 8 | -136.1,-430,249.6,430 | 0,0 | L3:stage-1, L2:stage-1, L3:stage-2, L2:stage-2, L3:stage-3, L2:stage-3, L3:stage-4, L2:stage-4, L3:stage-5, L2:stage-5, L3:stage-6, L2:stage-6, L3:stage-7, L2:stage-7, L3:stage-8, L2:stage-8, L3:stage-9, L2:stage-9, L3:stage-10, L2:stage-10 |
| dead_pine | 7.2 | -105,-340,215,340 | 0,0 | L3:stage-1, L2:stage-1, L3:stage-2, L2:stage-2, L3:stage-3, L2:stage-3, L3:stage-4, L2:stage-4, L3:stage-5, L2:stage-5, L3:stage-6, L2:stage-6, L3:stage-7, L2:stage-7, L3:stage-8, L2:stage-8, L3:stage-9, L2:stage-9, L3:stage-10, L2:stage-10 |
| branch_thick | 2 | -95,-28,187,48 | 0,20 | 미사용 |
| grass_tuft | 0.7 | -16,-17.8,30,17.8 | 0,0 | L1:stage-1, L1:stage-2 |
| fern | 0.7 | -22,-32,44,32 | 0,0 | 미사용 |
| reed | 0.7 | -21,-58,44,58 | 0,0 | 미사용 |
| shrine_gate | 4.5 | -98,-140,196,140 | 0,0 | 미사용 |
| hut | 4.5 | -88,-105,176,105 | 0,0 | 미사용 |
| warehouse | 4.5 | -118,-132,236,132 | 0,0 | 미사용 |
| cart | 1.5 | -65,-78,130,97.1 | 0,19.1 | L1:stage-1 |
| lantern | 1.5 | -12,-40,24,35 | 0,-5 | 미사용 |
| grave_post | 1.5 | -18,-105,36,105 | 0,0 | 미사용 |
| env:ridge | 20 | -800,-366,1600,366 | 0,0 | L4:stage-2, L4:stage-5, L4:stage-6 |
| env:cliff | 20 | -200,-308,405,1008 | 0,0 | 미사용 |
| env:cloud | 9 | -260,-89,520,104 | 0,0 | L4:stage-1, L4:stage-2, L4:stage-3, L4:stage-4, L4:stage-5, L4:stage-6, L4:stage-7, L4:stage-8, L4:stage-9, L4:stage-10 |
| builtin:ancientPine | 9 | -400,-650,800,650 | 0,0 | L1:stage-1, L1:stage-3, L1:stage-4 |
| builtin:scree | 4 | -400,-650,800,650 | 0,0 | L1:stage-3, L1:stage-4, L1:stage-6 |
| builtin:fernPatch | 4 | -400,-650,800,650 | 0,0 | L1:stage-1, L1:stage-2, L1:stage-3, L1:stage-4 |
| builtin:rockPile | 4 | -400,-650,800,650 | 0,0 | 미사용 |
| builtin:giantPine | 9 | -400,-650,800,650 | 0,0 | L1:stage-1 |
| builtin:fallenTree | 9 | -400,-650,800,650 | 0,0 | L1:stage-6 |
| builtin:spiritKnot | 4 | -400,-650,800,650 | 0,0 | L1:stage-5 |
| builtin:oldGate | 5 | -400,-650,800,650 | 0,0 | L1:stage-1, L1:stage-4 |
| builtin:ravinePine | 9 | -400,-650,800,650 | 0,0 | L1:stage-2, L1:stage-3, L1:stage-4, L1:stage-5, L1:stage-6 |
| builtin:funeralGate | 5 | -400,-650,800,650 | 0,0 | L1:stage-8 |
| builtin:reedBank | 4 | -400,-650,800,650 | 0,0 | L1:stage-3 |
| builtin:ferry | 4 | -400,-650,800,650 | 0,0 | L1:stage-3 |
| builtin:brokenDock | 5 | -400,-650,800,650 | 0,0 | L1:stage-3 |
| builtin:waterShrine | 5 | -400,-650,800,650 | 0,0 | L1:stage-3 |
| builtin:cargoScaffold | 5 | -400,-650,800,650 | 0,0 | L1:stage-3 |
| builtin:warehouse | 5 | -400,-650,800,650 | 0,0 | L1:stage-3, L1:stage-8 |
| builtin:oldHall | 5 | -400,-650,800,650 | 0,0 | L1:stage-3, L1:stage-9, L1:stage-10 |
| builtin:refugeeCarts | 4 | -400,-650,800,650 | 0,0 | L1:stage-3, L1:stage-4, L1:stage-6 |
| builtin:villageWall | 5 | -400,-650,800,650 | 0,0 | L1:stage-4 |
| builtin:cliffFace | 10 | -400,-650,800,650 | 0,0 | L1:stage-4 |
| builtin:burnedHouses | 5 | -400,-650,800,650 | 0,0 | L1:stage-4 |
| builtin:watchtower | 5 | -400,-650,800,650 | 0,0 | L1:stage-4 |
| builtin:waterfall | 15 | -400,-650,800,650 | 0,0 | L1:stage-5 |
| builtin:receiverStone | 4 | -400,-650,800,650 | 0,0 | L1:stage-5, L1:stage-9, L1:stage-10 |
| builtin:cliffShrine | 10 | -400,-650,800,650 | 0,0 | L1:stage-5 |
| builtin:deadPines | 9 | -400,-650,800,650 | 0,0 | L1:stage-4, L1:stage-5 |
| builtin:brokenBridge | 4 | -400,-650,800,650 | 0,0 | L1:stage-6 |
| builtin:bridgePillar | 4 | -400,-650,800,650 | 0,0 | L1:stage-6 |
| builtin:bell | 4 | -400,-650,800,650 | 0,0 | L1:stage-6 |
| builtin:greatTree | 24 | -400,-650,800,650 | 0,0 | L1:stage-7 |
| builtin:rootHut | 4 | -400,-650,800,650 | 0,0 | L1:stage-7 |
| builtin:hollowRoot | 4 | -400,-650,800,650 | 0,0 | L1:stage-7 |
| builtin:rootShrine | 5 | -400,-650,800,650 | 0,0 | L1:stage-7 |
| builtin:gravePosts | 4 | -400,-650,800,650 | 0,0 | L1:stage-8 |
| builtin:bierRest | 4 | -400,-650,800,650 | 0,0 | L1:stage-8 |
| builtin:incenseYard | 4 | -400,-650,800,650 | 0,0 | L1:stage-9 |
| builtin:royalGate | 5 | -400,-650,800,650 | 0,0 | L1:stage-10 |
| builtin:ritualDais | 4 | -400,-650,800,650 | 0,0 | L1:stage-10 |
| builtin:upperShrine | 5 | -400,-650,800,650 | 0,0 | L1:stage-10 |
| mockup-granite-large | 2 | -270.3,-250,550.8,312.5 | 0,62.5 | L1:stage-1, L1:stage-2, L1:stage-3, L1:stage-5, L1:stage-6 |
| mockup-granite-small | 2 | -71.5,-130,145.8,162.5 | 0,32.5 | L1:stage-1, L1:stage-2, L1:stage-3, L1:stage-4, L1:stage-5 |
| mockup-granite-shelf | 2 | -190.8,-160,388.8,200 | 0,40 | L1:stage-2 |
| builtin:placeDetail | 5 | -700,-1600,1400,1700 | 0,0 | L1:stage-3, L1:stage-4, L1:stage-5, L1:stage-6 |

## 맵별 분류

| 맵 | 프리셋 | L1 요소 | L1 지형 | L1 재질 | L1 유닛/마커/이벤트 | L2 | L3 | L4 | L5 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| stage-1 | forest | 27 | 3 | 12 | 18 | 21 | 42 | 9 | 하늘·달·날씨 |
| stage-2 | valley | 35 | 9 | 16 | 24 | 22 | 42 | 15 | 하늘·달·날씨 |
| stage-3 | forest | 26 | 8 | 9 | 21 | 25 | 49 | 10 | 하늘·달·날씨 |
| stage-4 | forest | 19 | 8 | 8 | 21 | 22 | 43 | 10 | 하늘·달·날씨 |
| stage-5 | valley | 12 | 14 | 5 | 23 | 33 | 63 | 15 | 하늘·달·날씨 |
| stage-6 | valley | 14 | 10 | 6 | 28 | 25 | 49 | 17 | 하늘·달·날씨 |
| stage-7 | forest | 5 | 11 | 0 | 29 | 30 | 60 | 9 | 하늘·달·날씨 |
| stage-8 | forest | 4 | 11 | 0 | 23 | 26 | 51 | 11 | 하늘·달·날씨 |
| stage-9 | forest | 4 | 8 | 0 | 27 | 20 | 40 | 9 | 하늘·달·날씨 |
| stage-10 | forest | 7 | 9 | 0 | 22 | 23 | 44 | 10 | 하늘·달·날씨 |

L1 요소의 `back`/`prop`/`front`는 그리기 순서이며 공간 깊이가 아니다. 충돌, 경로, 지면 부착 장식은 모두 L1이다. L5 하늘·달은 `shared/runtime/environment-renderer.js`, 날씨는 `shared/runtime/renderer.js`에서 화면 고정으로 그린다.
