# 디버그 막 엔딩 미리보기 · 2026-10-22

브랜치: `fix/debug-act-ending-preview-20261022`. 원격 최신 master `e90d6db22458d3c8021fa9666abc5e03f2613851`에서 시작했다. 최종 실행·캡처 SHA는 `2af9078b27510efee81b41323cda3260c68135ae`이며, 런타임/빌드 구현은 `07a449453930ff8e70e130d2aa2f58397fd3076f`에서 확정했다. 이후 변경은 검사와 이 문서·증거뿐이다. master 병합과 Pages 배포는 부모의 최종 검수 후 담당하므로 실행하지 않았다.

## 사용자 진입 경로

1. `HONRO.html`의 **설정 → 기록·관리 → 검수 모드 → 디버그 모드**를 켠다. 기존 동작대로 휴식터로 이동한다. 최초 휴식터 대화가 나오면 마친다.
2. 다시 **설정 → 기록·관리 → 검수 모드**를 연다. 이미 디버그가 켜져 있으면 이 단계부터 시작한다.
3. **막 엔딩 미리보기**에서 **1막 / 2막 / 3막**을 누른다. 클리어 기록은 필요하지 않다. 가로 화면에서 설정 본문을 조금 스크롤할 수 있다.
4. 화면 터치 또는 Enter/Space로 다음 컷을 본다. 마지막 제목 다음에 원래 검수 모드 설정으로 돌아온다. **디버그 화면으로 돌아가기**, Escape, 브라우저/모바일 뒤로도 같은 화면으로 돌아온다.
5. 전체화면에서 첫 Escape는 기존 규칙대로 전체화면만 종료한다. 다음 Escape가 미리보기를 닫는다.

일반 모드·허공터·사용자 맵·embedded Playtest에는 이 버튼을 제공하지 않는다. 디버그 설정을 전투 중에 열어 재생해도 해당 엔진·전장·선택·설정 탭·본문 스크롤을 보존한다. 새로고침은 미리보기를 버리고 기존 디버그 정책에 따라 보호된 일반 기록으로 돌아간다.

## 구현

`shared/runtime/act-endings.js`의 기존 전체화면 엔딩 표시·이미지 방향 선택·입력 지연과 갤러리 메모리 커서를 재사용한다. 그림·서사는 추가하거나 변경하지 않았다. 디버그 미리보기는 원래 root DOM과 설정 DOM을 보존하고, 실행 중 앱 프레임을 정지한다. 종료 시 엔진 재생성·휴식터 재진입·정산·persist 없이 복구한다. 탭 숨김이 미리보기 위에 정지 메뉴를 새로 만들지 않으며 전투 BGM 소유권도 유지한다.

버튼은 설정의 ‘막 엔딩 미리보기’ 구획에 표시한다. 세 선택 버튼과 복귀 버튼의 터치 영역은 최소 44px이며 기존 전체화면/Safe Area 규칙을 사용한다. 일반 클리어 엔딩과 여정첩의 완료 기록에 따른 해금 조건은 유지했다.

## 검사 결과

| 구분 | 확인 및 결과 |
|---|---|
| 집중 1 · 진입/진행 | 미클리어 프로필, 세 막 × 390×844/844×390 = 6건 통과. 실제 선택 버튼 터치, 첫 컷, 터치/Enter 진행, 입력 지연과 중복 클릭 억제, 문구 영역 확인. 설정 가로 및 1막 세로 실제 픽셀 확인. [기록](review1-entry.json) |
| 집중 2 · 종료/반복 | 진행 중 디버그 전투에서 세 막 × 두 방향 = 6건 통과. 4컷→제목→완료, 닫기/Escape/브라우저 뒤로, 각 종료 후 반복 재생. 원래 설정/배경 DOM·엔진·Scene 동일성, 설정 스크롤 복귀 확인. 2막 가로/설정 세로 픽셀 확인. [기록](review2-exit.json) |
| 집중 3 · 저장/갤러리 | 진행 중 전투·미클리어 세 막 × 두 방향 = 6건 통과. 각 진입/진행/종료 전후 전체 debug profile, normalProfile, live battle, localStorage를 JSON 바이트 단위 비교. 새로고침 후 임시 엔딩 상태 없음·원래 저장 동일. 3막 세로 및 정상 갤러리 가로 픽셀 확인. [기록](review3-storage.json) |
| 기존 정상 엔딩/갤러리 | 기존 `act-ending-replay-browser.py --mode all` 통과. 일반 10/20/30장 최초/재완료 × 두 방향 12건: 기존 정산 호출 횟수·visits·seen·컷 저장/재개/휴식터 전환. 해금 경계 7건, 정상 갤러리 6건: 원래 여정첩 선택/확대/스크롤/DOM 복귀·종료 방식·저장 불변. 비캠페인 제외 검사 통과. [기록](normal-regression.json) |
| 별도 종합 최종 픽셀 | SHA `2af9078b…`, 미클리어 세 막 × 두 방향 6건 통과. 최종 JPG 10장을 직접 열어 그림/문구/버튼/잘림/복귀 설정을 확인. 전체화면 첫 Escape와 다음 Escape 분리, 잘못된 ID·일반/훈련/custom/embedded 직접 진입 차단, 전체 상태 불변 재확인. [기록](final-summary.json) |
| 기존 디버그 회귀 | `node tests/debug-campaign-parity.mjs` 통과: 일반 기록·전투 복제 분리, 검수 장소·성장, 내보내기 보호, 모드 해제/재로딩, embedded 경계 |
| 빌드/기본 진입 | `npm run build`, `node tests/web-split.mjs` 통과. 생성 해시·바이트 수, native/embedded 타이틀, embedded 저장 보호, Workshop 직접 iframe 연결 확인 |

집중 1·3은 구현 커밋 직전 같은 런타임 작업 트리에서 실행하여 원본 JSON에 당시 HEAD `e90d6db…`가 기록되어 있다. 집중 2·정상 회귀는 `07a44945…`, 별도 종합은 `2af9078b…` 실행이다. 이 사이 런타임은 바뀌지 않았다. 최종 실행의 정확한 소스 SHA-256은 `final-summary.json`에 있다. 진행 중 전투 검사는 기존 예약 저장이 안정된 뒤 기준 스냅샷을 잡았으며, 저장 로직을 무력화하지 않았다. 브라우저 예외/HTTP 오류는 각 성공 실행에서 0건이다.

## 실제 최종 빌드 캡처

브라우저 viewport 원본을 JPEG quality 85로 저장했다. 합성·크기 변환은 없으며 각 파일은 1MB 미만(최대 110,730 bytes)이다. [파일 크기·SHA-256](screenshots.json).

| 화면 | 모바일 세로 390×844 | 모바일 가로 844×390 |
|---|---|---|
| 디버그 설정 | [세로](final-debug-act1-390x844.jpg) | [가로](final-debug-act1-844x390.jpg) |
| 1막 | [세로](final-act1-390x844.jpg) | [가로](final-act1-844x390.jpg) |
| 2막 | [세로](final-act2-390x844.jpg) | [가로](final-act2-844x390.jpg) |
| 3막 | [세로](final-act3-390x844.jpg) | [가로](final-act3-844x390.jpg) |
| 종료 후 같은 설정 | [세로](final-return-390x844.jpg) | [가로](final-return-844x390.jpg) |

## 재현과 제한

```sh
npm ci --ignore-scripts
npm --prefix game ci --ignore-scripts
npm run build
python tests/debug-act-ending-preview-browser.py --review entry
python tests/debug-act-ending-preview-browser.py --review exit
python tests/debug-act-ending-preview-browser.py --review storage
python tests/act-ending-replay-browser.py --mode all --out _local/reports/debug-act-ending-preview/normal-regression
python tests/debug-act-ending-preview-browser.py --review final --out game/docs/debug-act-ending-preview-20261022
node tests/debug-campaign-parity.mjs
node tests/web-split.mjs
```

검사는 설치된 `/usr/bin/chromium` 154.0.8037.57의 실제 로컬 HTTP 빌드와 모바일 터치/viewport 에뮬레이션을 사용했다. 물리 모바일·Safari·Pages 배포는 미검증이다. 엔딩 전환은 terminal battle fixture로 확인했으며 실제 전장 완주 증거로 주장하지 않는다. 전체 verify·성능·지형 작업·요청에서 언급된 기존 실패 4건의 수정/재실행은 하지 않았다. 새로고침으로 임시 디버그 세션이 폐기되는 기존 정책은 유지된다.

환경 준비 중 Playwright의 브라우저 다운로드 `https://cdn.playwright.dev/builds/cft/151.0.7922.34/linux64/chrome-linux64.zip`가 **403 `Domain forbidden`으로 거부**되었다. 해당 다운로드는 실패로 종료했고 별도 경로나 권한 상승으로 재시도하지 않았다. 이미 설치되어 있던 Chromium을 사용해 위 검수는 완료했다. 미해결 권한 요청이나 결과 불명 쓰기는 없다.
