# 혼로 승인 변경 최종 통합 · 2026-10-22

**요청 범위 완료.** 브랜치 `integration/honro-release-final-20261022`에 수정 단위별 커밋·비강제 push했다. master/Pages에는 쓰지 않았다. 부모가 이 보고서와 실제 JPG를 최종 검수한 뒤 배포한다.

## 정확한 소스와 입력

- **최종 실행 체크포인트: `e55542781df1fd6c049972cdf9ceb2f4cdeee87d`.** 혼잡 출구의 교정된 집중/종합 검사는 이 SHA에서 실행했다.
- **최종 런타임·생성물 SHA: `cd066c0d39783e988b473659ecba2d7fb54d3d1b`.** 세 집중 검수와 별도 종합 검수, build/typecheck/web-split은 이 SHA에서 실행했다. 이후 `e5554278`은 테스트 fixture와 BUG_LOG만 바꿨으며 활성 소스·HTML·web은 바이트 동일하다. 뒤의 보고서/증거 커밋도 실행 코드를 바꾸지 않는다.
- 235개 활성 소스 해시·digest·생성 manifest 해시: [source.json](evidence/source.json). 보존한 핵심 10개 소스의 선행 완료본과 바이트 비교: [preserved-source.json](evidence/preserved-source.json).
- 선행 브랜치를 약 2~3분 간격으로 fetch하며 기다렸다. **최종 README가 도입된 `eb4d079aff217b78044a4458bc8545e7f3ed3a16`에서 “완료”·정확한 소스·검사·한계를 읽은 뒤** 새 브랜치를 만들었다. `ICON_JOYSTICK_READY.md`를 전체 완료로 취급하지 않았다. [선행 최종 보고서](../feedback-integration-20261022/README.md).

| 승인 입력 | 최종 문서/증거 SHA | 후보 실행 SHA |
| --- | --- | --- |
| 기준 master | `b48423b360b2d6d6b1147c16811685f215a33513` | `8f4cfa683fec9e181281a7659661c76a2a16613d` |
| 선행 전체 통합 | `eb4d079aff217b78044a4458bc8545e7f3ed3a16` | `6fb1e3aed0caddef59436ae4c89877b663650172` |
| 27장 조우 속도·배치 | `b6a0e36e811465b92ccb0c02f1503708e745f452` | `a52518157ef1143c83d1693fea556c3882c62ca8` |
| 아이콘 입력 | `f35fa61de2d9f52c0e38bc8fc8d7b64c55d71654` | `c04218e4f4761b2d19e457131aae2e2a85fae3a6` |
| 보고서 입력 | `66b7cef9cd712b04a2f6acd9fcb23aa9adfe24d6` | `4699102a27217a0372770b5866b7e181db9fdeba` |
| 여정첩 입력 | `4a5843ad69c34fd0252b3a216c8d231956719940` | `47abd35422157fbd1cfb2a72fd1775db38013dbc` |
| 맵 대사·엔딩 입력 | `c491a5480a124f255ce1cc3f07d7af434c7b0973` | `5d789f7420ef05763fb0e6f945b2517b42394526` |

모든 입력이 최종 브랜치의 조상임을 확인했다([ancestry.json](evidence/ancestry.json)). 27장 JS/CSS는 후보 실행 SHA와 바이트 동일하며 확정 5컷/복귀 3줄을 다시 쓰지 않았다. BUG_LOG 충돌은 양쪽 항목을 모두 남겼다. 생성물은 후보의 오래된 결과를 선택하지 않고 합친 소스에서 정상 `npm run build`로 만들었다.

작업 단위는 `0290ce1b5a31ed7e6ae9cb014d749ef07743fac5` 승인 후보 병합·빌드, `cd066c0d` 10장 표시 수정, `e5554278` 혼잡 fixture 정산 경계 교정이다.

## 추가 수정 범위

원본 [세로 결함 화면](../stage10-world-outro-ending-replay/evidence/final/map/map-outro-first-390x844.jpg)과 가로 JPG를 직접 열어 확인했고, 선행 완료 소스에도 목표/전투 표시가 남아 있었다.

`HonroSodanWithdrawal.worldOutroDialogue(app)`는 다음 조건을 모두 만족할 때만 참이다: 정식 10장, `phase=won`, `worldOutro=2`, battle 화면, `after=outcome`, 현재 대사의 camera ID가 `10:safe-exit`. 일반 staging 메타데이터가 붙은 대사도 포함하며 다른 장·전투·도착 대사·27장 검은 공간에는 적용하지 않는다.

- 렌더에서 목표/퀘스트 표식, 선택 화살표/상태 막대/타깃 링, 의식·전투 영역/잔부, 조준/전환 가이드, 정지 투사체/궤적/전투 FX를 생략한다. 같은 월드의 인물 body를 그대로 그린다.
- 해당 battle DOM의 전투 header/minimap/roster/bottom HUD만 숨긴다. 실제 지형·원경·네 인물과 대사창·이전/다음/넘기기를 유지한다.
- 새 상태를 전투 저장에 넣지 않는다. 현재 대사에서 매번 조건을 계산하고 대사 draw/종료 때 battle class를 갱신한다. 종료·스킵 후 클래스 제거와 조건 제외 10개 변형을 검사했다.
- 적 삭제, 유닛 위치/HP, 탄도/투사체 데이터, 퀘스트/6턴 보호→탈출, 안전 배치, 보상/승패/물리/파도 규칙은 변경하지 않았다. 렌더 한 번 전후 **전투 전체 JSON 동일성**도 실제 브라우저에서 확인했다.

추가 게임 소스는 renderer/sodan-withdrawal/story와 presentation CSS에 한정된다. 보고서·성장·엔딩·축약 지도·아이콘·조이스틱 핵심 구현은 선행 완료본 그대로다.

## 세 집중 검수와 별도 종합 검수

실제 정식 모듈 빌드와 Chromium **154.0.8037.57**, CSS viewport **390×844 / 360×800 / 844×390**을 사용했다. 27장 배치 검사는 1440×900도 포함한다.

| 검수 | 확인 결과 | 실행 증거 |
| --- | --- | --- |
| 집중 1 · 27장 속도/배치/복귀 | PASS. 0.8+0.6초 진입 설정·즉시 5컷, 빠른 탭/compatibility click/100연타/반복키·Enter/Space·보이는 스킵/멈춤, 최장 문장/인물 alpha 픽셀 겹침 0, 회전, 4개 단계 중간 저장 재개, 원 파티/위치/자원/카메라/HUD/오디오 복구 | [입력](evidence/focus1-void/input/summary.json), [배치](evidence/focus1-void/layout/summary.json), [저장](evidence/focus1-void/state/summary.json) |
| 27장 + 실제 통계 결합 | PASS. FALLING/DARKENING/VOID/RETURNING 및 RESOLVED 복귀 대사에서 활성 전투 시간 증가 0. 실제 frame 관찰과 생산 수집기 호출을 함께 검사하고, 같은 수집기의 일반 전투 +1초를 양성 대조했다. 퀘스트도 동일 | [집중](evidence/focus1-void/report-time/summary.json), [별도 종합](evidence/holistic-void/report-time/summary.json) |
| 집중 2 · 10장 실제 맵 대사 | PASS. 기존 정상 21턴 체크포인트에서 실제 키보드 D로 탈출. 세 화면비 첫/중간/마지막 16줄, 이전/다음/넘기기, 중간 reload, 네 인물 접지/프레임·전투 정지·렌더 데이터 불변, 종료 클래스 제거 | [집중](evidence/focus2-map/summary.json), [별도 종합](evidence/holistic-map/summary.json) |
| 10장 혼잡 출구 | PASS. **명시적 종료 fixture**로 적 1명을 출구에 둔다. 기존 동쪽 연속 지형의 안전 배치를 보존했고 최소 적 거리 1254.03. 세 화면비에서 적/아이템·정산 후 영웅 기록 불변, 실제 reload 후 전체 units 문자열 동일 | [교정 후 집중](evidence/focus2-crowd-corrected/summary.json), [교정 후 종합](evidence/holistic-crowd-corrected/summary.json) |
| 집중 3 · 엔딩/보고서/지도 | PASS. 10/20/30 첫·재클리어 12흐름, 해금 경계 7개, 독립 gallery 6개, 컷 reload/완주/Escape/닫기/Back/회전. 정산 1회, 보고서 동결, gallery 정산 0회와 전체 profile/localStorage 동일, 원 지도 DOM/막/선택/확대/스크롤 복원 | [엔딩](evidence/focus3-endings/summary.json), [연계 70판정](evidence/focus3-report-map/checks.json) |
| 축약 지도 | PASS. 기록 메뉴에서 보고서/엔딩을 실제 클릭하고 돌아온다. 상단 52px/하단 64px 유지. 90개 앵커 표본·확대 9/10 상대 라벨/겹침/44px·곡선 진행·잠김·휠/키보드/핀치·이미지 재시도 | [지도](evidence/focus3-journey/release-final-results.json) |
| 아이콘/조이스틱 보존 | PASS. 30클릭+30갱신의 버튼/그림 identity 4/4, DOM 생성/제거·SVG flash·src/decode/resource 추가 모두 0. 현재 master도 동일 캐시를 유지한다. 실제 trusted touch→PointerEvent 371판정, 19/20/21° 이탈 이동·재진입 정지, 수평 시작/취소/멀티터치/키보드 | [아이콘](evidence/icon/icon-results.json), [드래그](evidence/joystick/sector-results.json) |
| 별도 전체 실제 픽셀/동작 | PASS. 집중 검수 후 27장 전체 흐름·Workshop Playtest·시간, 10장 맵/혼잡, 보고서/세 막 gallery/지도 복귀를 별도 실행했다. 연계는 다시 70판정 통과 | [27장](evidence/holistic-void/final/summary.json), [연계](evidence/holistic-report-map/checks.json), [직접 열람 54장](evidence/pixel-review.json) |

정상 10장 탈출 이동과 혼잡/20·30장 승리 fixture를 같은 완주 증거로 세지 않았다. 27장도 명시적 심부 배치 fixture다.

## 빌드·회귀·실패 분리

- PASS: [정상 build](evidence/checks/build.txt), [game typecheck](evidence/checks/typecheck.txt), [web-split 349자산](evidence/checks/web-split.txt). 같은 코드에서 build 재실행 후 Git diff가 없었다.
- PASS: void runtime, report data/App/carry/recovery, withdrawal, dialogue-controls-audio, story-anomaly-environment, bell-anomaly, joystick-intent, charge-input 126건, camp-persistence, camp-skill-ux, rest-journey, skill-image-icons. [35개 초기 명령·종료 코드·환경·실행 SHA](evidence/checks/validation.json).
- 아래 **4개는 미통과**다. 현재 master `b48423b3` detached 작업 트리에서도 각각 직접 실행했고, 작업 경로만 정규화하면 stdout/stderr 전체가 최종 통합과 동일했다. [대조 JSON](evidence/checks/failure-comparison.json), [기준 로그](evidence/checks/baseline-master/summary.json).

| 검사 | 같은 기존 실패 |
| --- | --- |
| game/tests/regressions.mjs | Stage 8 `bier-knot-0: 2520,3750.4` |
| dialogue-speaker-presentation.mjs | `story-document` 기대값 |
| story-canon-v1.mjs | 29장 구 revision 대본 비교 |
| act3-split-campaign.mjs | 합류 XP `83635 !== 83652` |

처음 맵 스모크에서 일반 대사에도 staging 메타데이터가 붙는 것을 발견해, 미커밋 초안의 `!staging` 조건을 실제 `10:safe-exit` ID로 교정했다. 최종 코드에서는 세 화면비가 통과했다.

혼잡 fixture의 **새로 드러난 결합 실패**는 별도로 조사했다. outcome 이전 영웅 기록과 보고서 정산 후 기록을 비교하던 assertion이며 선행 완료본 `eb4d079a`에서도 [동일 실패](evidence/checks/crowd-predecessor.txt)를 재현했다. [차이 진단](evidence/checks/crowd-settlement-diagnosis.json)은 XP만 달라짐을 보인다. 교정은 XP만 변하고 동결 보고서와 일치하는지 먼저 확인한 뒤, 표시/재개 중 데이터 불변성을 검사한다. 이어 드러난 다음 화면비의 pagehide 저장/fixture 주입 경합은 화면비마다 별도 브라우저 저장 컨텍스트로 제거했다. 게임 XP/저장 코드는 수정하지 않았다.

초기 집중/종합의 crowd 실패 로그와 임시 교정의 timeout도 삭제하지 않았다. [교정 후 두 실행 모두 exit 0](evidence/checks/crowd-corrected-validation.json). 이 교정 뒤에는 테스트/문서만 바뀌었으므로 영향받은 crowd만 집중·종합으로 재검사했다.

## 실제 JPG와 인계 한계

보관한 **235개 실제 JPG 모두 1MB 미만**, 최대 **252,644바이트**다. [전체 파일/바이트/크기/SHA](evidence/screenshots.json). 54개 원본을 직접 열었으며, 종합 27장 세 화면비의 5컷 전부와 10장 세 화면비의 첫/중간/마지막 전부를 포함한다. [직접 연 파일과 판단](evidence/pixel-review.json). 일부 27장 JPG는 DPR 2이며 표의 viewport는 CSS px다. 이미지 생성·합성·보정은 하지 않았다.

- 10장 실제 맵: [첫 390×844](evidence/holistic-map/map-outro-first-390x844.jpg), [중간 360×800](evidence/holistic-map/map-outro-middle-360x800.jpg), [마지막 844×390](evidence/holistic-map/map-outro-last-844x390.jpg).
- 혼잡 출구 fixture: [세로](evidence/holistic-crowd-corrected/crowded-safe-map-390x844.jpg), [가로 재개](evidence/holistic-crowd-corrected/crowded-safe-resume-844x390.jpg).
- 27장 긴 문장: [360×800](evidence/holistic-void/final/360x800-cut4.jpg), [844×390](evidence/holistic-void/final/844x390-cut4.jpg).
- 보고서/지도: [실제 XP·경지 상승](evidence/focus3-report-map/focus1-summary-390x844.jpg), [가로 고정 다음 동작](evidence/holistic-report-map/holistic-summary-bottom-844x390.jpg), [작은 기록 메뉴](evidence/holistic-report-map/focus2-record-menu-390x844.jpg), [확대 9/10 라벨과 곡선](evidence/focus3-report-map/focus2-map-zoom-390x844.jpg).
- 독립 엔딩: [1막 세로](evidence/holistic-report-map/focus3-gallery-act1-390x844.jpg), [2막 가로](evidence/holistic-report-map/focus3-gallery-act2-844x390.jpg), [3막 작은 세로](evidence/holistic-report-map/focus3-gallery-act3-360x800.jpg), [원 여정첩 복귀](evidence/holistic-report-map/holistic-journal-return-360x800.jpg).

**미실행:** 전체 30장 정상 완주, 10장 앞선 6턴 전투의 새 완주, 20/30장 정상 전투 완주, 전체 `verify`, 실물 모바일/Safari, OS 백그라운드 수명주기, 장시간 성능, 공개 Pages 검증. 자동 검사나 viewport 에뮬레이션을 이 항목의 통과로 부르지 않는다.

요청 범위의 미해결 차단·자동 승인 거부·결과 불명 쓰기는 없다. 기존 4개 회귀 실패는 남아 있으며 위에 구분했다. **부모의 최종 픽셀 판단, master 병합·Pages 배포·공개 사이트 검증은 남겨 두었다.**
