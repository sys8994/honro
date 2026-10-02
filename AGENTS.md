# HONRO 코드 인수인계

배경·장식·맵 배치와 깊이/카메라 반응 작업을 시작할 때 `.agents/skills/honro-environment/SKILL.md`를 읽고 `shared/map/environment.js`의 공통 체계와 검증을 사용한다. 뿌리가 보이는 배경은 지지면·풍경 묶음에 붙이고, 구역·대기·물 표현은 같은 렌더러와 `npm run test:environment`로 검증한다.
배경의 기본 조형은 한국화 진경산수·수묵담채다. 실제 지형에 붙은 나무·바위·건물은 L1-back, 중경은 장소를 설명할 때만, 원경은 큰 산세 한 층을 우선한다. 실루엣·큰 명암면·여백·안개를 먼저 만들고 반복 polygon·미세 균열·노이즈로 디테일을 대신하지 않는다.
새 배경은 사용자가 준 일러스트를 편집 가능한 순수 SVG로 재구성하는 방식을 기본으로 한다. 지정 구간에 variation을 배정하고, 작은 수평 시차·더 작은 수직 시차, L1과 구분되는 낮은 채도/밝기, 단계별 깊어지는 밤톤을 공통 렌더러에 적용한다. 승인된 벡터 형태는 색감 조정 때문에 바꾸지 않는다. 상세 제작·검증 기준은 위 환경 스킬의 `일러스트에서 만드는 SVG 배경` 절을 따른다.

카메라 viewport는 Play Bounds 바깥을 볼 수 있다. 줌을 위해 gameplay dummy terrain을 만들지 않는다. `shared/map/bounds.js`로 플레이·카메라 중심·시각 여유를 구분하고, 최소 줌은 가로 전술 시야와 actor 식별 크기로 결정한다. 외곽·하단은 공통 visual-only skirt로 연결하며 portrait와 landscape를 모두 검증한다. 상세 기준은 `game/docs/CAMERA_BOUNDS.md`를 따른다.

먼저 README.md, game/docs/BUGFIX_CONTEXT.md와 BUG_LOG.md의 관련 항목을 읽는다.
게임 런타임 수정은 shared/runtime/, shared/engine/src/, shared/map/, shared/data/에서 한다. CSS와 밸런스 설정은 game/src/, game/config/에 있다. HONRO.html과 HONRO_WORKSHOP.html은 생성물이므로 직접 수정하지 않는다.
게임·Stage View·Playtest는 shared/build.mjs의 동일 번들 목록을 사용한다. Workshop 전용 지형 렌더러나 이동/물리 루프를 만들지 않는다.
이 패키지는 과거 handoff/Forge 의존성을 game/vendor/, game/templates/, shared/assets/으로 모은 독립 사본이다.
문서 속 과거 이미지·Forge·브라우저 보고서 링크는 역사 기록이며 이 패키지에 포함되지 않을 수 있다. 패키지 경로와 실행 방법은 README.md를 우선한다.
수정 후 npm run verify를 실행하고 두 HTML에서 관련 동작을 실제 확인한다. 성능 검사는 다른 브라우저 부하 없이 순차 실행한다.
스키마·렌더러·물리 변경은 tests/migration.mjs와 tests/integration.py를 통과해야 한다. migration/legacy는 비교 원본이며 활성 맵 소스가 아니다.
저장 호환성과 기존 플레이 진행을 보존하고 BUG_LOG.md에 원인·변경·검증·한계를 기록한다.
패치 노트·일회성 보고서·배포 압축본은 Git에서 제외된 _local/archive/에, 자동 검사 결과·스크린샷은 _local/reports/ 또는 _local/game-reports/에 둔다. 현재 명세·수정 맥락은 game/docs/, 검사 입력 기준 데이터는 tests/fixtures/ 및 game/tests/fixtures/에 남긴다.
