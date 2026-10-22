# 10장 맵 대사와 막 엔딩 재생

기준 master: `275144983f93d0de66bbe6f44ede88a82ca36b56`. 작업 브랜치: `fix/stage10-world-outro-ending-replay`. master 통합과 Pages 배포는 부모 담당이다.

## 수정 1: 실제 맵의 출구에서 대화

전체 화면 `sodan-safe-backdrop`과 별도 네 인물 캔버스를 제거했다. 6턴 보호 → 실제 출구에 한 생존자가 도착 → 철수 경계 → 안전한 동쪽 출구 지형에 생존 동행과 소단을 모음 → 기존 일반 대화 16줄 → 기존 outcome 순서다. 적, HP, 자원, 보상, 지형은 유지한다. 철수는 기존 1.1초 경계이며 화면을 가리지 않는 상태 문구만 표시한다. 철수 및 대화 중 엔진 시간과 적 파도는 정지한다.

`HonroSodanWithdrawal.prepareWorldOutro(app)`는 철수 완료/기존 won 저장에서 한 번만 실제 출구 지지면에 일행을 배치한다. `sodanWithdrawal.worldOutro=1`로 반복 호출/대화 재개 시 이동을 반복하지 않는다. `StoryFraming.bind`는 이 안전 대화에만 실제 네 인물의 공통 카메라를 적용한다. 기존 대사 본문과 스킵/이전/다음 처리는 보존한다.

### 집중 검수 1

`npm run build`, `npm --prefix game run typecheck`, `node tests/sodan-withdrawal.mjs`, `python tests/stage10-world-outro-browser.py` 통과. Chromium 390×844, 844×390에서 기존 정상 21턴 탈출 직전 저장을 가져와 키보드 D로 실제 출구까지 이동했다. 16줄, 대화 2번째 줄 reload, 자연 종료와 스킵, 중복 outcome, 실제 지지면과 네 인물의 화면 포함, 적/시간/자원 정지를 확인했다. JPG 4장을 직접 열어 맵·지형·소나무·인물과 대화창이 보이는지 확인했다.

실행 기준 SHA 및 변경 소스 해시: [focus1-map/summary.json](evidence/focus1-map/summary.json). 최초 검사는 기준 SHA 위 작업 트리이며 최종 소스 SHA 실행 결과는 후속 종합 검수에 기록한다.

기존 실패: `node tests/dialogue-speaker-presentation.mjs`의 `story-document` 기대값이 현재 `story.js`에 없어 실패한다. 이 파일은 기준 master와 SHA-256이 같다(`628753ed208166d29f8c47d6116c6bbc893e2ec8c61ac5ed214efaaac1a19809`). 이번 작업에서 기존 실패를 숨기거나 문서 독해 UI를 재도입하지 않는다.

## 통합 지점

- `main.js`: battle mount의 저장 대화 재개, outcome의 대화 시작 직전 두 호출만 `safeBackdrop`에서 `prepareWorldOutro`로 교체했다. outcome 정산 본문은 건드리지 않았다. `feat/stage-clear-report`는 이 두 호출과 이후 엔딩 표시 호출을 보존해야 한다.
- `sodan-withdrawal.js`: 실제 탈출 조건/6턴 보호/승패 판정은 보존한다.
- `story-framing.js`: 10장 안전 대화만 네 인물 카메라를 사용한다.
- 조이스틱 및 아이콘 캐시/여정첩 축약 작업의 기능은 변경하지 않았다.

## 한계

기존 정상 플레이의 탈출 직전 체크포인트를 이어서 검사했으며 앞선 6턴 전투 전체를 새로 완주한 것은 아니다. Chromium 터치/키보드 에뮬레이션이며 실기기와 Safari는 검사하지 않았다. 새 이미지나 새 무대 연출은 만들지 않았다.
