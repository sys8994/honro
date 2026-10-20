---
name: honro-environment
description: HONRO에서 사용자가 준 일러스트를 SVG 배경으로 재구성하고 variation·미세 패럴랙스·색감·밤톤을 적용하거나, 월드 장식·지지면·대기·물을 제작하고 수정할 때 사용한다. 전투·캐릭터 미술에는 적용하지 않는다.
---

# HONRO 환경 제작

공간·분류·프리셋·검증의 기준은 `shared/map/environment.js`의 `HonroEnvironment`다. 수치표나 enum을 문서에 복사하지 않는다. 깊이식은 `factor/ratio/vectorScale`, 구도는 `groupTransform/placementScreen/surfaceY`, 미술은 `ATMOSPHERES/FINISH/assetRole`를 확인한다. 현재 설계·저장 이관은 `game/docs/ENVIRONMENT_COMPOSITION.md`, 전체 분류는 자동 생성 `game/docs/ENVIRONMENT_INVENTORY.md`에 있다.

## 현행 제작 방식: 벡터 근경 + 이미지 원경

`game/docs/STAGE_PRODUCTION_SOP.md`와 `game/docs/MAP_ART_PIPELINE.md`를 따른다. 승인된 기존 벡터 지형·공통 에셋과 장별 이미지 원경을 유지하며 새 장 개편은 실제 이동/사격 동선과 미술을 함께 저작한다. 과거 순수 SVG 원경 기본 규칙 및 이미지 지형 시범은 현행 기본이 아니다. 실패 미술 교정 구현을 재사용하지 않는다.

원경은 장소·실내외·skyVisible에 맞추고 공통 로딩/캐시·시차·크롭을 유지한다. 근경 전체의 뒤쪽 지표·보행면·앞 경사면을 충돌면만으로 잘라내지 않는다. 한 장소의 연결된 지질 형태와 접지를 만들고 필요한 가림은 렌더 순서로 처리한다.

장 개편은 서로 다른 실제 화면을 직접 보는 집중 검수 최소 3회와 최종 소스의 별도 종합 검수를 수행한다. 세부 회차·증거·관련 플레이·사용자 화면 승인 조건은 SOP가 기준이다. 제한된 렌더 연결 작업의 최소 검사를 전체 개편 완료로 확장하지 않는다. 사용자 승인 전 다음 장 진행과 해당 개편의 master/Pages 반영은 하지 않는다.

## 플레이 경계·카메라·단일 지형

- 맵 v6는 **하나의 충분히 큰 지리 설계 → 내부 Play Bounds → Camera Focus와 전술 줌 → 시각 coverage 확인** 순서다. `shared/map/terrain-domain.js`와 `game/docs/TERRAIN_DOMAIN.md`를 따른다.
- `stage.terrains` 전체 polygon이 유일한 원본이다. 공통 compiler는 기존 시뮬레이션 범위로 collision을 투영하고 Scene은 전체 형상을 같은 재질/미술로 렌더링한다. 새 맵에 별도 dummybody나 skirt를 만들지 않는다. 옛 live save만 원래 renderer를 호환 유지한다.
- `shared/map/bounds.js`의 play/focus/visual/terrain을 구별한다. width/height와 Play Bounds는 기존 게임 좌표계다. 외곽 확대로 이동·스폰·탄 수명·낙사를 확장하지 않는다.
- 야외 능선은 실제 단면에서 이어진다. 동굴 바닥/천장은 통로를 남기고 부분 입구/출구 위는 유한 산세와 하늘로 마감한다. 기존 닫힌 문·개방 조건·공중 통로를 메우지 않는다.
- 전술 줌은 가로 world 시야와 actor 식별 크기로 정한다. SKY와 L1–L4 미세 시차/깊이는 유지한다.
- 정적 미술은 Play Bounds와 무관한 월드 고정 tile을 사용한다. 실제 픽셀 clip/gutter의 단일 alpha, bounded cache bytes, 팬 재사용과 큰 사물의 실제 transformed bounds를 검사한다.
- 지형·카메라 변경은 해당 구간 이동·화면·퀘스트를 확인하고 저장/충돌에 영향이 있으면 그 항목만 확인한다. `test:terrain-domain`, `test:camera`와 기존 환경·migration·통합 검사는 필요한 경우 선택한다. Native와 실제 브라우저 확인을 구분한다.

## 조사와 배치

1. README·AGENTS·BUGFIX_CONTEXT·BUG_LOG의 관련 항목을 읽는다. 활성 맵 `shared/data/campaign.json`과 `shared/data/elements.json`에서 지형, 카메라 범위, 기존 에셋과 현재 구역을 확인한다.
2. 아래 배치 규칙은 게임 월드에 놓는 유한 장식·풍경에 적용한다. 원경 이미지 속 먼 실루엣과 구분한다. 밑동이 보이는 나무, 작은 건물, 바위·뿌리·수풀처럼 실제 지형에 붙은 장식은 우선 L1-back에 둔다. L1의 back/prop/front는 그리기 순서다. 캐릭터와 탄의 투영·물리는 건드리지 않는다.
   중경 L2/L3는 맞은편 숲·절벽·동굴 벽·사당 등 장소를 설명할 때만 만들고 빈 곳을 채우기 위해 반복 배치하지 않는다. L4는 지형 전체의 큰 먹산 덩어리와 여백을 맡는다. 1장은 L1의 나무와 하나의 연속된 원경 산세가 기본이며 중경 상시 배치를 하지 않는다.
3. 에셋의 `reference.heightM/bounds/foot/scaleRange/backgroundRange`를 정한다. 화면에 맞추려고 실제 크기나 개별 시차·줌 계수를 조작하지 않는다. 벡터를 미터 좌표로 다시 그릴 필요는 없다.
4. 유한 배경은 stage.environment의 group과 support를 사용한다. L2는 뒤쪽 지형과 그 위의 접지된 나무·바위·건물, L3/L4는 큰 숲·산·계곡 벽 덩어리를 우선한다. 배치 x는 group 내부 좌표이고 y는 지지면으로부터의 부착 오프셋이다. 나무 밑동·건물 기단·바위 바닥·폭포 상단은 surface에 붙인다. `scenery.place`가 기본 접지하고 드래그는 지지면을 따라간다.
5. 유한 그룹은 WORLD의 고정 월드 높이를 쓴다. 수평 이동·크기·줌은 기존 거리식을 유지하고, 카메라 수직 이동은 L1–L4가 같은 비율로 따른다. SKY만 viewport 공간이다. SCENIC/HORIZON 화면 재배치, zone opacity 전환, 개체별 yFactor, 카메라 높이별 offset 표를 새로 만들지 않는다. 이전 모드는 환경 버전 3 이관에서 재생성한다.
6. 수직 맵의 상부·중턱·하부를 실제 월드 위치에 구성한다. support와 겹침으로 계곡·동굴의 높이와 접지감을 표현한다. zones는 편집 위치 선택과 연속적인 대기값에만 사용하고 배경 형상·투명도를 바꾸지 않는다. support는 `COVERAGE`의 최소 줌·최대 화면·stage bounds까지 덮어야 한다.
7. atmosphere preset을 선택한 뒤 필요한 항목만 overrides에 둔다. Workshop의 Depth → Zone/Group → Support를 사용한다. 지지면 점·구역 경계는 고급 편집과 `shared/map/commands.js`의 API로 수정한다.

```js
HonroWorkshopAPI.applyCommands([{
  op:'scenery.place', stageId:'stage-3', id:'pine-by-bank',
  assetId:'ancient_pine', depthLayer:'L2', groupId:'landscape-L2',
  supportId:'landscape-L2-support', localX:1800, scale:1
}]);
```

## 미술과 렌더링

- 제작 순서는 **역할 → layer → 지지 지형 → primary silhouette → 2–4개 큰 secondary form → material breakup → 같은 광원 방향의 light/shadow → atmosphere → 필요한 표시 크기 확인**이다. 디테일은 path 수나 미세 무늬를 늘린다는 뜻이 아니다. 큰 면 분할, planar shading, 재질 구분, 겹침, 조명 일관성을 우선한다.
- 기본 조형 언어는 한국화의 진경산수·수묵담채다. 큰 불규칙 산세, 비대칭 소나무, 먹의 농담처럼 보이는 넓은 명암면, 능선 허리와 계곡 바닥의 안개, 비어 있는 하늘을 사용한다. 작은 삼각형 반복·선/균열/노이즈 수 증가는 완성도로 세지 않는다. 원경은 한 층이어도 실루엣·어깨 능선·큰 암면·하단 연무로 깊이를 만든다.
- 나무는 몸통의 밝은/어두운 면, 2–4개 큰 가지, 비대칭 수관 3–5덩어리로 읽히게 한다. 바위·절벽·산에는 큰 밝은 면·그림자 면·접촉 그림자를, 건물에는 지붕 실루엣·처마·벽 앞/옆면·기단을 둔다. 최대 축소에서 사라지는 잎·균열·기와 줄은 핵심 형태로 세지 않는다.
- 거리별 대비·채도·색 혼합은 FINISH와 atmosphere가 결정한다. 먼 물체를 무조건 흰색으로 만들지 않는다. 숲·계곡·동굴·사찰·왜곡된 영역의 팔레트를 구분한다.
- gradient는 큰 명암과 조명 구조, 안개는 계곡 바닥·능선 허리·폭포 하단, 빛은 입구·달·등불 같은 맥락을 갖는다. 강한 효과는 L1 뒤에 둔다.
- 실제 렌더러는 Canvas다. `shared/runtime/environment-art.js`의 재사용 Path2D, gradient, clip, fog card를 사용한다. SVG를 강제로 새 DOM renderer로 바꾸지 않는다. 그림과 미리보기는 공통 렌더러를 쓴다.
- 물은 깊이 gradient·물가·움직이는 곡선·반사, 폭포는 clipped ribbon·상단 포말·하단 splash/mist를 가진다. `Scene.liveWater`는 정적 월드 캐시 밖에서 호출된다. stage별 중복 물 애니메이션을 추가하지 않는다.
- Scene.time과 reduced-motion 정책을 공유한다. transform/opacity를 우선하고 매 프레임 경로 재생성·전체 화면 blur/turbulence·다량 particle을 피한다. 정적 경로는 prepare 캐시, fog card는 bounded 캐시를 재사용한다.

## 소스와 검증

게임·Stage View·Playtest는 `shared/build.mjs`의 동일 목록을 사용한다. HTML은 생성물이다. 기준 나무의 시각 제작 소스는 `tools/environment/polish-assets.mjs`, 환경 원본은 `shared/map/environment.js`와 `tools/environment/regenerate.mjs`다. 후자는 활성 캠페인의 게임플레이 필드를 보존하고 환경만 다시 생성한다. 맵 전체 재현은 `migration/migrate-stages.mjs`와 `workshop/recipes/`다.

- `node tools/environment/validate.mjs`: 현재 또는 인자로 전달한 프로젝트의 지지·group·zone·scale·coverage·금지 시차 값을 검사한다. 애매한 옛 배치를 조용히 성공으로 처리하지 않는다. migrationNotes를 검토한다.
- `node tools/environment/inventory.mjs`: 분류표와 로컬 상세 JSON을 갱신한다.
- 환경 로직을 바꿨을 때 필요에 따라 빌드 후 `npm.cmd run test:environment`: 깊이, 접지, 수직 sweep, 저장·로드, Game/Workshop/Playtest, 실제 물 프레임을 확인한다.
- 성능 관련 변경/문제가 있을 때 `python -X utf8 tests/environment-performance.py after`: 데스크톱·모바일 크기·최대 줌·물/안개 장면을 단독 실행한다. before는 Git HEAD의 HTML을 비교한다.
- 스키마·렌더러 변경은 실제 영향받는 저장 호환성·합성·이동만 선별 확인한다. 전체 migration·integration·verify를 자동 실행하지 않는다. 선택한 성능 검사는 다른 부하와 겹치지 않는다.

바꾼 구간의 결과 이미지와 필요한 모션만 직접 본다. 수치 통과가 미술 승인을 대신하지 않는다. 실제 관련 결함을 수정했다면 해당 항목만 다시 확인한다. 무관한 전체 장 순회는 요구하지 않는다. 장 개편의 3회 집중 검수와 종합 검수는 위 SOP를 따른다. 캐릭터·조준선 가독성도 확인한다. 스크린샷·성능 결과는 `_local/reports/environment-v3/`, 일회성 보고서는 `_local/archive/`, 유지보수 설계와 원인·검증·한계는 game/docs에 기록한다.
