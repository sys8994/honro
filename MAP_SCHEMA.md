# Canonical map schema v4

게임·편집기·Agent·JSON 저장은 `schema: "honro-map", version: 4` Project 하나를 사용합니다. 구현은 `shared/map/schema.js`이며 작성 좌표를 반올림하지 않습니다.

Project: `schema/version/name/activeStageId/settings/library/stages`. Settings는 `grid/snap/autosave` 등을 포함합니다. Stage를 만들 때는 `HonroMaps.emptyStage(id,name,width,height)`를 사용합니다. 실제 프로젝트에는 active Stage가 있어야 합니다.

## Stage와 geometry

| 필드 | 의미 |
|---|---|
| `id/name/width/height` | 안정 ID, 이름, 월드 크기 |
| `backdrop` | forest/temple/gate/river/valley/bridge/tree/shrine |
| `camera.focusBounds?` | 선택적 `{left,top,right,bottom}`. Play Bounds를 포함하는 카메라 중심 범위. viewport·충돌 범위가 아님. |
| `metadata` | `stageId:1..10` 수치·콘텐츠 문맥, `campaign` 기존 임무 사용 여부 |
| `terrains/materials/elements/units` | 지형·표면 재질·요소 instance·실제 유닛 |
| `events/encounters/objectives/markers` | 트리거·적 그룹·목표·상호작용 |
| `layers` | id/name/visible/locked. 편집 표시·선택용이며 콘텐츠를 삭제하지 않음 |
| `initialState` | 이전된 캠페인의 초기 환경·임무 상태 |
| `anchors/routes/design/detailStats/meta` | 원본 배치·경로·설계·노트 |

좌표는 world unit, 오른쪽 +x, 아래쪽 +y이며 유닛은 발 기준입니다. Object ID는 한 Stage의 콘텐츠 컬렉션 사이에서 유일합니다. Stage와 Library ID도 각각 유일합니다. width/height는 Play Bounds를 정합니다. 카메라 중심·visual overscan은 [별도 경계 계약](game/docs/CAMERA_BOUNDS.md)을 따르며 저장 지형을 늘리지 않습니다.

- `solid`: `points:[{x,y},...]`에 정확한 닫힌 다각형. 동굴·천장·overhang도 실제 엔진 충돌을 사용합니다.
- `ground/platform`: `control`, `detail:{spacing,roughness,seed,optimizeEpsilon,interpolation?}`, `floor/thickness`. 공통 결정적 생성기를 사용합니다.
- 공통: `baseMaterial/oneWay/breakable/layer/properties`. Properties는 hp·임무 플래그 등 기존 속성을 보존합니다.
- Material: `id/terrainId/kind/x1/x2/reference?/depth/alpha`. 실제 지지면에서 생성합니다. 원본의 명시적 `points/surface/bottom`은 그대로 저장하므로 기존 재질은 지형 편집 시 자동으로 재설계되지 않습니다.
- grass/moss/rock/scree/mud/soil/charred/stone 및 water/shallow-water를 실제 Scene 재질로 컴파일합니다. 물의 표면은 수평이고 바닥은 지지면을 따릅니다.
- 명시적 `water-pool`의 `conductive:true`는 surface/bottom을 엔진 Water에도 연결합니다. 고체 충돌을 만들지 않으며 전격 전도는 실제 바닥 높이 안으로 제한합니다. `grass-mass`의 선택적 `colors:[top,bottom]`은 작성한 잔디 면의 색을 지정합니다.

## Element asset / instance

배경 공간의 기준은 [환경 구도 스키마](game/docs/ENVIRONMENT_COMPOSITION.md)와 `shared/map/environment.js`다. 유한 배경은 `stage.environment`의 zones/groups/surfaces/placements에 저장한다. 배치의 x/y는 그룹 내부 x와 지지면 부착 오프셋이며 L1 요소 좌표와 다르다. `reference`가 물리 높이·벡터 경계·바닥 기준·허용 scale을 제공한다. 현재 환경 버전은 `HonroEnvironment.VERSION`을 참조한다.

Asset: `id/name/category/visual/collision/anchor/sockets/material/breakable/oneWay/climbable/interactionType/layer/tags/params`. Visual은 점 기반 polygon/path로 `points/fill/stroke/alpha/lineWidth/closed`를 사용합니다. 임의 SVG 문자열을 실행하지 않습니다.

`collisionMode:independent`는 그림 randomize/simplify 시 충돌을 유지합니다. Visual 모드는 그림에 충돌을 맞출 수 있습니다. Anchor를 기준으로 instance의 `x/y`, radians `rotation`, `scale`을 그림·충돌·소켓에 동일 적용합니다. Instance에는 `id/assetId/layer/snap`도 있습니다. 명령 회전 입력은 degrees, 저장은 radians입니다.

원본 소품은 `renderer:landmark, kind`가 실제 procedural Scene 에셋을 고릅니다. 새 폴리곤은 일반 asset으로 그립니다. `climbable`은 지형 메타데이터로 보존하며 기존 점프/발판 이동을 사용합니다. RC21에 없던 사다리·수영 조작은 추가하지 않았습니다.

InteractionType이 있는 요소는 소켓마다 `instanceId:socket:socketId` marker를 만듭니다. 소켓이 없으면 anchor를 씁니다. 사용하면 `interact:<markerId>` flag를 세웁니다.

## Units / events / objectives

`HonroUnits.catalog()`는 네 영웅, 몬스터, `ally:<role>`, `object:<type>`, 실제 보스 목록입니다. Unit: `id/kind/team/x/y/facing`, 선택적 `rank/levelOverride/encounterGroup/behavior/boss/miniboss/stageOverrides`. Team은 player/enemy/ally/npc입니다. Level은 엔진 level에 적용하고 player에는 성장 수치도 적용합니다. Enemy의 캠페인 밸런스 곡선을 재설계하지 않으며 명시적 수치 변경은 stageOverrides를 사용합니다.

이관 유닛의 `runtimeTemplate:true`는 원본 전체 속성을 보존합니다. Kind 변경 시 새 실제 정의로 교체합니다. Profile 성장·난이도는 실행 시 적용합니다.

Event의 `when`은 기존 encounter 조건입니다. 없으면 `x/y/radius` 또는 `width/height` 영역으로 감지합니다. Action은 기존 spawn/sniperAmbush/ally/wind/fog/rest/break/multi 등을 사용합니다. Lines는 실제 Story queue에 들어갑니다. 실행은 투사체·낙하가 끝난 턴 경계입니다.

Encounter: `id/unitIds/behavior(default|aggressive|stationary)`. Objective: `reach/clear/destroy/interact/flag`, `targetId/flag/x/y/radius/required`. 기본 `campaign` 목표는 기존 임무 코드를 사용하고 추가 목표도 함께 평가합니다. Custom map은 필수 목표를 모두 달성하면 완료하며 목표가 없으면 탐색 상태를 유지합니다.
