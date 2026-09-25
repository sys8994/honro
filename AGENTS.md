# HONRO 코드 인수인계

먼저 README.md, game/docs/BUGFIX_CONTEXT.md와 BUG_LOG.md의 관련 항목을 읽는다.
게임 수정은 game/src/, game/engine/src/, game/config/에서 한다. HONRO.html은 생성물이므로 직접 수정하지 않는다.
이 패키지는 원 저장소의 과거 handoff/Forge 의존성을 game/vendor/, game/templates/, game/runtime/으로 모은 독립 사본이다.
문서 속 과거 이미지·Forge·브라우저 보고서 링크는 역사 기록이며 이 패키지에 포함되지 않을 수 있다. 패키지 경로와 실행 방법은 README.md를 우선한다.
수정 후 npm --prefix game run verify와 node game/build.mjs를 실행하고, HONRO.html에서 관련 스테이지를 실제 확인한다.
저장 호환성과 기존 플레이 진행을 보존하고 BUG_LOG.md에 원인·변경·검증·한계를 기록한다.
