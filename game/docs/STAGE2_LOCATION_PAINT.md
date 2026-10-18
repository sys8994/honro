# 1막 2장 장소 회화 — 2026-10-18

작업 기준은 1장 공개 배포가 포함된 최신 master `e91966fa6ffc336fbc1dee6934c1df01729be2c9`다. 이번 opt-in은 2장뿐이다. 3장을 시작하거나 master/Pages에 배포하지 않는다. 부모가 브랜치와 실제 화면을 본 뒤 반영을 결정한다.

## 적용

- `shared/runtime/stage2-location-art.js`: canonical 실제 terrain polygon에만 절벽/습한 흙을 그린다. 절벽은 1장 광물 소재의 세로 크롭을 큰 비대칭 덩어리로 조합해 수직 결을 만들고, 지표의 습한 흙 깊이는 해당 면의 재질·기울기·플레이 깊이로 계산한다. 1장의 특정 x 구간/earthDepth 마스크는 복사하지 않았다. 물/날씨는 기존 renderer에 맡긴다.
- 실제 granite 요소 11개는 collider 윤곽과 비율을 유지하는 1장 공용 작은 암석 painter를 사용한다. 작은 암석은 깊은 절벽용 fade를 거치지 않는다. 장식 큰 바위로 실제 지형을 덮지 않는다.
- 기존 3개 ravine pine와 scene 나무 9개 중 기존 발판에 맞닿는 3그루와 시작 고지대의 1그루만 그린다. 나머지 scene 나무는 중복 출력하지 않는다. 나무 밑동은 지정 support에서 `C.topAt(support,l.x,l.y)`로 authored nearY와 가까운 면을 고른다. 수직/오버행의 단순 최소 y를 사용하지 않는다.
- 나무는 1장 최종의 근거리 중성 갈회색 수피 처리, 실제 발판은 같은 수피와 더 읽기 쉬운 윗면을 공유한다. 5개 가지의 실제 polygon·위치·oneWay·HP340은 그대로다. 나무는 정적이며 새 모션은 없다.
- mountain-wet-valley는 `stage2-wet-valley.webp` 30,438 bytes로 준비했다. 2장에 들어갈 때만 `valleyFar`를 요청하고, 한 번 저채도/저대비/약한 blur/veil 처리한 뒤 기존 `act1BackdropFrame`의 viewport 크롭/작은 시차로 합성한다. 2K 그림을 전체 world 사각형에 늘이지 않는다. 다른 원경 후보는 로드하지 않는다.
- 공용 변경은 `painted-pilots-art.js`의 명시 요청/캐시 미술 API export, `stage1-location-art.js`의 기존 소재 API export 및 기본 동작을 유지하는 기부 방향 옵션이다. 1장의 위치별 지표 painter는 그대로다. Game/Workshop은 기존 단일 build 목록에서 같은 Stage2 모듈을 사용한다. 에셋 재현은 `tools/environment/painted-pilot-assets.py`다.

## 데이터와 한정 확인

`shared/data/campaign.json`, `shared/runtime/stage2-airborne.js`, startup/main/web-build, 독립 motion demo 소스는 최신 master와 차이가 없다. mapRevision20, 모든 지형/유닛/목표/이벤트/성장/SP/저장 계약을 보존한다. 상여 경로 `(1200,2960)→(1800,2960)→(2400,3005)→(2940,2940)→(3340,2830)`과 procession-seen/road-pressure/sniper-seen/right-cliff/last-flight, foe1/foe4의 대기/출격·안전 진입은 수정하지 않는다.

필요한 빌드 후 Chromium에서 다음 대표 화면만 확인했다.

| 화면 | viewport | 카메라 x/y/scale |
|---|---|---|
| 시작 고지대 | 1440×900 | 290 / 420.869565 / .94 (실제 시작 카메라) |
| 하부 상여 경로 | 1440×900 | 2200 / 2700 / .48 |
| 모바일 중턱·가지 | 480×900 | 1200 / 1400 / .48 |

렌더 전후 전투 JSON 동일, pageerror0. 2장 최초 요청은 valleyFar/forestRock/forestSoil/pineA/pineB/roots/bark뿐이며 Stage21 이미지 요청0이다. 공용 helper 연결을 바꿨으므로 1장 시작(250 / 1350.691870 / .94)도 한 번만 확인해 기존 표현을 유지함을 확인했다. 뒤의 Stage2 전용 세로 크롭 수정에서는 1장 화면을 반복하지 않았다.

화면은 진단 카메라의 실제 production renderer이며 정상 전투 완주·난이도 승인 증거는 아니다. 전체 전투/전체 기예/전체 verify/24 coverage/별도 검수자 검사는 실행하지 않는다.

증거: `_local/reports/stage2-location-paint/checks.json`과 대표 PNG3개, `stage1-shared-helper-entry.png`.

## Library

실제 Chromium PNG3개를 새 Library 파일(v0)로 저장했다.

- 시작 고지대: `libfile_cc235efbba308191a551508985d03708`
- 하부 상여 경로: `libfile_463639aeb6308191bf8cb1dcdf6ec5a2`
- 모바일 중턱: `libfile_1d4ed89ccd6481918ab76eb2475ac0c2`
