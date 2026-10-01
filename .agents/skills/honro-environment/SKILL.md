---
name: honro-environment
description: HONRO의 배경·장식 벡터 제작, 맵 배치와 디자인, 깊이·크기·카메라 반응을 공통 공간 체계로 수정할 때 사용한다.
---

# HONRO 환경 제작

배경과 전장 요소의 공간 규칙은 `shared/map/environment.js`의 `HonroEnvironment`가 정의한다. 수치·수식을 문서에 복사하지 말고 그 파일의 `REFERENCE_SCALE`, `WORLD_UNITS_PER_METER`, `D0_METERS`, `PRESETS`, `factor`, `screen`, `world`, `vectorScale`을 확인한다. 실제 렌더링은 `shared/runtime/environment-renderer.js`, 전장 순서는 `shared/runtime/renderer.js`, 맵 스키마·검증은 `shared/map/schema.js`와 `shared/map/environment.js`에 있다. 게임·Stage View·Playtest는 `shared/build.mjs`의 같은 번들을 사용한다.

작업 순서:

1. `README.md`, `AGENTS.md`, 관련 `game/docs/BUGFIX_CONTEXT.md`·`BUG_LOG.md`를 읽고 `shared/data/elements.json`, `shared/data/campaign.json`, `game/docs/ENVIRONMENT_INVENTORY.md`에서 비슷한 에셋과 기존 배치를 찾는다.
2. 에셋의 `reference.heightM`, `reference.bounds`(벡터 경계), `reference.foot`(뿌리·바닥 부착점), `reference.scaleRange` 및 배경용 `backgroundRange`를 정의한다. 벡터 좌표 자체를 미터 단위로 다시 그리지 않는다. 물리 크기 차이만 `scale`로 표현한다.
3. 스테이지 `environment.preset`과 `HonroEnvironment.PRESETS`의 L2–L4 중 활성 깊이를 고른다. 지형·충돌·상호작용·지면 부착 장식은 `st.elements`의 `depthLayer:'L1'`로 둔다. 이때 `back`/`prop`/`front`는 그리기 순서다. 하늘·달은 L5 전용 표시로 둔다. 동굴·실내형 `enclosed`에는 하늘과 L4를 추가하지 않는다.
4. 유한 배경은 `st.environment.placements`의 `{id,assetId,depthLayer,x,y,scale,rotation,group}`로 배치한다. Workshop에서는 Depth를 고른 후 배치·선택·드래그한다. 명령 API는 `shared/map/commands.js`의 `scenery.place`, `object.update`, `move`, `delete`를 쓴다. 같은 풍경 묶음은 같은 깊이를 사용한다. 절차적 기본 배치는 `HonroEnvironment.makePlacements`가 생성하며 개체별 무작위 깊이를 두지 않는다.
5. `node tests/environment-depth.mjs`, `node tools/environment/inventory.mjs`, `python -X utf8 tests/environment-browser.py`를 실행한다. 실제 게임·에디터의 카메라 XY 이동, 최소·최대 줌, 저장·로드를 확인한다. 스키마/렌더러 변경은 `node tests/migration.mjs`와 `python -X utf8 tests/integration.py`도 통과시킨다. 상세 분류 목록은 인벤토리 생성기로 갱신한다.

실제 등록된 `ancient_pine`은 `reference.heightM`과 벡터 경계를 `shared/data/elements.json`에 가진다. 예를 들어 Stage 3의 근경 나무를 추가할 때 다음 명령을 사용한다. 같은 에셋을 `L3`에 놓으면 별도 크기·이동 보정 없이 깊이식에 따라 함께 작아진다.

```js
HonroWorkshopAPI.applyCommands([{
  op:'scenery.place',stageId:'stage-3',id:'pine-by-bank',
  assetId:'ancient_pine',depthLayer:'L2',x:1800,y:1600,scale:1,
  group:'bank-grove'
}]);
```

`shared/data/campaign.json`은 `migration/migrate-stages.mjs`와 Workshop 레시피로 재생성된다. 맵을 다시 생성해야 하는 변경은 그 경로에도 반영하고 `npm.cmd run migrate` 후 검증한다. 생성된 HTML은 직접 수정하지 않는다.
