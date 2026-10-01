# 환경 구도와 대기 표현

현재 배경은 `shared/map/environment.js`의 거리 투영 위에 지지면·풍경 묶음·높이 구역을 결합한다. Game, Stage View, Playtest가 같은 데이터와 Canvas 렌더러를 사용한다. `environmentVersion`과 stage environment의 `version`은 코드의 `VERSION`으로 관리한다. 맵 본체 스키마와 전투 저장 형식은 유지한다.

## 공간의 기준

엔진의 x/y는 기존 좌우/아래 방향 그대로다. 요청서의 높이 Z는 엔진 y에 해당한다. `factor(d,z)`는 화면 크기·수평 카메라 반응·줌을 함께 결정한다. 거리 때문에 화면 높이를 올리는 pitch는 없다.

L1은 전장과 같은 평면의 모든 요소다. 비상호작용 나무·구조물도 포함하며 back/prop/front는 그리기 순서다. 배경의 수직 반응만 `groupTransform`으로 정한다. WORLD는 기존 월드 투영, SCENIC은 풍경 단위의 구도, HORIZON은 구역 진행에 따른 제한된 높이 이동이다. SKY는 별도 viewport 경로이며 finite depth에 무한대를 넣지 않는다.

## 저장 데이터

stage.environment에는 다음 데이터가 있다.

- `preset`: 기존 거리 preset. `atmosphere.preset/overrides`: 미술 팔레트와 대기 설정.
- `zones`: 연속된 from/to 월드 높이, 경계 blend 폭, scenic/horizon 화면 높이 envelope, 선택적 atmosphere override.
- `groups`: id, depthLayer, verticalMode, zoneId, x/y 원점. 모든 자식이 같은 transform과 opacity를 공유한다.
- `surfaces`: id, groupId, kind, x 오름차순의 local points, bottom. 충돌과 관계없는 시각 지형이다.
- `placements`: assetId, groupId, supportId, depthLayer, x/y, scale, rotation. x는 그룹 내부 위치, y는 지지면으로부터의 부착 오프셋이다. 지지면을 이동·편집하면 모든 자식의 접점이 함께 움직인다.

기본 rooted 배치는 오프셋 0이다. `reference.foot`을 지지면에 놓고 에셋 크기는 기존 물리 크기와 depth에서 계산한다. 폭포의 부착점은 절벽 상단이다. `placementScreen`, `screenBounds`, `groupWorld`를 렌더링·선택·드래그에서 함께 사용한다. 그룹을 옮기기 위해 자식별 보정 값을 저장하지 않는다.

구역 경계는 겹치는 smoothstep 가중치를 정규화해 연속으로 전환한다. 가중치와 envelope는 camera world y만 읽으므로 줌이 구역 선택을 흔들지 않는다. 수직 맵은 상부·중턱·바닥을 가진다. 숲과 구조물의 배치는 지지면과 함께 구성하고 먼 숲은 mass asset으로 묶는다.

`coveragePad`가 최소 줌, 최대 CSS viewport와 단계 경계를 사용해 지지면을 생성한다. 검증 대상 화면 범위는 `COVERAGE`에서 읽는다. 화면 해상도 기준을 늘릴 때는 이 registry와 generated maps를 함께 갱신한다.

## 팔레트와 재사용 그림

`ATMOSPHERES`는 숲·계곡·폐허·동굴·사찰·왜곡된 영역을 구분한다. 색/빛/물/안개 값은 공통 preset에서 상속하고 stage와 zone이 일부만 덮어쓴다. `FINISH`는 가까운 장식의 대비를 남기고 먼 풍경을 해당 장면의 공기색에 섞는다. L1의 캐릭터·적·투사체·예측선에는 배경 haze를 적용하지 않는다.

`environment-art.js`의 gradient, glow, shaft, fog, pool, waterfall이 공통 미술 primitive다. SVG 요청의 hard clip은 실제 Canvas clip, soft mask는 gradient/fog card로 구현했다. 기존 벡터 제작과 Canvas 엔진을 보존하기 위한 선택이다.

정적 배경 경로는 환경 객체별 WeakMap의 Path2D로 준비한다. 안개는 제한된 수의 작은 canvas card를 재사용하며 팔레트 캐시 크기를 제한한다. 실제 움직임은 기존 Scene.time과 reduced-motion 설정을 사용한다. 새로운 RAF/CSS 애니메이션 루프는 없다.

기존 3장 전용 `liveWater`는 공통 패스로 교체했다. 현재 물 재질의 실제 polygon 안에 gradient·5개 흐르는 곡선·물가·반사·진입 파문을 그린다. 폭포는 정적 암면 위에서 clipped ribbon, 상단 포말, 하단 splash/mist를 움직인다. 이 패스는 월드 캐시 다음, 유닛·조준선 이전이다. 물 전도·충돌 영역은 변경하지 않는다.

## 편집과 명령

Workshop에서 에셋을 고르고 Depth → Zone/Group → Support를 선택한다. 기본 이동은 뿌리를 지지면에 유지한다. 선택 시 지지선을 표시한다. 그룹 모드 변경은 그 지형과 모든 자식에 적용된다. Atmosphere 선택은 별도의 ENVIRONMENT 패널에 있고 그룹·지지면 점·구역 경계는 고급 JSON 편집에서 작성한다.

명령은 `scenery.place`, `scenery.attach`, `scenic.add`, `support.add`, `zone.update`, `environment.set`과 기존 `object.update/move/delete`를 사용한다. 연결된 support/group/zone을 삭제하면 dangling reference가 검증 오류가 되므로 같은 명령 묶음에서 자식도 정리해야 한다. 저장·undo·redo·export·Playtest는 기존 finalize 경로를 사용한다.

## 이관과 오류

환경 1의 기본 절차적 풍경은 지지면을 가진 새 구도로 재생성한다. 명시적으로 작성한 배치 ID는 남기고 같은 깊이의 그룹/지지면에 붙이며 옛 y가 바뀐 항목을 migrationNotes에 기록한다. 해석할 수 없는 에셋·깊이는 그대로 남겨 validator가 오류를 보고한다. 기준 scale을 바꿔 구도 오류를 숨기지 않는다.

옛 전투와 배경 필드가 없는 연습장은 `ensureBattle`이 별도 WeakMap에 새 환경을 계산한다. 렌더링은 직렬화된 전투 객체를 전혀 변경하지 않으며 저장된 지형, 유닛 위치/HP, 비행 탄, 진행과 성장 데이터는 그대로다. 커스텀 배경 에셋도 저장된 asset에서 복원한다.

`node tools/environment/validate.mjs [project.json]`은 rooted support, 그룹/구역 참조, layer와 mode, 기준 크기, 대기 override, 구역 연결, 최대 줌 coverage, 옛 개체별 시차 필드를 검사한다. 전체 에셋·절차 생성물 분류는 `ENVIRONMENT_INVENTORY.md`와 inventory 생성기가 담당한다.

검사는 `tests/environment-depth.mjs`, `tests/environment-composition.mjs`, `tests/environment-browser.py`, `tests/environment-composition-browser.py`, `tests/environment-performance.py`에 있다. 시각·성능 결과는 `_local/reports/environment-v2/`에 저장한다. 마이그레이션 비교는 전투 데이터 보존과 레시피 재현도 함께 확인한다.
