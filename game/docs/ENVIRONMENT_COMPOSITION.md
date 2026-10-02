# 환경 구도와 대기 표현

현재 배경은 `shared/map/environment.js`의 거리 투영 위에 월드 고정 지지면과 풍경 묶음을 결합한다. Game, Stage View, Playtest가 같은 데이터와 Canvas 렌더러를 사용한다. `environmentVersion`과 stage environment의 `version`은 코드의 `VERSION`(현재 4)으로 관리한다. 맵 본체 스키마와 전투 저장 형식은 유지한다.

## 공간의 기준

Play Bounds·카메라 중심·시각 여유는 별개의 범위다. viewport가 맵을 벗어나도 되며 좌우는 실제 끝의 높이·기울기를 이어받는 산비탈·능선 extension, 아래는 지하 암반으로 연결한다. 모두 충돌 없는 공통 skirt다. 맵을 일괄적으로 절벽 꼭대기에 고립시키지 않는다. 가로 전술 줌·portrait·편집기 Bounds·저장 규칙은 [카메라 경계](CAMERA_BOUNDS.md)를 따른다. 이 처리는 아래 유한 그룹의 투영과 SKY의 미세 시차를 바꾸지 않는다.

엔진의 x/y는 기존 좌우/아래 방향 그대로다. 요청서의 높이 Z는 엔진 y에 해당한다. `factor(d,z)`는 화면 크기·수평 카메라 반응·줌을 함께 결정한다. 유한 그룹의 화면 원점 Y는 `viewportHeight/2 + (group.y - camera.y) × zoom`이다. 따라서 카메라 높이가 100 이동하면 L1–L4가 모두 `100 × zoom`만큼 함께 움직인다. depth는 Y 카메라 반응에 곱하지 않는다.

L1은 전장과 같은 평면의 모든 요소다. 비상호작용 나무·구조물도 포함하며 back/prop/front는 그리기 순서다. 밑동·기단·바닥이 실제 지형에 닿는 장식은 L1-back을 우선한다. L2/L3는 맞은편 숲·동굴 벽·계곡 절벽·사당처럼 해당 장소를 설명할 때만 만든다. L4는 큰 먹산 덩어리 하나와 하늘의 여백을 맡고, 같은 능선 에셋을 타일처럼 반복하지 않는다. 1장은 L1 장식과 연속된 L4 산세만 사용한다. 유한 그룹은 WORLD만 작성하고 SKY는 별도 viewport 경로다. 옛 SCENIC/HORIZON의 카메라 높이 기반 구도/opacity 변환은 환경 버전 3에서 제거했다.

## 저장 데이터

stage.environment에는 다음 데이터가 있다.

- `preset`: 기존 거리 preset. `atmosphere.preset/overrides`: 미술 팔레트와 대기 설정.
- `zones`: 연속된 from/to 월드 높이, 대기 경계 blend 폭, 선택적 atmosphere override. 배경의 위치·opacity를 선택하지 않는다.
- `groups`: id, depthLayer, WORLD/SKY, zoneId, x/y 원점. 모든 자식이 같은 월드 고정 transform을 공유한다.
- `surfaces`: id, groupId, kind, x 오름차순의 local points, bottom. 충돌과 관계없는 시각 지형이다.
- `placements`: assetId, groupId, supportId, depthLayer, x/y, scale, rotation. x는 그룹 내부 위치, y는 지지면으로부터의 부착 오프셋이다. 지지면을 이동·편집하면 모든 자식의 접점이 함께 움직인다.

기본 rooted 배치는 오프셋 0이다. `reference.foot`을 지지면에 놓고 에셋 크기는 기존 물리 크기와 depth에서 계산한다. 폭포의 부착점은 절벽 상단이다. `placementScreen`, `screenBounds`, `groupWorld`를 렌더링·선택·드래그에서 함께 사용한다. 그룹을 옮기기 위해 자식별 보정 값을 저장하지 않는다.

구역 경계는 겹치는 smoothstep 가중치를 정규화해 **대기값만** 연속으로 전환한다. 가중치는 camera world y만 읽으므로 줌이 구역 선택을 흔들지 않는다. 수직 맵의 상부·중턱·바닥은 각기 고정된 월드 높이에 넓은 겹침으로 그린다. 숲과 구조물은 지지면에 붙이고 L3 이상은 개별 나무 대신 큰 숲 mass와 절벽을 사용한다.

`coveragePad`가 최소 줌, 최대 CSS viewport와 단계 경계를 사용해 지지면을 생성한다. 검증 대상 화면 범위는 `COVERAGE`에서 읽는다. 화면 해상도 기준을 늘릴 때는 이 registry와 generated maps를 함께 갱신한다. 활성 환경만 재생성할 때는 `node tools/environment/regenerate.mjs`를 사용한다. 이 도구는 환경을 제외한 각 스테이지 데이터를 직렬화 비교해 보존한다.

## 팔레트와 재사용 그림

`ATMOSPHERES`는 숲·계곡·폐허·동굴·사찰·왜곡된 영역을 구분한다. 색/빛/물/안개 값은 공통 preset에서 상속하고 stage와 zone이 일부만 덮어쓴다. `FINISH`는 가까운 장식의 대비를 남기고 먼 풍경을 해당 장면의 공기색에 섞는다. L1의 캐릭터·적·투사체·예측선에는 배경 haze를 적용하지 않는다.

`environment-art.js`의 gradient, glow, shaft, fog, pool, waterfall이 공통 미술 primitive다. SVG 요청의 hard clip은 실제 Canvas clip, soft mask는 gradient/fog card로 구현했다. 기존 렌더 경로가 Canvas이므로 SVG DOM으로 다시 짜지 않고 벡터 에셋의 형태 원칙만 적용했다. 산·숲·암석·사당에는 silhouette 뒤에 큰 명암면·재질면을 두고 support 지형에도 2–4개의 넓은 암면을 캐시한다. 작은 잎·균열·기와 수를 늘리는 대신 최대 축소에서도 보이는 형태를 우선한다.

환경 버전 4는 진경산수·수묵담채의 형태 언어를 기준으로 원경을 다시 구성한다. `ink-mountain` 지지면은 화면 바깥까지 이어지는 하나의 불규칙 산세이며, 내부의 어깨 능선과 큰 빛/그림자 암면으로 농담을 만든다. 원경의 색은 청회색·먹색·탁한 녹색에 제한하고, 하단을 연무에 녹인다. 실제 나무는 비대칭으로 기운 줄기·굵은 가지·다섯 수관 덩어리와 밝고 어두운 면으로, 화강암은 여섯 넓은 면으로 읽히게 한다. 중경의 그룹 수와 배치는 `scenicPurpose`의 장소별 이유에 한정한다. 사용자 제작 구형 중경은 이관 시 지지면을 복원해 보존한다.

**현행 1막 화면:** 1–5장의 실제 원경은 [act1-far.svg](../../shared/assets/environment/act1-far.svg), 6–10장은 [act1-gorge.svg](../../shared/assets/environment/act1-gorge.svg)가 맡는다. 둘 다 1600×900 순수 벡터이며 기존 원경의 형태는 보존했다. 새 협곡은 후속 스크린샷의 깊은 계곡·기둥 암봉·먼 능선 소나무·가는 폭포를 같은 먹빛 명암과 안개층으로 재구성했다. 이름 있는 그룹과 gradient/clipPath가 편집 원본이며 래스터 이미지·외부 참조·필터·스크립트를 포함하지 않는다. `shared/build.mjs`가 두 SVG를 Game/Workshop 공통 런타임에 내장하므로 외부 파일 요청 없이 기존 Canvas에 그린다. 이미지 디코드 전에는 기존 벡터 하늘을 임시 표시한다. SVG가 활성화되면 자동 생성 L2~L4 풍경은 그리지 않으며 별도 ID의 Workshop 작성 풍경은 기존 support/depth 변환으로 그린다. 이전 PNG/WebP와 프롬프트는 [제작 이력](../../shared/assets/environment/act1-far.prompt.md)에 보존하며 실행 번들에는 넣지 않는다.

사용자가 요청한 미세 패럴랙스는 유한 지지면이 아닌 **이 두 SKY 원경**에만 적용한다. `ACT1_FAR`와 `act1BackdropFrame`은 화면 크기에 비례하는 여유 영역을 두고 카메라 중심에서 멀어질수록 연속적으로 완만해지는 시차를 계산한다. 수평 반응이 수직보다 크고 zoom·시간에 따라 크기가 변하거나 저절로 흐르지 않는다. 화면 비율과 월드 바깥 극단 카메라에서도 원본 종횡비와 전체 화면 덮임을 유지한다. 세로 화면은 산 중심을 우선해 달이 잘릴 수 있다. L1–L4의 기존 WORLD 투영·지지·줌 규칙은 그대로다.

원경의 낮은 채도·밝기와 얇은 색막은 `ACT1_FAR`가 정하고 `environment-renderer.js`가 원경별 캔버스 두 개에 한 번만 구워 재사용한다. 매 프레임 filter·SVG 경로 생성은 하지 않는다. `act1Mood`의 단계별 색과 강도는 `renderer.js`가 지형·장식·물 뒤에 multiply로 한 번 적용하여 1장부터 10장까지 풍경을 점차 차갑고 어둡게 한다. 캐릭터·탄·조준선·목표 표시·HUD는 그 뒤에 그리므로 전투 가독성을 유지한다. 지형·장식·물의 벡터 노드, 충돌과 저장·진행 데이터는 변경하지 않는다.

벡터 대체 경로에서 2장 계곡은 반복된 `ink-mountain` 대신 한 `ink-granite` 주봉을 쓴다. 좁고 높은 관봉, 옆으로 내려오는 넓은 어깨, 짙은 젖은 암면과 밝게 남긴 암면을 먼저 구성하고, 아래로 소실되는 수직 먹획과 두 겹의 `ink-foothill`·안개가 깊이를 잇는다. 절벽은 실제 L1 지형에 클립된 암면만 덧그리므로 충돌과 경로는 바뀌지 않는다. 소나무 잎은 매끈한 타원 대신 수평 군집·짧은 끊어진 획으로 처리한다. [국립중앙박물관 인왕제색도 해설](https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?relicRecommendId=962060&schM=view)과 [메트로폴리탄박물관 정선 산수 해설](https://www.metmuseum.org/exhibitions/listings/2018/diamond-mountains/exhibition-gallery)의 암면·안개·준법 설명을 형태 참고로 사용했다.

정적 배경 경로는 환경 객체별 WeakMap의 Path2D로 준비한다. 안개는 제한된 수의 작은 canvas card를 재사용하며 팔레트 캐시 크기를 제한한다. 실제 움직임은 기존 Scene.time과 reduced-motion 설정을 사용한다. 새로운 RAF/CSS 애니메이션 루프는 없다.

기존 3장 전용 `liveWater`는 공통 패스로 교체했다. 현재 물 재질의 실제 polygon 안에 gradient·5개 흐르는 곡선·물가·반사·진입 파문을 그린다. 폭포는 정적 암면 위에서 clipped ribbon, 상단 포말, 하단 splash/mist를 움직인다. 이 패스는 월드 캐시 다음, 유닛·조준선 이전이다. 물 전도·충돌 영역은 변경하지 않는다.

## 편집과 명령

Workshop에서 에셋을 고르고 Depth → Zone/Group → Support를 선택한다. 기본 이동은 뿌리를 지지면에 유지한다. 선택 시 지지선을 표시한다. 유한 그룹은 고정 WORLD이며 Atmosphere 선택은 별도의 ENVIRONMENT 패널에 있다. 그룹·지지면 점·구역 경계는 고급 JSON 편집에서 작성한다.

명령은 `scenery.place`, `scenery.attach`, `scenic.add`, `support.add`, `zone.update`, `environment.set`과 기존 `object.update/move/delete`를 사용한다. 연결된 support/group/zone을 삭제하면 dangling reference가 검증 오류가 되므로 같은 명령 묶음에서 자식도 정리해야 한다. 저장·undo·redo·export·Playtest는 기존 finalize 경로를 사용한다.

## 이관과 오류

환경 1/2의 기본 절차적 풍경은 고정 월드 구도로 재생성한다. 명시적으로 작성한 그룹·지지면·배치 ID는 남기고 옛 SCENIC/HORIZON 그룹은 가까운 zone의 고정 월드 높이에 붙인다. 옛 backdrop 위치가 바뀐 항목은 migrationNotes에 기록한다. 옛 대기 설정과 숨긴 layer도 보존한다. 해석할 수 없는 에셋·깊이는 그대로 남겨 validator가 오류를 보고한다. 기준 scale을 바꿔 구도 오류를 숨기지 않는다.

옛 전투와 배경 필드가 없는 연습장은 `ensureBattle`이 별도 WeakMap에 새 환경을 계산한다. 렌더링은 직렬화된 전투 객체를 전혀 변경하지 않으며 저장된 지형, 유닛 위치/HP, 비행 탄, 진행과 성장 데이터는 그대로다. 커스텀 배경 에셋도 저장된 asset에서 복원한다.

`node tools/environment/validate.mjs [project.json]`은 rooted support, 그룹/구역 참조, layer와 mode, 기준 크기, 대기 override, 구역 연결, 최대 줌 coverage, 옛 개체별 시차 필드를 검사한다. 전체 에셋·절차 생성물 분류는 `ENVIRONMENT_INVENTORY.md`와 inventory 생성기가 담당한다.

검사는 `tests/environment-depth.mjs`, `tests/environment-composition.mjs`, `tests/environment-browser.py`, `tests/environment-composition-browser.py`, `tests/environment-performance.py`에 있다. 시각·성능 결과는 `_local/reports/environment-v3/`에 저장한다. 마이그레이션 비교는 전투 데이터 보존과 레시피 재현도 함께 확인한다.
