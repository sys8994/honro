# 대사·목표 안내 검수 체크포인트

소스: `f77c436bf7f0de7088300a2631f92f410648c576`. master 미반영·Pages 미배포.

- 상황 설명은 수동 서술 페이지이며, 실제 엔진 보행으로 3100 경계를 넘고 방어/행동 경계에서 witness를 발동했다. 시작 위치와 4턴은 검사 fixture다. 20초 무입력, 터치/키보드 한 페이지 진행, 이전/Continue/넘기기/중복 방지를 확인했다.
- 2장 5/11 대사는 상여·담허를 포함하며 목표 안내는 전체 암전 없이 HUD와 미니맵 아래에서 확인 입력을 기다린다. desktop/390px 캡처는 전후 파일명으로 구분했다.
- 전수 검사 결과는 `checks.json`. 대상 포함 실패와 pageerror는 0이다. 누락 4건은 현재 27장에 없는 구형 v1 합류 descriptor의 대상이며 fallback을 기록했다. 이를 현재 장면의 미술 합격으로 세지 않았다.
- 전체 1,492장 원본/시퀀스별 메타데이터는 로컬 `_local/reports/story-framing/`에 보존했다. 전체 검토 묶음 발행, 특수 혼령/묵종/암흑 귀환 대사 목록 보강과 최종 종합 검수는 진행 중이다. 정상 캠페인 완주·실기기 검수는 아니다.
- 관련 단위 검사와 web-split 빌드 계약은 통과했다. 기존 `stage23-escort-runtime.mjs` 4번째 warning/review fixture와 `dialogue-source-inventory.mjs`의 title-markup 글리프 분류는 수정 전 d7244a8a에서도 같은 실패가 재현됐다.
