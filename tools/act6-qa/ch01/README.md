# 6막 1장 R5 중간 밀도 암반 비교 후보
R4를 별도 비교 기준으로 보존한 작업 후보입니다. R4의 형상과 조건을 유지하고 기존 A/B/C 자연 암반 오너 세 개에만 선택된 중간 밀도와 층리를 반영했습니다. 출시본이 아닌 오프라인 증거입니다. 비교 시 공통으로 사용하는 비캠페인 식별자는 `act6-ch01-r4-qa`이며 metadata.stageId, 캠페인 진행, 승리/후속, 저장 슬롯, 앱/Workshop 진입점, 배포 경로를 등록하지 않습니다.
이 R4는 암반 내부 디테일을 보강하라는 최신 피드백 반영 전의 보존용 비교 기준입니다. 승인 시안이나 출시 후보가 아닙니다.

Node 24 이상에서 저장소 루트 기준:

    node tools/act6-qa/ch01/smoke.mjs

설치/네트워크/브라우저/인증/사용자 환경이 필요 없습니다. 스크립트는 `source-lock.json`에 적힌 pinned master 71cfa8e5의 순수 map/compiler 입력 8개 git blob을 확인합니다. 검사한 입력이 나중에 달라지면 자동 승인 대신 의도적으로 실패합니다. 같은 블롭이 있는 후속 커밋에서도 통과할 수 있습니다. `HONRO_FIXTURE_CHECKOUT=/absolute/checkout`로 별도 기준 checkout을 지정할 수 있습니다. 정상 실행은 아무것도 파일에 쓰지 않습니다. 재생성한 SVG를 비교할 경우에만 `HONRO_FIXTURE_EXPORT=/tmp/new-filename.svg`를 지정하며 기존 파일은 덮지 않습니다.

- `terrain-source.json`은 R4의 단일 산체 수치 원본 사본입니다. `visual/*.json`은 R5 ALLMID(ABC-native-bulk-r1)에서 실제 선택한 12개 paint owner만 읽는 출처 사본입니다(구 후면은 stage projection에서 사용하지 않음). `visual/owners.compiled.svg`는 그 12개 owner를 한 SVG에 분리된 ID/레이어로 투영한 비교용 벡터입니다. 원경은 별도 두 WebP이며 SVG 안에 합치지 않습니다. 실제 앱 프레임의 색 합성 및 카메라 크롭을 재연하지 않습니다.
- `visual/terrain-readability.fixture-only.js`는 과거 R4 테스트의 명시적 renderer 차이를 보관만 합니다. 일반 런타임으로 import하지 않고 smoke에서도 실행하지 않습니다. 과거 VM, scratch, patched generated bundle에는 portable smoke 의존성이 없습니다. 과거 렌더 스크린샷을 현재 master 일반 UI에서 재현했다는 주장은 하지 않습니다.
- smoke는 pinned stock V6 compiler로 세계·플레이·attachment·material 투영의 지형/시각 분리, 12개 owner 외형 및 no-collider, 실제 원본과 같은 collider SHA, SVG 재생성 SHA, 업무 영역과 외곽 범위, 별도 WebP 헤더ㆍ크기를 확인합니다. V6 전체 캠페인 발행/스토리 schema 승인, 전체 게임플레이/브라우저/저장/성능 테스트는 하지 않습니다.

Add-only 경로: `tools/act6-qa/ch01/**` 이외 불허. 특히 `game/config/story-release.json`, `shared/data/campaign.json`, `shared/data/act4/**`, `shared/data/act5/**`, runtime/loader/renderer/저장 처리, `shared/build.mjs`, `shared/web-build.mjs`, `shared/web-retention.mjs`, 과거 signed save/compatibility 자산(32·33·34장 포함), `HONRO.html`, `HONRO_WORKSHOP.html`, `web/**`, `.github/workflows/**` 수정·추가 금지.
