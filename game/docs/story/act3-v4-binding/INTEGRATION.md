# 부모 통합 요구와 검증 경계

브랜치 `codex/act3-v4-reviewed-binding-20261027`는 staging 전용이다. 공통 활성 소스는 수정하지 않았다. `tools/testing/act3-v4-parent-integration.mjs`는 고정 기준15243cc1에 대한 exact-match 검토용 패치다. 부모의 현재 공통 인프라에 그대로 실행하지 말고 아래 계약만 이식한다.

| 부모 파일 | 필요한 작은 통합 |
|---|---|
| shared/build.mjs |21–30 전용 provider/model·render·문서 span 모듈 등록. 각 CH flag와 검수 JSON 입력. 공통21 alias 본문은 어느3막 flag가 켜져도 로드. 기본은 비활성.|
| shared/runtime/act23-v4-reviewed.js | 장별 provider dispatch: rowsReviewed/accepts/finished/failure/lineAllowed/present/journal/talkId. 기존11장 경로 보존.|
| shared/runtime/story.js | reviewedStage 정수 장에 실제 provider guard 적용. 문자 원고 DOM 생성 후 전용 문서 span bind 호출. 기존 인용문을 한 번만 표시.|
| shared/runtime/act23-v4.js | opt-in 검수 장 map revision421–430. 구판 전투만 시작점 재작성, 성장/장착/완료 보존.|
| shared/runtime/rest-journey.js | 실제 전투 전 현장 preview가 필요한21/23/24/30 전용 렌더 mount와 저장한 선택대화 cursor 재개. reviewed stage의 실제 arrival 유무로 required pending 판정.|
| shared/runtime/stake-crossing.js | 기존 retry 전 captureRetry, checkpoint 복원 직후 restoreRetry. 물리 진행·적·자원은 기존 복원, 원고 terminal/실제 관찰만 보존.|
| shared/runtime/main.js |29장 실제 실패 retry에서 전용 시작 snapshot 복원 hook. 성장/XP ledger/장착은 유지하고 적·차폐·소모품·턴은 저장된 보스전 시작으로 복원.|
| shared/runtime/interactions.js | reviewed 장의 내부 marker/step 실패 ID는 승인된 현재 목표로 표시. 일반 UI 이유는 유지.|
| shared/runtime/act-endings.js |30장 context별 endingContent 조회. 신판 증거별 줄 선택, 구판 대체 본문 미제공 시 허위 기억 금지.|

기존3막 전용 `act3-void.js`의 작은 훅은 이 브랜치가 소유해 수정했다. 승인된9문구 공급, 실제 복귀 완료 proof, 중단 저장 READY 복구 안내만 연결한다. 기존 제어·skip·카메라·시간 동결은 유지한다.

`tests/act3-v4-reviewed-source.mjs`는321 canonical 원고와 모든 원본 필드/별칭/문서 blob manifest 보존 검사다. gameplay 통과 증거가 아니다. 장별 focused 검사는 production App/Engine이며 전투 결과/영웅 안내 위치/선행 지식은 fixture다. Chromium 스크립트는 실제 DOM/Canvas/Enter/E/localStorage를 검사하며 정상 전투/Pages로 표시하지 않는다. 전체30장 자동플레이·범위 밖 미술·배포는 수행하지 않았다.

부모 BUG_LOG 병합용 요약: 검수3막 원고를 장별 실제 물리 proof/생존·출연/목격/저장 cursor에 연결했다. 필수 구조·분할·재합류·수문·사공·지도 조작을 선택 화자 대사 done에서 분리해 사망 소프트락을 막았다. skipped/cancelled 발화는 done으로 승격하지 않는다. 다만 실제 네 사람 집결 전 필수 동행 상실과 보호 NPC 상실은 실제 실패로 처리한다. 남은29장 창 경고·30장 먼 곽진 이별2행·COMPAT30 본문은 각 장 문서대로 보류한다.

전달 방식의 공통 후속: 원고의 delivery/audience/group/order/once 등 원본 필드는 씬/저장까지 그대로 보존한다. 현 고정 기준의 Story reader는 `delivery=bark`도 수동 대화창으로 표시한다. 별도 live bark 표시와 cursor/생존 가드 전환은 아직 구현하지 않았으므로, 메타데이터 보존을 비정지 bark 연출 검증으로 보고하지 않는다. 이 공통 reader 정책은 부모 담당과 통합해야 한다.
