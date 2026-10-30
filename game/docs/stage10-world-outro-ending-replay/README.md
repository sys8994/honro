# 10장 맵 대사와 막 엔딩 재생

기준 master: `275144983f93d0de66bbe6f44ede88a82ca36b56`. 작업 브랜치: `fix/stage10-world-outro-ending-replay`. master 통합과 Pages 배포는 부모 담당이다.

## 수정 1: 실제 맵의 출구에서 대화

전체 화면 `sodan-safe-backdrop`과 별도 네 인물 캔버스를 제거했다. 6턴 보호 → 실제 출구에 한 생존자가 도착 → 철수 경계 → 안전한 동쪽 출구 지형에 생존 동행과 소단을 모음 → 기존 일반 대화 16줄 → 기존 outcome 순서다. 적, HP, 자원, 보상, 지형은 유지한다. 철수는 기존 1.1초 경계이며 화면을 가리지 않는 상태 문구만 표시한다. 철수 및 대화 중 엔진 시간과 적 파도는 정지한다.

`HonroSodanWithdrawal.prepareWorldOutro(app)`는 철수 완료/기존 won 저장에서 한 번만 실제 출구 지지면에 일행을 배치한다. `sodanWithdrawal.worldOutro=2`로 반복 호출/대화 재개 시 이동을 반복하지 않는다. `StoryFraming.bind`는 이 안전 대화에만 실제 네 인물의 공통 카메라를 적용한다. 기존 대사 본문과 스킵/이전/다음 처리는 보존한다.

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

## 수정 2: 재클리어 엔딩과 독립 다시보기

정상 10·20·30장 승리의 `prepare(app,b,first)`에서 최초 클리어, `honroJourneyReplay`, seen 제한을 제거했다. `pending`도 seen과 독립적으로 유효한 클리어 엔딩을 재개한다. `main.outcome`의 기존 done 가드와 정산/합류/방문 횟수 경로를 유지하고, 엔딩의 표시/다음 컷은 그 경로를 호출하지 않는다. 디버그·허공터·커스텀/embedded 전투에서는 새 정상 엔딩을 준비하지 않는다. 기존 가로/세로 그림·3인칭 하단 문구·4컷·다음 막 제목·쉼터 및 실제 클리어 pending 저장/재개는 유지한다.

여정첩의 이미 완료한 10·20·30장 선택부에만 작은 **막 엔딩 다시보기** 버튼이 나온다. 독립 재생은 `app.endingGallery`의 메모리 상태만 사용하며 `profile.honroActEnding`, seen, 클리어, 모집, XP, 전투 저장에 쓰지 않는다. 완주 시 다음 막 제목 뒤 원래 여정첩으로 돌아오며 쉼터/모집/클리어 정산을 호출하지 않는다.

- 종료: 우측 위 여정첩 복귀 버튼, Escape, 완주 또는 브라우저 Back으로 원래 여정첩을 복원한다. 브라우저 Back용 같은 URL의 임시 history 항목은 저장 데이터와 무관하다.
- reload: 메모리 다시보기를 폐기하고 원래 타이틀/이어 하기 경로에서 기존 저장을 읽는다. 페이지 이탈에도 다시보기 상태를 저장하지 않는다. 브라우저의 메모리 복원(BFCache)이 현재 컷을 복원하더라도 원래 게임 저장은 불변이다. 독립 다시보기를 pending 완료로 저장하거나 캠프 이동시키지 않는다.
- 여정첩 지도 DOM을 유지하므로 원래 막/선택/층/확대/스크롤과 핀 이벤트가 돌아온다. 화면 회전 시 기존 반응형 제한으로 스크롤이 clamp될 수 있으며 프로필에는 기록하지 않는다.

### 작은 API / 여정첩 축약 작업과 통합

1. 선택부 원하는 위치에서 `HonroActEndings.replayButton(app, stageId)`를 한 번 넣으면 된다. 문자열은 자격이 없는 경우 빈 문자열이다. 별도 레이아웃 전면 교체는 필요 없다. 행동명은 `act-ending-replay`, 대상은 `data-id`다.
2. `main.js` click switch의 이 행동은 `HonroActEndings.replay(app, Number(id))`를 호출한다. API도 클리어/모드/진입 화면을 다시 검증한다.
3. `HonroRestJourney.captureBook(app)` / `restoreBook(app, context)`는 일시 뷰어의 지도 DOM/선택/카메라 복원 hook이다. 새 축약 UI도 이 두 hook의 계약을 유지하면 된다. 전투 시작/중지·쉼터·persist를 호출하지 않는다.
4. CSS는 `act-endings.css`의 `.journey-ending-replay`, `.act-ending-return` 두 선택자에만 추가했다. `journey.css`와 아이콘 DOM 캐시는 수정하지 않는다.
5. 클리어 보고서 작업은 `outcome`의 기존 `prepare` → 클리어 정산 저장 → `show` 순서를 유지한다. 보고서/경험치 기능을 엔딩 next/replay/finishGallery 안에 넣지 않는다. `first` 인자 계약도 유지한다.

### 집중 검수 2·3

- `python tests/act-ending-replay-browser.py --mode completion --out game/docs/stage10-world-outro-ending-replay/evidence/focus2-completion`: 2개 화면비 × 3개 막 × 최초/반복 = 12개 실제 Chromium 흐름 통과. complete/syncRoster/recruit/recordOutcome/split outcome 각각 1회, visits 한 번 증가, 중복 outcome 무효, 2컷 reload(기존 seen 포함), Enter/Space/터치 한 번당 한 컷, 제목/쉼터/완료 후 reload 확인.
- `python tests/act-ending-replay-browser.py --mode gallery --out game/docs/stage10-world-outro-ending-replay/evidence/focus3-gallery`: 클리어 0/9/10/19/20/29/30 해금 경계, 두 화면비의 3개 막, 30장 end 선택, 정상 저장 전투가 있는 10장 다시보기, 완주/Escape/닫기/브라우저 Back/reload 검사 통과. 전체 profile JSON과 localStorage 원문 문자열의 동일성을 확인했다. summary에 각 해시와 지도 복귀값을 남겼다.
- JPG 직접 확인: 재클리어 1막 세로·2막 가로, 첫클리어 3막 세로·재클리어 가로, 1막 여정첩 세로·2막 여정첩 가로, 1막 gallery 세로·3막 gallery 가로. 기존 그림과 읽기 가능한 하단 문구, 작은 보조 버튼, 명확한 복귀 버튼을 확인했다.
- 관련 회귀: `rest-journey.mjs`, `dialogue-controls-audio.mjs`, `web-split.mjs` 통과. 앞서 실패한 `dialogue-speaker-presentation.mjs`는 별도 기준 SHA worktree에서도 동일 `story-document` assertion 실패를 재현했다. 잘못 입력한 존재하지 않는 `dialogue-controls.mjs` 명령은 검사 실패로 집계하지 않고 실제 `dialogue-controls-audio.mjs`로 교정해 통과했다.

두 집중 검사 summary의 executionSHA는 1차 커밋 위 2차 작업 트리이며 sourceHashes가 실제 실행 소스를 식별한다. 최신 master를 병합한 확정 SHA에서 별도 종합 픽셀/동작 검수를 이어서 기록한다.


### 출구에 적을 끌고 온 경우의 안전 거리 보완

종합 코드 검토에서 기본 출구 지점 가까이에 적이 온 경우를 추가했다. 기본 네 인물 배치에서 적이 650 world 단위 안에 있으면 현재 v6 맵의 **이미 존재하는 동쪽 연속 지형**(Play Bounds 밖)으로 철수한 일행만 옮긴다. 새 지형/무대/배경이나 새 애니메이션은 만들지 않는다. 승패 확정 뒤 배치하고 won 상태로 저장하므로 다시 시뮬레이션하지 않는다. 적의 위치·HP·수는 바꾸지 않는다. `worldOutro=2`는 이전 브랜치의 1번 표시도 이 안전 배치로 한 번 보정한다.

`tests/stage10-safe-exit-crowd-browser.py`는 정상 전투 증거와 구분한 명시적 종료 fixture다. 출구에 생존 적 한 명을 둔 뒤 두 화면비에서 실제 지형·650 초과 거리·적 전체/영웅 기록/아이템 무변경·App/Engine reload 후 유닛 전체 문자열 동일성을 확인했다. `evidence/crowded-exit`에 JPG와 summary를 남겼다. 첫 실행의 두 번째 viewport는 fixture 저장 주입과 이전 화면 자동 저장이 겹쳐 시간 초과했다. 주입과 reload를 같은 브라우저 작업으로 묶어 교정한 뒤 두 화면비 모두 통과했다.

기존 `tests/act-endings-browser.py`도 거부된 단색 무대를 요구하던 assertion을 실제 맵 대사 계약으로 바꾸고, 현재 공통 Chromium/로컬 서버 helper 및 저장소의 정상 체크포인트를 사용하도록 갱신했다.


## 최종 소스 종합 검수 / 부모 인계

**실제 최종 실행 SHA: `5d789f7420ef05763fb0e6f945b2517b42394526`.** 원래 기준 `27514498` 위에 최신 master `b48423b360b2d6d6b1147c16811685f215a33513`까지 병합했다. 조이스틱 `0459fe27`과 아이콘 캐시 `c04218e4`를 모두 포함한다. 그 뒤 커밋은 이 문서와 검사 증거만 추가하므로 런타임은 이 실행 SHA와 같다.

- 1차 맵 복구: `7ea7357904cc80968b9f5f7a5c0ab7fb96b67f1f`.
- 2차 재클리어/독립 다시보기: `be068ea5`.
- 최신 master 보존 병합: `7ae450c5`, `b57d0881`. 소스는 자동 병합했고 생성물 충돌만 동일 빌더로 다시 생성했다.
- 출구 혼잡 안전 거리 보완: `5d789f74`.
- 모든 단위는 이 작업 브랜치에 비강제 push했다. master push와 Pages 배포는 수행하지 않았다.

### 확정 SHA의 결과

[전체 명령·종료 코드·실행 SHA·소스 해시](evidence/final/validation.json)에 15개 명령을 기록했다. 13개 요청 범위 검사는 통과했고, 나머지 2개는 같은 기존 실패를 현재/원래 기준 worktree에서 재현한 것이다.

| 검사 | 결과 / 증거 |
| --- | --- |
| build / typecheck | PASS · [build.txt](evidence/final/build.txt), [typecheck.txt](evidence/final/typecheck.txt) |
| 실제 정상 21턴 체크포인트 → 키보드 탈출 → 맵 대사 | 두 화면비 PASS · [map/summary.json](evidence/final/map/summary.json) |
| 10/20/30 최초·반복 12개 엔딩 + 해금 경계 7개 + gallery 6개 | PASS · [endings/summary.json](evidence/final/endings/summary.json); pageerror/HTTP 실패 0 |
| gallery 종료/Back/reload/회전/30장 end 선택 | PASS · 전체 profile와 localStorage 원문 동일, 지도 DOM/막/층/선택/확대/스크롤 복원 |
| 출구 혼잡 fixture / 실제 지형 / 저장 재개 | 두 화면비 PASS · 최소 적 거리 1254.03 · [crowded/summary.json](evidence/final/crowded/summary.json) |
| 갱신한 기존 엔딩 브라우저 회귀 | PASS · [legacy-ending-browser.txt](evidence/final/legacy-ending-browser.txt) |
| 기존 아이콘 DOM 캐시 회귀 | PASS · [icon-cache.txt](evidence/final/icon-cache.txt), [icon/icon-results.json](evidence/final/icon/icon-results.json) |
| 보호/문구/여정첩/대화 제어/조이스틱/web-split | PASS · 각 명령 로그는 final 폴더 및 validation.json 참조 |
| 기존 dialogue-speaker-presentation | 현재와 기준 `27514498`에서 같은 `story-document` assertion 실패 · [현재](evidence/final/existing-failure.txt), [기준](evidence/final/baseline-existing-failure.txt) |

### 별도 전체 픽셀 검수

집중 검수 1·2·3 뒤 최종 소스에서 별도 캡처했다. JPG 원본 **30장**을 직접 열어 실제 맵 첫/마지막 대사, 혼잡 출구, 세 막의 긴 3번째 문구와 다음 막 제목, 가로/세로 gallery, 세 막의 여정첩 복귀를 확인했다. [원본 경로와 SHA-256 및 검수 기록](evidence/final/pixel-review.json). 첫 클리어/재클리어의 18개 화면 쌍은 픽셀이 전부 동일하다([수치 대조](evidence/final/pixel-comparison.json)).

대표 화면: [10장 세로 맵 대사](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage10-world-outro-ending-replay/evidence/final/map/map-outro-first-390x844.jpg), [가로 맵 대사](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage10-world-outro-ending-replay/evidence/final/map/map-outro-first-844x390.jpg), [작은 다시보기 버튼](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage10-world-outro-ending-replay/evidence/final/endings/journal-return-act1-390x844.jpg), [30장 end 선택 복귀](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage10-world-outro-ending-replay/evidence/final/endings/journal-return-act3-844x390.jpg).

[통합 대조](evidence/final/integration.json): 최신 master는 이 브랜치의 조상이다. `skill-images.js`, 엔진 `icons.ts`, 조이스틱의 `main.ts`/`math.ts`는 최신 master와 바이트 동일하다. `main.js` 차이는 저장 대화/결과 대화 준비 호출 2개와 `act-ending-replay` 행동 1개, 총 3개 hunk뿐이다. 통계/XP 정산 본문과 아이콘·조이스틱 구현을 덮어쓰지 않았다. 게임 그림/캠페인 지형 변경도 없다.

### 남은 한계 / 차단 상태

실기기·Safari와 20/30장 정상 전투 완주는 미실행이다. 이 장들의 승리 경계는 명시적 종료 fixture로 구분한다. 10장은 기존 정상 플레이 저장의 실제 탈출 이동을 이어서 확인했다. gallery reload는 원래 저장에서 이어 하며 gallery 자체의 재개를 저장하지 않는다. 회전 뒤 원래 화면비로 돌아왔을 때 gallery 컷/저장과 여정첩 복귀가 보존되는 것도 확인했다.

첨부 `libfile_d0f5a6b8384c8191b289c395343fb68c`는 Library 읽기에서 파일명/이미지 메타데이터를 확인했으나, 원본 `1000047830.jpg`의 로컬 다운로드가 `download failed`로 실패했다. 로컬 원본 파일은 생성되지 않았으며 결과 불명/승인 대기가 아닌 **실패 확정**, 자동 승인 거부도 아니다. 부모의 직접 화면 관찰을 신뢰하고 실제 빌드의 거부된 무대 및 수정 결과를 재현·검수했다. 이 원본 열람 제한 외에 브랜치 커밋·push·요청 범위 검사를 막는 미해결 작업은 없다. master/Pages는 부모 최종 통합 검수 범위로 남겼다.
