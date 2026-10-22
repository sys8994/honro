# 승인된 피드백 작업 최종 통합

**완료.** 브랜치는 `integration/honro-feedback-20261022`다. 이 README가 도입된 커밋까지 부모가 통합·배포할 수 있다. 이 작업은 해당 브랜치에만 커밋·비강제 push했으며 master/Pages에는 직접 쓰지 않았다. 공개 픽셀 확인과 배포는 부모 담당이다.

## 정확한 체크포인트와 입력

- 기준 master: `c0e323ff3df9c5f4120e48d470c8ca80c679c57e`.
- 먼저 독립 배포한 문서 체크포인트: **`b48423b360b2d6d6b1147c16811685f215a33513`**. 실제 실행 소스는 `8f4cfa683fec9e181281a7659661c76a2a16613d`. [ICON_JOYSTICK_READY.md](ICON_JOYSTICK_READY.md).
- **최종 통합 런타임·생성물 SHA: `6fb1e3aed0caddef59436ae4c89877b663650172`**.
- 통합 3회 집중/별도 전체 브라우저 검수 실행 SHA: **`9078f7562a76da7305b7476f9ba9792a0711b1a2`**. 이후 변경은 검사 fixture/문서/증거이며 실행 소스·생성물은 위 런타임과 바이트 동일하다. 반복 정식 build도 Git 차이가 없었다.
- 마지막 확인한 master는 첫 체크포인트 `b48423b3`다. 현재 통합 브랜치의 조상임을 확인했고 되감지 않았다.

| 입력 후보 | 통합한 최종 문서/증거 SHA | 후보 실행 SHA |
| --- | --- | --- |
| 아이콘 독립 단계 | `f35fa61de2d9f52c0e38bc8fc8d7b64c55d71654` | `c04218e4f4761b2d19e457131aae2e2a85fae3a6` |
| 클리어 보고서 | `66b7cef9cd712b04a2f6acd9fcb23aa9adfe24d6` | `4699102a27217a0372770b5866b7e181db9fdeba` |
| 여정첩 최종 | `4a5843ad69c34fd0252b3a216c8d231956719940` | `47abd35422157fbd1cfb2a72fd1775db38013dbc` |
| 실제 맵 대사/엔딩 재생 최종 | `c491a5480a124f255ce1cc3f07d7af434c7b0973` | `5d789f7420ef05763fb0e6f945b2517b42394526` |

각 후보의 최종 README에 완료 범위·정확한 실행 SHA·검사·한계가 있는 것을 읽은 뒤 병합했다. 보고서의 PHASE0나 아이콘 단계 뒤 미완료 여정첩 중간본을 최종으로 취급하지 않았다. 정확한 개별 검사 실행 SHA와 235개 활성 소스 해시/패키지 digest는 [manifest.json](evidence/manifest.json)에 있다. 활성 소스 digest는 `356615a27f4902ad342202d2021a67d6ec6bd6f5328e139e3c22e8ba3a5b1a1b`다.

## 통합하면서 고친 확인 결함

1. **stale 전투와 앞선 프로필 XP 장부:** progression 복구를 보고서의 `recovered` 구간에 반영한다. 이번 보상 XP에는 더하지 않고 ‘과거 성장 복구 +50 XP (이번 보상 제외)’와 부분 기록을 표시한다. 실제 mount/Continue에서 before100 → profile150 → last150, combat/settlement/reunion0을 재현했다. 새 진입 보고서는 initialize의 복구가 끝난 뒤 시작해 이미 있던 성장을 시작 XP로 삼는다. 후속 실제 지급과 최종 XP의 합계·동결·반복 outcome 불변성을 확인했다. [실제 Chromium 결과](evidence/recovery/checks.json), [화면](evidence/recovery/continue-recovered-xp-390x844.jpg).
2. **M10 소환체 대상 회복:** 실제 동행 HP 회복10은 시전자/기예/동행 합계에, 소환체 HP 회복5는 `other.summons`에 둔다. 과잉 회복은 제외한다. 실제 field tick과 상세 UI의 별도 통계를 함께 확인했다. [화면](evidence/recovery/m10-separate-summon-390x844.jpg).
3. **결과 표시의 중복 정산 호출:** 보고서가 대사 전에 완료 정산한 뒤 대사 종료·결과 표시가 finish/complete를 다시 호출하지 않게 했다. 승리→대사→결과→중복 outcome에서 각각1회다. gallery는 둘 다0회다.
4. **축약 footer 충돌:** 제목/상태·진입 CTA와 44px ‘기록’ 보조 메뉴를 한 줄에 두었다. 완료한10/20/30장의 엔딩 다시보기와 클리어 보고서를 메뉴 안에서 함께 제공한다. Escape는 메뉴를 닫고 포커스를 돌려준다. 보고서 상세와 gallery는 원래 지도 DOM/막/층/선택/확대/스크롤로 복귀하며 라벨도 다시 계산한다. 상단52px/하단64px를 유지한다.

main.js의 report 시간/집계, skill ID keyed 버튼/이미지 갱신과 joystick 섹터 해제를 모두 유지했다. BUG_LOG의 양쪽 항목을 보존했다. 충돌한 HTML/web/manifest는 합친 소스에서 `npm run build`로 재생성했다. [84개 스킬 이미지와 3개 지도 원본의 바이트/SHA 대조](evidence/original-images.json)는 모두 기준 master와 동일하다. 기존 사각 아이콘 CSS, 설정 최상단 전체화면과44px 체크박스도 보존했다.

## 실제 검사와 결과

로컬 정식 외부 모듈 빌드, **Chromium154.0.8037.57**이다. `390×844`, `360×800`, `844×390`을 사용했다.

| 검사 | 결과와 증거 |
| --- | --- |
| 정식 build / game typecheck / web-split | PASS.349개 생성 자산·native/embedded 진입·저장 보호. [build](evidence/final-checks/build.txt), [typecheck](evidence/final-checks/typecheck.txt), [web-split](evidence/final-checks/web-split.txt) |
| 통합 집중 브라우저 / 별도 전체 재실행 | 각각 **70판정 PASS**. 요약·실제 XP/전후 경지·상승·상세·닫기·세 막 report/gallery 공존·정산0회·저장/지도 복귀. [집중](evidence/final-combined/checks.json), [별도 전체](evidence/holistic/checks.json) |
| 아이콘 identity/cache/벡터 재노출 | PASS.30클릭+30갱신, 버튼/이미지4/4 유지, 생성/제거/SVG 재노출/src 변경/추가decode/resource 모두0. 순서·기력·잠금·cooldown fixture·모닥불·오류 재시도 포함. [결과](evidence/final-icon/results.json) |
| joystick-intent / charge-input / 실제 드래그 | 초기120+전환380, 충전126 PASS. 실제 trusted CDP touch→PointerEvent371판정 PASS.19/20/21° 이탈·재진입·수평 시작·취소·멀티터치·키보드. [실제 결과](evidence/final-joystick/sector-results.json), [충전](evidence/final-checks/charge-input.txt) |
| camp-persistence / camp-skill-ux | 11저장 사례와 장착/해제/교체/상태/전투 계약 PASS. [로그](evidence/final-checks/camp.txt) |
| 보고서 데이터/복구/이월 | PASS. 실제 HP·쉴드·초과 제외·M05 1시전10명중·합류 보정 제외·split 정산/재시도 XP·기존 provenance·동결/저장 보호. [로그](evidence/final-checks/report-terminal.txt) |
| 여정첩 경로/확대/라벨 | 최종 통합본90앵커 표본 PASS.30번호×3배율, 번호와 이름 간격·겹침·44px hitbox·잠김/경로 숨김·휠/키보드/핀치·이미지 캐시/복구. [결과](evidence/final-journey/final-integration-results.json) |
| 실제10장 맵 탈출/대사 | 세 화면비 PASS.기존 정상21턴 저장에서 키보드D로 탈출, 실제 지지면의 네 인물·16줄·중간 reload·전투 정지·자연 종료/스킵. [결과](evidence/final-map-outro/summary.json) |
| 첫/반복 엔딩과 독립 gallery | PASS.12첫/반복 흐름,7해금 경계,6gallery 및 모드 제외. 완료 정산1회·중복 outcome 무효·컷 reload·회전·완주/Escape/닫기/Back·전체 profile/localStorage 원문 동일. [결과](evidence/final-endings/summary.json) |
| 기존 설정 | 실제 Chromium39판정 PASS.전체화면 왕복과44px 모서리/Space 입력·저장 유지. [결과](evidence/settings/checks.json) |

주요 실행은 `tests/feedback-integration-browser.py`, `tests/feedback-report-recovery.mjs`, `tests/feedback-report-recovery-browser.py`, `tests/stage-clear-report-data.mjs`, `tests/stage-clear-report-carry.mjs`, `tests/journey-navigation-browser.py`, `tests/stage10-world-outro-browser.py`, `tests/act-ending-replay-browser.py`, `tests/icon-cache-journey-browser.py`, `tests/joystick-intent-browser.py`다. 각 브라우저 출력 폴더에는 명령 로그/결과 JSON이 있다.

## 기존 실패와 검사 fixture 교정

`node game/tests/regressions.mjs`는 **Stage8 `bier-knot-0: 2520,3750.4`** 지형 합법성 검사에서 중단한다. 기준 `c0e323ff` detached worktree에서 같은 실패를 재현했다. [최종 통합](evidence/final-checks/regressions.txt), [기준](evidence/icon-joystick/regressions-baseline.txt). 그 이후 regression 항목은 실행되지 않았으므로 전체 통과로 기록하지 않는다.

후보 자체 보고서에는 기존 stake-crossing-xp의 공유XP 기대값, act3-split-v2의 옛 이야기 제목, custom-map-return-profile의 기본 프로필 기대값, dialogue-speaker-presentation의 `story-document` 기대값 실패가 기준 재현과 함께 남아 있다. 이번 통합에서 이 무관한 기대값을 수정하거나 전체 verify를 실행하지 않았다. 해당 범위는 [보고서 후보](../stage-clear-report/README.md)와 [엔딩 후보](../stage10-world-outro-ending-replay/README.md)를 따른다.

충전 입력의 기존 추출 fixture가 새 report 의존성을 제공하지 않아 처음 실패했다. 실제 수집기를 연결하고 방어 시 HP receipt를 검사하도록 보강한 뒤126건이 통과했다. 허공터의 이후 턴 HP 초기화는 방어 회복에서 제외한다. 원래 입력 assertion은 유지했다. 엔딩 캡처는 빈 img의 `complete`를 오인한 준비 조건을 naturalWidth/디코딩·페이드 완료 조건으로 교정했다. 테스트를 삭제하거나 실패 조건을 완화하지 않았다.

## 직접 연 픽셀과 한계

[3회 집중·별도 전체 검수의 직접 열람 목록/해시/판단](evidence/pixel-review.json), [전체 JPG 경로·바이트·SHA](evidence/screenshots.json). 실제 Chromium JPEG 원본이며 이미지 생성·합성·보정은 없다. 파일당1MB 미만이다.

- 보고서 [390×844](evidence/final-combined/focus1-summary-390x844.jpg), [360×800 상세](evidence/final-combined/focus1-detail-360x800.jpg), [가로 XP/고정 Next](evidence/holistic/holistic-summary-bottom-844x390.jpg).
- 지도 [360px 확대 라벨](evidence/final-combined/focus2-map-zoom-360x800.jpg), [두 보조 동작이 있는 작은 기록 메뉴](evidence/holistic/focus2-record-menu-390x844.jpg).
- 실제10장 대사 [360×800](evidence/final-map-outro/map-outro-first-360x800.jpg), [844×390](evidence/final-map-outro/map-outro-first-844x390.jpg).
- [3막 gallery](evidence/final-combined/focus3-gallery-act3-390x844.jpg), [30장 end 선택 복귀](evidence/holistic/holistic-journal-return-360x800.jpg), [통합 HUD](evidence/final-icon/hud-390x844.jpg).

10장은 앞선6턴 전투부터 새로 완주한 것이 아니라 **기존 정상21턴 탈출 직전 기록을 실제 이동으로 이어서** 확인했다. 다른 승리/해금/과거 보고서/XP는 명시적 fixture다.90개 앵커 검사는30장 전투 완주가 아니다. Chromium의 화면비·키보드·터치 에뮬레이션이며 실물 모바일·Safari·공개 Pages·장시간 저장 한도/성능은 미검증이다. 부모의 최종 픽셀 검수와 master/Pages 배포가 남아 있다. 자동 승인 거부·진행 중 쓰기·결과 불명 쓰기나 작업 차단은 없다.
