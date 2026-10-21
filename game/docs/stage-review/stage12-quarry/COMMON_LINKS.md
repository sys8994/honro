# 12장 공통 room·surface 진단과 승인 소나무 연결

**부분 교정이며 전체 미술 불합격이다. master·Pages·13장 보류 유지.** 비교 기준은 `dc8f128a0873131205e69e8edd456b89debc1785`, 최종 캡처 소스는 `6f9acfa1c8d7bf8e4d9f7679c94c482f0923f072`다. 실제 데이터/렌더 연결 수정은 `e28954cc`이며 6f9acfa1은 진단 도구의 Act1 출력 필드 오류만 고쳤다. 기존 COMMON_FULL은 직전 후보의 역사 기록이며 이 문서가 후속 진단 결과다.

## 부모 가설의 실제 확인

`shared/runtime/act2-spatial-art.js`의 공개된 `prepareTerrain()`/`surfaceEdges()`가 반환하는 실제 q를 native Canvas 런타임에서 읽었다. 계산을 별도 모형으로 재현한 수치가 아니다. `tools/testing/stage12-common-links.mjs`는 read-only 진단이며 canonical 데이터·전투 상태를 변경하지 않는다.

| 실제 t.id | surface 수 | 수정 전 named rooms / blocks | 수정 후 named rooms / blocks | 결론 |
| --- | --- | --- | --- | --- |
| `sq-north-quarry` x5320–8652.5/y3310–4470 | 11 | quarry-B / 1 | 동일 / 1 | blocks0 가설은 반증됨. ref.terrainId와 edgeIndices0..10은 실제 honroWalkEdges와 일치. |
| `sq-lower-ground` | 49 | quarry-E / 1 | quarry-E, quarry-F / 2 | 실제 길표 구역 F의 canonical 참조 누락 확인·교정. |
| `sq-inner-joint` | 1 | quarry-C / 0 | 동일 / 0 | edgeIndices[0]가 실제 단일 보행면과 일치. surface>1 조건을 통과하지 않는 의도된 결과. 억지 분할하지 않음. |

하부 surface ref의 edgeIndices는0..24이며 실제 walkEdges와 같다. 49는 TerrainDomain이 시각 외곽으로 확장한 실제 공통 surfaceEdges 결과다. index 누락이나 잘못된 terrainId가 아니다. 상부 B와 하부 E에 이미 blocks가 존재하므로 “V3 전부 room 참조가 끊겨 암면이 비었다”는 결론은 틀리다.

**F만 수정한 근거:** 기존 `space.sites.sign`은 이미 roomId=quarry-F, surfaceId=sq-lower-ground, 위치(6520,4800)이며 F 교전 부대 sq-f1/f2 등의 기존 encounterSites도 같은 room/표면을 명시한다. 반면 F의 terrainIds만 비어 있었다. `tools/map-forge/stage12-quarry-geometry.mjs`에서 기존 F.terrainIds에 sq-lower-ground, 같은 기존 surface.roomIds에 quarry-F를 연결했다. 무관한 room을 가져오거나 새 room/bounds/지형/terrainPlanes를 만들지 않았다. blocks는 room.terrainIds 연결로 활성화되며 surface.roomIds는 상호 참조 일관성을 보정한다.

남은 원인은 **기존 공통 표현의 범위와 크기**다. 상부는 폭약3332의 한 mass에 B block1개(공통 상한 폭1250)와 전체 질량 기준 facet4개뿐이다. B block 예상 x6577.5–7827.5 밖의 큰 면은 넓게 남는다. 하부는 시각 domain 전체 폭23200에 facet4개이며 E block은 x3307.5–4557.5 부근에 있었다. F 연결로 x6163.5–7413.5 부근의 기존 block 하나가 생겨 길표 앞/옆면은 읽히지만 전체 큰 빈 면까지 해결하지 않는다. 이 좌표 범위는 실제 room bounds와 기존 prepareTerrain의 center/bw 식에서 계산한 범위이며 새 저작 좌표가 아니다. renderer 확대 재설계는 하지 않았다.

## 승인1장·2막 경로 대조

승인 `51e0b2b290bb787183868853a7e4fa9a503b0288`의 canonical 1장 데이터를 현행 공통 renderer에 넣어 실제 경로를 확인했다. `Act1SpatialArt.active=true`, `Act2SpatialArt.active=false`다. forest-floor exposed edges251/planes3이며 기존 지지 암반 feature (x240,w1100,h470), (2880,1200,750), (3850,1200,650)를 따른다. 승인1장의 밀도는 Act2 named-room blocks를 쓰는 결과가 아니다. 이 자료는 승인 SHA의 원본 데이터에 대한 현행 함수 진단이며 과거 HTML을 재빌드한 검증으로 부르지 않는다. 기존 승인 PNG도 다시 직접 열어 비교했다.

2막 정상 경로 대조는 기존 13/15장의 읽기 전용 cache만 확인했다. 13장 act2-floor surface130 / named rooms5 / blocks5, cave-roof surface70 / rooms3 / blocks3. 15장 floor surface130 / rooms5 / blocks5, cave-roof surface129 / rooms6 / blocks5(공통 최소 room폭 조건 적용)다. 11장은 실제 cache 수치도 기록했지만 전용 Stage11LandscapeArt 분기가 있어 그것을 12장의 최종 painter와 동일하다고 주장하지 않는다. 13/15장 내용이나 그림은 수정하지 않았다.

## 소나무의 실제 자산 구별

이전 `builtin:ancientPine`은 `map-art-polish.js:drawSpecial()` → 내부 .48 scale의 `pine()` 네이티브 그림이다. `builtin:ravinePine`은 같은 파일의 `ravinePineInk()`다. 이름이 비슷하다고 승인1장 화면에서 보이는 굵은 나무와 같은 그림이 아니다.

승인1장 실제 grove 인스턴스가 참조하는 **기존 공통 `act1-scene:rooted-pine`**을 이번 기존4곳에 연결했다. 이 활성 Library 정의 전체와 원본 SVG가 승인51e0b2b와 정확히 동일함을 확인했다. 새 나무 제작·복사·이름 변경이 아니다.

- 정의/작성 연결: `shared/assets/environment/act1-scene-rooted-pine.svg` → `tools/environment/build-act1-art.mjs:ACT1_VECTOR_ART`/`applyAct1VectorArt()` → 활성 campaign.library[id].vector. 이 공통 정의나 SVG는 변경하지 않았다.
- 실제 그리기: `shared/map/compiler.js:compile()` → canonical-element → `shared/runtime/elements.js:draw()` → `HonroVectorArt.draw()`. 검사에서 해당 ID 호출4개를 직접 관찰했다. 등록되어 있지만 현재 번들에서 실행되지 않는 vector-campaign-art.js를 근거로 삼지 않았다.
- scale: 중앙 .69, 시작길 .77, 서쪽 .70, 뒤쪽 .52. 모두 기존 scaleRange 안. 원래4개 지지점·L1/back 유지, 인물 대비 높이는 이전 나무와 비슷하다.
- 전체 나무를 경사만큼 돌린 시험은 중앙에서 약39도 기울어져 원본 수관까지 비스듬해졌다. 실제 이미지3컷을 직접 확인하고 탈락시켜 `rejected-whole-tree-slope-rotation/`에 보존했다. 최종은 원래 수직 방향 rotation0이며 같은 foot 좌표다. 경사 위 일부 바깥 뿌리 끝의 들림/매몰 차이는 공통 원형과 접지 배치의 남은 한계다.

최종 일반/최대 화면에서는 몸통 두 면과 가지가 수관을 받치는 구조가 이전 native 후보보다 분명하다. 승인1장 숲 전체의 구도/밀도까지 재현한 것은 아니며 나무 교체로 장 전체 미술 합격을 만들지 않는다.

## 수레: 접지와 가림 구별

직전 dc8f128a의 수레 인스턴스·support·scale1.6·rotation0.504165961479153rad·layer back은 그대로다. 공통 cart의 실제 바퀴 polygon2개를 `HonroGeometry.transformPoint()`로 회전·변환한 뒤, 각 x에서 실제 sq-north-quarry walk edge의 표면 y와 대조했다. 한 개의 reference.foot만 검사한 것이 아니다.

왼쪽 바퀴 최저 gap=3.7535392828467593 world, 오른쪽=0. 모든 바퀴 vertex가 지지면 위이거나 접촉하며 묻힘은 없다. 왼쪽 약3.75world(일반 .8줌 약3픽셀)의 작은 들림은 불규칙한 기존 바퀴 polygon과 꺾인 실제 지지면의 차이다. 양쪽 바퀴가 모두 완전 접촉한다고 과장하지 않는다.

시각 가림은 별도다. 기존 same-layer 후순서 `sq-art-carrier-rubble` 및 위쪽 실제 `sq-old-road`와 겹친다. cart 내부2world 간격 probe 결과 body1675점 중887점이 해당 불투명 도형에 겹치고, 오른쪽 바퀴303점 중290점이 잔석 도형에 겹친다. 이는 기하 표본이며 실제 픽셀 비율이 아니다. 최종 수레 캡처에서도 가림이 남는다. 수레를 전경에 강제로 그려 상부 solid를 뚫어 보이게 하거나 실제 위치·지형을 옮기지 않았다. **수레 식별성은 미충족**이다.

## 검증·원본·보류

물리 terrain/worldTerrain/units/markers/events/routes/기획·revision·기존 환경·타29장/Library 정의 동일성, 실제 common terrain/polygon/vector 호출, 렌더 순수성, author2회 동일성, build 통과. `tests/stage12-common-full.mjs`는 의도된 시각 참조 변경 두 필드만 명시적으로 기대하고 그 밖의 데이터 동일성을 검사한다. 정상 전투·전체 이동·전체 저장 검사는 반복하지 않았다. 기존 저장을 강제 새 전투로 바꾸지 않았으며 같은 revision 구전투의 embedded 시각 참조도 자동 치환하지 않는다.

수정 소스 e28954cc와 진단 출력 수정6f9acfa1을 각각 원격 push했다. clean6f9acfa1 최종6컷, clean dc8f128a 동일 카메라 전후4쌍, 탈락 회전시험3컷을 전부 직접 열었다. before/final의 최초4 camera rows는 정확히 같고 pageerror0이다. 후속 미술 판정은 **부분 개선·전체 불합격**. 상부/하부 빈 암면, 독립 암체 인상, 수레 가림, 뿌리 끝 접지 한계가 남는다. 추가적인 지형/공통 painter 확대 재설계 없이 부모 검토를 기다린다. master/Pages/13장에는 쓰지 않았다. 접근 거부나 불확실한 외부 쓰기 없음.

| 확인 화면 | 직전 dc8f128a | 최종6f9acfa1 |
| --- | --- | --- |
| 중앙 일반 | [before](evidence/common-links/before/stage12-central-normal.png) | [final](evidence/common-links/final/stage12-central-normal.png) |
| 인물 대비 소나무 | [before](evidence/common-links/before/stage12-old-road-party.png) | [final](evidence/common-links/final/stage12-old-road-party.png) |
| 수레·잔석·위 지형 | [before](evidence/common-links/before/stage12-carrier-cart.png) | [final](evidence/common-links/final/stage12-carrier-cart.png) |
| 모바일 | [before](evidence/common-links/before/stage12-central-mobile.png) | [final](evidence/common-links/final/stage12-central-mobile.png) |

[최종 전체 구조](evidence/common-links/final/stage12-center-overview.png), [최대 줌](evidence/common-links/final/stage12-central-max.png). 실제 cache/바퀴 좌표·로그는 `evidence/common-links/checks/`, 전체 결과·PNG13개 SHA256은 [COMMON_LINKS.json](COMMON_LINKS.json)에 있다.
