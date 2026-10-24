# 혼로 단계별 리팩토링 계획
기준: master 18c15e9aaae3c48eaa235e4a059bad3580584328, 2026-10-24.
상태: 조사·계획 확정 중. P0.1을 먼저 구현하며 나머지는 선행 단위 검증 후 순차 착수한다.

## 목적과 경계
오류를 옛 구현으로 감추는 경로, 중복 원본, 화면 수명과 맞지 않는 캐시를 줄인다. 게임의 지형·서사·승리 조건·밸런스·승인 미술·음향을 재설계하는 작업이 아니다.
조사와 기획은 조정자가 수행하고 Codex는 확정된 작은 구현 단위에만 사용한다. 관련 세션을 재사용하며 GPT-6.1 Sol / high로 명시한다. 동시에 두 코드 변경 단위를 진행하지 않는다.
없앤 기능의 구 실행 코드를 폴백으로 남기지 않는다. 다만 정상 저장 이관, 선택 초상화→기본 초상화, 브라우저 오디오 권한, 실패 안내·재시도, 열린 구 클라이언트의 해시 자산은 제거 대상과 구분한다.
삭제 판단은 이름이 아니라 실제 번들·호출·데이터 소비·저장 및 편집기 계약으로 한다. 예: PAINTED_PILOTS는 전투 공급자가 빠져 있어도 journey-art의 휴식터 그림이 소비하므로 통째로 삭제하지 않는다.

## P0: 데이터와 실행 안전성
### P0.1 저장 실패를 새 게임으로 감추는 경로 제거 — 첫 구현
근거: shared/runtime/main.js의 load는 읽기·JSON·이관 오류를 catch 후 fresh로 대체한다. persist 및 설정 저장은 같은 키를 다시 쓴다. 실제 데이터 손실 신고가 아니라 소스에서 확인한 잠재 덮어쓰기 경로다.
- 저장이 없음과 읽기 실패·형식 오류·지원하지 않는 버전·이관 실패를 구별한다.
- 실패 시 원문을 그대로 보존하고 자동 저장과 정상 캠페인 진입을 잠근다. 새 프로필을 복구 성공처럼 취급하지 않는다.
- 원본 내보내기, 다시 읽기, 기존 파일 가져오기 및 명시적으로 확인한 새 여정 경로를 제공한다. 복구 실패·취소·설정 변경이 원본을 덮지 않는다.
- 정상 load와 import의 같은 이관 절차를 한 곳에서 사용하고 중복 구현을 제거한다.
- schema 1–4, 지도 revision, 성장·SP·파티·전투·대사 진행, debug/embedded/custom-map 격리를 보존한다.
- 확인: 없는 저장, 정상 현재/이전 버전, 잘못된 JSON·버전·이관 예외·스토리지 예외, 설정 자동 저장 차단, 원문 내보내기, 취소, 정상 가져오기/새 여정 확인과 쓰기 실패. 정상 이어하기의 영향받는 경로만 검사한다.

### P0.2 화면 교체와 HUD 캐시 수명 일치
근거: App의 allySig가 전투 DOM 교체를 넘어 남아 기준4cd의 정상 Chromium 재진입에서 동일 동맹4명인데 새 목록이0개로 재현됐다. 서명을 roster DOM 수명에 귀속해 같은 저장의4명 표시와 변함없는120회 갱신의 DOM 쓰기0을 확인했다.
- 캐시를 그 DOM/화면 수명에 귀속한다. 매 프레임 전체 다시 그리기로 해결하지 않는다.
- 확인: 동맹이 있는 같은 전투의 나가기/이어하기, 다음 전투, 변경 없는 프레임의 DOM 쓰기 여부.

### P0.3 초기 실행의 불필요한 의존 제거
- shared/build.mjs의 데이터와 실제 소비자 목록을 대조한다.
- 비핵심 그림 실패가 전체 시작을 막는 경로를 재현한 경우, 필수/선택 로딩 계약과 재시도를 분리한다. 옛 그림으로 조용히 바꾸지 않는다.
- 미사용이 확인된 STAGE21_PAINTED 등만 번들에서 제거한다. PAINTED_PILOTS는 휴식터 사용 부분을 분리한 후 판단한다.
- 확인: 변경 항목의 실패·지연과 첫 진입, 해당 휴식터/Workshop 화면, 요청 수·전송량·decode 대상의 전후 비교.

## P1: 단일 원본과 책임 정리
### P1.0 현행 휴식터 장식의 독립과 옛 painted rest 퇴역 — 첫 구현
부모 감사에 따라 현행 sharedRest10이 추출하던 thread/root 두 그룹을 작은 retained helper로 독립한다. 원본 raw root 이미지1개만 현행 휴식터 데이터에 연결하고 paintedRest1–10/옛 dispatch/pilots 전체 주입을 제거한다. 위치·원본 bytes·30장 sharedRest·generic·P0.3b는 보존하며 다른 P1은 대기한다.

### P1.1 UI 갱신 책임 분리
P1.1a는 skill-images의 기존 key/sync/patch만 mandatory camp-renderer로 옮긴다. 이미지 모듈에는 canRetainHost/scan 계약을 두고 queue/cache/observer는 보존한다. ui-bridge parsing/localize와 나머지 패널 정리는 후속 대기다.

skill-images의 이미지 로딩·캐시와 모닥불 DOM 조정 책임을 분리한다. 이미 적용된 keyed skill DOM을 새로 만들지 않는다. 대화/서술/목표/모달의 공통 패널 수명과 입력·리사이즈 규칙을 정리한다.
작은 화면별 단위로 진행하고 노드 재생성·이벤트 중복·숨김/재열기·포커스·스크롤을 관련 범위에서 확인한다.

### P1.2 목표 판정과 표시의 데이터 연결
22장처럼 실제 조건을 일반 안내가 덮는 중복 계산을 줄인다. 판정 결과를 표시가 읽도록 정리하되 승리 조건은 바꾸지 않는다.
부모 조사 완료: 현재 objectives.js의 rawState → ObjectiveGuide.enhance → 각 surface는 의미 있는 경계다. 광범위 통합/전면 재작성은 제외하고 현재 경계를 유지한다. 이번 P1.1b에는 objective 코드를 변경하지 않는다. 후속 국소 필요가 확인될 때만 별도 범위를 정한다.

### P1.3 대사 및 캠페인 작성 원본 정리
현재 narrative catalogue, v0/v1 어댑터, 빌드 author 체인의 실제 의존을 기록한다. 현재 30장 텍스트와 구 저장의 진행 중 대사 cursor를 보존하는 경계를 만든 뒤 현재 실행에 필요 없는 원문 중복을 제거한다.
옛 대사 데이터에는 저장 compat 소비가 있으므로 삭제 승인 범위가 아니다. 과거 40장 또는 Workshop 경로를 30장만 보고 지우지 않는다. 대사를 새로 쓰는 작업이 아니다. 시작 용량이 늘어나는 호환 사본 추가도 피한다.

## P2: 퇴역 코드·데이터와 개발 동선 정리
- P2.1: training을 보존하면서 private makeLegacyWorld의 도달하지 않는 옛 캠페인 생성 분기만 제거하고 initializeTrainingBattle로 명명한다. public makeWorld와 callback positional ABI는 유지하며 seed geometry/dummy도 보존한다. 다른 퇴역/hooks 정리는 대기다.
- 구 atlas/REST_STYLES/초상화 대체 구현은 현재 소비자와 사용자 맵 지원을 확인한 뒤 단위별 퇴역시킨다.
- 사용하지 않는 에셋은 현재 및 보호된 발행 그래프와 겹치지 않는 범위에서만 삭제한다.
- README/ARCHITECTURE/BUGFIX_CONTEXT의 옛 8장·revision·구 방식 설명은 현재 계약과 역사 기록을 분리한다.
- 검사는 관련 기존 명령을 찾기 쉽도록 정리하되 과거 테스트 자체를 일괄 삭제하지 않는다.

## 단위별 완료 기준
1. 대상 소스, 제거할 경로, 남길 계약, 예상 이득과 위험을 짧게 확정한다.
2. 변경 단위만 구현하고 기존 옛 경로를 중복으로 남기지 않는다.
3. 변경 관련 최소 검사 및 필요한 빌드를 수행한다. 전체 verify/30장 순회/무관 스킬 검사를 기본 실행하지 않는다.
4. 원격 커밋·푸시 후 결과를 검토한다. 기능이나 성능이 같다는 주장은 실제 비교 근거가 있을 때만 한다.
5. master 및 기존 Pages에 배포하고 해당 공개 결과를 확인한다. 공개 상호작용 검사가 차단되면 로컬 재현과 HTTP 확인을 구별한다.
6. 무엇을 없앴고 무엇을 보존했는지, 검사·배포·한계를 보고한 뒤 다음 단위로 이동한다.
실패 시 다음 정리로 넘어가지 않는다. 복구는 Git으로 하며 삭제한 옛 구현을 런타임 폴백으로 재도입하지 않는다.

## 진행표
- P0.1: master4cd877f0 배포 완료. Pages40058013225 success(2026-10-24T03:24:28Z). 부모가 공개 DOM의 game.66fcb6346e75df3e.js 및 새 여정→주막 대사2/11→reload→쉼터 대화 이어가기→같은2/11을 실제 UI로 확인했다. [범위·검사·한계](profile-store-p01-20261024/README.md).
- P0.2: master46cb2b8d 배포 완료. Pages40058841045 success(2026-10-24T03:37:03Z). 부모가 공개 DOM의 game.d89af9c13535e2a5.js와 실제 debug→여정첩2장→전투 처음부터 확인 후 복만387/백산529/담허494/연실324 유지를 확인했다. [근거·범위](ally-roster-dom-p02-20261024/README.md).
- P0.3a: 미사용 HONRO_STAGE21_PAINTED 빌드 생성만 제거·검증 완료. 활성414→408파일/-829,353B, 실제 초기 Game/Workshop 각각2요청/-29,346B. 현재21장 원경 draw 동일, build/web-split·40개 공개 그래프 보존 통과. master3a8f0ac8 배포 완료. Pages40059998501 success(2026-10-24T03:53:36Z). 부모가 공개 game.ecae7cabb80a83fd.js·title 준비 완료·기존 이어가기 버튼을 실제 브라우저로 확인했다. [근거·한계](stage21-unused-build-p03a-20261024/README.md).
- P0.3b: 선택 SVG 실패/지연 격리 및 generic 준비 여부 캐시 구현 완료. 기준503 실제 재현, Native5/브라우저7묶음·build/web-split·41개 공개 그래프 보존 통과. 실제 cold 기동 관측1530–1556ms는 batch 이후 작업을 포함하며 전체 초기화1500ms 보장은 아니다. master9dcca54e 배포 완료. Pages40061152181 success(2026-10-24T04:10:43Z). 부모가 공개 game.d8d63d9c496bc88a.js·title 준비·기존 이어가기 버튼을 실제 브라우저로 확인했다. [근거·한계](optional-far-svg-p03b-20261024/README.md).
- P1.0: 구현·검증 완료. 원본 root bytes와30장 native SVG exact/web 이미지SHA 정규화 exact,10장 desktop/mobile pan/zoom/camp 및 P0.3b 관련 회귀 통과. 활성408→354파일/-21,812,619B와 초기 HTTP2요청/-62,963B를 구분했다. build/web-split·42개 공개 그래프 보존 통과. master5154db89 배포 완료. Pages40062856393 success(2026-10-24T04:36:39Z). 부모가 공개 game.9675f9baa1a8dba7.js 및 title→rest→journey10→battle→pause/rest 확인 복귀를 실제 UI로 확인했다. 복귀는 기존 정책상9장 쉼터이며 공개10장 장식 검수는 아니다. 10장 정확 비교는 기존 로컬 근거다. [범위·검사·한계](retained-guardian-rest-p10-20261024/README.md).
- P1.1a: 기존 key/sync/patch를 mandatory camp-renderer로 이동, 이미지 lifecycle exact 보존. Native 동치/캠프 모델·Chromium 실제 랭크/분기/클래스·동일 노드/중복 요청0·스크롤/제거 target 정리·build/web-split/공개43그래프 보존 통과. 포커스의 body 이동은 기준에서도 동일해 유지 성공으로 주장하지 않는다. masterd1e45a0f 배포 완료. Pages40063833834 success(2026-10-24T04:51:47Z). 부모가 공개 game.2fdc7017a36f3482.js와 debug rest→모닥불→급소시1→2 실제 클릭, 이미지25ready/4offscreen observed를 확인했다. 노드 동일성·요청수 계측 근거는 기존 로컬 검사다. [검사·한계](camp-renderer-p11a-20261024/README.md).
- P1.1b: story.js private copy/일반 페이지 tail 중복만 공유. production DOM8종·호출 순서/횟수·staging skip focus/추가save0·상태/실제Continue differential·작은 모바일/desktop 입력·build/web-split/공개44그래프 보존 통과. 낡은 document/11장 기대는 기준 실패로 구분했다. master936f2629 배포 완료. Pages40064536944 success(2026-10-24T05:02:22Z). 부모가 공개 game.48d68fb3a174b033.js 및 debug rest→설오 선택대화 본문/초상화/다음→종료복귀를 실제 UI로 확인했다. [검사·한계](story-presentation-p11b-20261024/README.md).
- P1.2: 부모 조사 완료, 기존 의미 경계 유지·광범위 재작성 제외. objective 소스 변경 없음.
- P2.1: private initializer의 도달 불가 campaign 분기 제거·training 전용 명명. main147행/8,608B 감소, production main4클래스20선택의 seed/최종battle/profile exact와 canonical1/실제split-v1 25의 callback 비호출, 실제 모바일 허공터 열기/리셋/나오기·build/web-split/공개45그래프 보존 통과. 부모 후보 검토/배포 대기. [검사·한계](training-initializer-p21-20261024/README.md).
- 나머지 P1/P2: 대기.
