# 배경 공간 분류 목록

자동 생성: `node tools/environment/inventory.mjs`. 수치와 모드는 `shared/map/environment.js`의 registry를 참조한다.

| Asset | 기준 높이(m) | 역할 | 접지 | 사용 깊이 | 묶음 / 수직 모드 / 구역 | 대기 표현 / 렌더링 |
| --- | ---: | --- | --- | --- | --- | --- |
| rock_small | 2 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| rock_large | 2 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| rock_ledge | 2 | rock | 지형/지지면 필수 | 미사용 | 미사용 / 미사용 / 미사용 | static / cached-vector |
| ancient_pine | 8 | tree | 지형/지지면 필수 | L2, L1 | landscape-L2,  / WORLD / landscape, world | static / cached-vector |
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
| act2:cave-house | 3.5 | building | 지형/지지면 필수 | L1, L2 | , slope-L2, valley-bottom-L2 / WORLD / world, slope, valley-bottom | static / cached-vector |
| act2:temple | 5.2 | building | 지형/지지면 필수 | L1, L2 | , slope-L2, valley-bottom-L2 / WORLD / world, slope, valley-bottom | static / cached-vector |
| act2:bell | 15.5 | light | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | glow / cached-vector |
| act2:hoist-frame | 5.5 | building | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:lamp | 1.4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:ritual | 2 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:timber-rack | 2.8 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:mine-rail | 0.65 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:water-trough | 1.4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:memorial | 2.2 | prop | 지형/지지면 필수 | L1, L2 | , slope-L2, valley-bottom-L2 / WORLD / world, slope, valley-bottom | static / cached-vector |
| act2:bundles | 1.5 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:rock-column | 10 | rock | 지형/지지면 필수 | L1, L2 | , slope-L2, valley-bottom-L2 / WORLD / world, slope, valley-bottom | static / cached-vector |
| act2:hanging-cloth | 2.4 | prop | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:stone-table | 1.4 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |
| act2:rock-bank | 2 | rock | 지형/지지면 필수 | L1 | 미사용 / WORLD / world | static / cached-vector |

## 현재 맵

| 맵 | 거리 preset / atmosphere | L1 장식 / 지형 / 물 | 구역 | 풍경 묶음 | 지지면 | 배경 개체 |
| --- | --- | --- | --- | ---: | ---: | ---: |
| stage-1 | forest / forest | 33 / 4 / 1 | landscape | 1 | 1 | 0 |
| stage-2 | valley / valley | 35 / 9 / 3 | upper-ridge, slope, valley-bottom | 5 | 5 | 13 |
| stage-3 | forest / forest | 28 / 8 / 1 | landscape | 3 | 3 | 6 |
| stage-4 | forest / burned | 21 / 8 / 0 | upper-ridge, slope, valley-bottom | 2 | 2 | 0 |
| stage-5 | valley / valley | 14 / 14 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 13 |
| stage-6 | valley / valley | 14 / 10 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 10 |
| stage-7 | forest / enclosed | 7 / 11 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 15 |
| stage-8 | forest / temple | 6 / 11 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 2 |
| stage-9 | forest / forest | 6 / 8 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 7 |
| stage-10 | forest / otherworld | 7 / 9 / 0 | upper-ridge, slope, valley-bottom | 4 | 4 | 2 |
| stage-11 | forest / forest | 48 / 5 / 0 | upper-ridge, slope, valley-bottom | 2 | 2 | 0 |
| stage-12 | valley / valley | 49 / 6 / 0 | upper-ridge, slope, valley-bottom | 1 | 1 | 0 |
| stage-13 | enclosed / enclosed | 50 / 8 / 0 | upper-ridge, slope, valley-bottom | 3 | 3 | 7 |
| stage-14 | enclosed / enclosed | 81 / 9 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 23 |
| stage-15 | enclosed / enclosed | 52 / 5 / 1 | upper-ridge, slope, valley-bottom | 3 | 3 | 7 |
| stage-16 | enclosed / enclosed | 57 / 6 / 0 | upper-ridge, slope, valley-bottom | 5 | 5 | 23 |
| stage-17 | enclosed / enclosed | 52 / 9 / 0 | upper-ridge, slope, valley-bottom | 3 | 3 | 7 |
| stage-18 | enclosed / enclosed | 60 / 7 / 0 | upper-ridge, slope, valley-bottom | 5 | 5 | 24 |
| stage-19 | enclosed / enclosed | 68 / 6 / 1 | upper-ridge, slope, valley-bottom | 5 | 5 | 24 |
| stage-20 | valley / valley | 47 / 8 / 0 | upper-ridge, slope, valley-bottom | 1 | 1 | 0 |

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
