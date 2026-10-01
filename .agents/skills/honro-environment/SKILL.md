---
name: honro-environment
description: HONRO의 배경·장식 벡터, 지지면과 풍경 묶음, 수직 맵 구도, 대기·빛·물 표현과 환경 편집 workflow를 제작하거나 수정할 때 사용한다. 전투·캐릭터 미술에는 적용하지 않는다.
---

# HONRO 환경 제작

공간·분류·프리셋·검증의 기준은 `shared/map/environment.js`의 `HonroEnvironment`다. 수치표나 enum을 문서에 복사하지 않는다. 깊이식은 `factor/ratio/vectorScale`, 구도는 `groupTransform/placementScreen/surfaceY`, 미술은 `ATMOSPHERES/FINISH/assetRole`를 확인한다. 현재 설계·저장 이관은 `game/docs/ENVIRONMENT_COMPOSITION.md`, 전체 분류는 자동 생성 `game/docs/ENVIRONMENT_INVENTORY.md`에 있다.

## 조사와 배치

1. README·AGENTS·BUGFIX_CONTEXT·BUG_LOG의 관련 항목을 읽는다. 활성 맵 `shared/data/campaign.json`과 `shared/data/elements.json`에서 지형, 카메라 범위, 기존 에셋과 현재 구역을 확인한다.
2. 플레이 공간과 배경을 나눈다. 충돌·상호작용·전장과 접점을 공유하는 장식은 L1이다. L1의 back/prop/front는 그리기 순서다. 캐릭터와 탄의 투영·물리는 건드리지 않는다.
3. 에셋의 `reference.heightM/bounds/foot/scaleRange/backgroundRange`를 정한다. 화면에 맞추려고 실제 크기나 개별 시차·줌 계수를 조작하지 않는다. 벡터를 미터 좌표로 다시 그릴 필요는 없다.
4. 유한 배경은 stage.environment의 group을 선택한다. 깊이·수직 모드·zone은 부모 group에서 공유한다. 배치의 x는 group 내부 좌표이고, supportId가 있으면 y는 지지면으로부터의 부착 오프셋이다. 나무 밑동·건물 기단·바위 바닥·폭포 상단은 surface에 붙인다. `scenery.place`가 기본 접지하고 드래그는 지지면을 따라간다.
5. `VERTICAL_MODES` 중 장면에 맞는 모드를 선택한다. WORLD는 기존 측면 월드 공간, SCENIC은 풍경 묶음, HORIZON은 구역 내 제한된 수직 구도, SKY는 별도 viewport 공간이다. 깊이가 증가해서 높이가 올라가는 카메라 pitch나 개체별 yFactor를 추가하지 않는다.
6. 수직 이동이 큰 맵은 연결된 zones와 overlap을 작성한다. opacity·구도·대기는 camera world y로 전환하고 zoom으로 zone을 결정하지 않는다. support는 `COVERAGE`의 최소 줌·최대 화면·stage bounds까지 덮어야 한다.
7. atmosphere preset을 선택한 뒤 필요한 항목만 overrides에 둔다. Workshop의 Depth → Zone/Group → Support를 사용한다. 그룹 모드·지지면 점·구역 경계는 고급 편집과 `shared/map/commands.js`의 API로 수정한다.

```js
HonroWorkshopAPI.applyCommands([{
  op:'scenery.place', stageId:'stage-3', id:'pine-by-bank',
  assetId:'ancient_pine', depthLayer:'L2', groupId:'landscape-L2',
  supportId:'landscape-L2-support', localX:1800, scale:1
}]);
```

## 미술과 렌더링

- 실루엣과 큰 색면을 먼저 만든다. 가지·균열·창호는 제한하고 반복 미세무늬를 늘리지 않는다. 먼 식생은 개별 나무보다 숲 mass를 우선한다.
- 거리별 대비·채도·색 혼합은 FINISH와 atmosphere가 결정한다. 먼 물체를 무조건 흰색으로 만들지 않는다. 숲·계곡·동굴·사찰·왜곡된 영역의 팔레트를 구분한다.
- gradient는 큰 명암과 조명 구조, 안개는 계곡 바닥·능선 허리·폭포 하단, 빛은 입구·달·등불 같은 맥락을 갖는다. 강한 효과는 L1 뒤에 둔다.
- 실제 렌더러는 Canvas다. `shared/runtime/environment-art.js`의 재사용 Path2D, gradient, clip, fog card를 사용한다. SVG를 강제로 새 DOM renderer로 바꾸지 않는다. 그림과 미리보기는 공통 렌더러를 쓴다.
- 물은 깊이 gradient·물가·움직이는 곡선·반사, 폭포는 clipped ribbon·상단 포말·하단 splash/mist를 가진다. `Scene.liveWater`는 정적 월드 캐시 밖에서 호출된다. stage별 중복 물 애니메이션을 추가하지 않는다.
- Scene.time과 reduced-motion 정책을 공유한다. transform/opacity를 우선하고 매 프레임 경로 재생성·전체 화면 blur/turbulence·다량 particle을 피한다. 정적 경로는 prepare 캐시, fog card는 bounded 캐시를 재사용한다.

## 소스와 검증

게임·Stage View·Playtest는 `shared/build.mjs`의 동일 목록을 사용한다. HTML은 생성물이다. 기준 나무의 시각 제작 소스는 `tools/environment/polish-assets.mjs`, 맵 재현은 `migration/migrate-stages.mjs`와 `workshop/recipes/`다. 활성 맵을 바꾸면 재생성 경로에도 반영한다.

- `node tools/environment/validate.mjs`: 현재 또는 인자로 전달한 프로젝트의 지지·group·zone·scale·coverage·금지 시차 값을 검사한다. 애매한 옛 배치를 조용히 성공으로 처리하지 않는다. migrationNotes를 검토한다.
- `node tools/environment/inventory.mjs`: 분류표와 로컬 상세 JSON을 갱신한다.
- 빌드 후 `npm.cmd run test:environment`: 깊이, 접지, 수직 sweep, 저장·로드, Game/Workshop/Playtest, 실제 물 프레임을 확인한다.
- `python -X utf8 tests/environment-performance.py after`: 데스크톱·모바일 크기·최대 줌·물/안개 장면을 단독 실행한다. before는 Git HEAD의 HTML을 비교한다.
- 스키마·렌더러 변경은 `node tests/migration.mjs`, `python -X utf8 tests/integration.py`와 `npm.cmd run verify`를 통과시킨다. 성능 검사는 다른 브라우저 작업과 겹치지 않는다.

숲·수직 계곡의 바닥/중턱/정상·물·폭포·동굴·최대 줌 화면을 직접 본다. 수치 통과가 미술 승인을 대신하지 않는다. 발견한 실제 문제에 따라 수정하고 해당 검사를 반복한다. 캐릭터·조준선 가독성도 확인한다. 스크린샷·성능 결과는 `_local/reports/environment-v2/`, 일회성 보고서는 `_local/archive/`, 유지보수 설계와 원인·검증·한계는 game/docs에 기록한다.
