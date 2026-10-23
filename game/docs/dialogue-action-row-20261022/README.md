# 투명 대사 버튼 행 · 승인 초상화 소비 경로

후속 정정: 이 기록에서 guide 버튼 행의 별도색을 유지한 것은 누락이었다. 목표안내도 투명행/body-only scroll로 보완했으며 [2026-10-23 기록](../reading-action-rows-20261023/README.md)을 따른다. 아래는 당시 실행의 역사 기록이다.

최종 통합·빌드 **`40ff1f22a200139974607a58a43d821e94ceae5b`**, 최신 master **`3b698d80e54aa2b2a840ba2107f1710ea95f4084`**의 O05 경계를 보존했다. UI32위치/소비12항목/120회 전체 검수는2d8d269a이며, UI 관련7파일은 최종 소스와 byte-identical하다. 최종40ff1f22에서 별도 UI smoke12항목·Game/embedded/Workshop 연결을 확인했다. 최종 manifest SHA `cc0c4933cceb488ee8129bd04c64ecdb64d2cf7f77766aaa3b76d3f4aa14f598`. [정확한 실행/보존](evidence/preservation.json) · [최종 smoke](evidence/final-smoke.json) · [최종 build](evidence/final-build.txt).

5890c096의 a0 발행 metadata만 갱신했을 때 활성 graph가 같았던 기록은 [O05 통합 전 증거](evidence/preservation-before-o05.json)에 남겼다. 이후 O05 병합/build가 engine/preview 자원을 갱신한 사실과 구분한다.3b 후보는 성공 발행으로 등록하지 않았다.

## 대사 버튼 행

부모 b1f10db3의 `.story-scene .story-actions{background:none}`을 유지하고 안내 행 기존색은 남겼다.424c 생성물 위에 부모 CSS와 동등한 투명 override만 적용하자 기본/긴 본문32개 표본 중8곳에서 글자가 버튼 행 뒤로 노출됐다. 원래 불투명 행은 같은 겹친 geometry를 가리고 있었다.

본문 높이 한도를 현재 창·본문 시작점·버튼 높이·padding/gap으로 정한다. 대사 생성 때1회와 ResizeObserver에서만 갱신하고 교체/분리 때 observer를 정리한다. 본문 자체만 스크롤하며 버튼 행은 투명·고정, 창은 커지지 않는다. 순수 CSS grid 시도는 auto track이 max-height 밖으로 남아 폐기했다. 프레임 루프에는 추가하지 않았다.

전체 UI 검수32위치(390×844/844×390, 기본4인·긴 담허/문탁/서술/text-only, 스크롤0/50/100%)에서 겹침0·활성 버튼 rect/hit-test/이전·넘기기·다음 touch 통과. 열린 대사의3회 회전/resize도 같은 panel을 유지했다. 짧은4인 창·본문·버튼 rect는424c와 유지(1.1px 허용오차). guide의 background는 기존 rgb(13,32,36)다. DOMRange의 글자 rect를 실제 본문 clip과 교차해 검사하며, 숨겨진 조각을 그대로 겹침으로 세던 초기 probe 오류는 보정했다.

[짧은 대사 전후](evidence/mobile-row-short.jpg) · [투명 CSS만 적용했을 때/최종 긴 대사](evidence/mobile-row-long.jpg) · [가로 긴 대사](evidence/landscape-row-long.jpg) · [text-only 중간](evidence/text-only-middle.jpg). 원래 사용자 첨부를 열었다고 주장하지 않는다. 생산13장 UI/기존 문구의 fixture다.

## 누락 원인과 현재 소비 경로

허공터는 `ui-bridge.portraits()`의 별도 벡터 dataURL 캐시를 사용했고, 승인 이미지 경로의 배율은 대사 canvas ID에 한정돼 있었다. 이 두 경로가 직접 원인이다. ID 조건을 제거하고 **portraits.js의 `framing={bust:.88,icon:1}` 한 곳**을 사용한다. 화면별 crop 예외를 추가하지 않았다. 상반신은88%, 전투의 작은 식별 아이콘은 기존100%다. head/gat 안전영역과 box aspect에 따른 crop은 공통 함수가 유지한다.

| 실제 소비 경로 | 현재 연결/목적 |
|---|---|
|story.js 대사 BASE4|공통 mount·bust0.88. NPC/등록 actor/전용 registry는 기존 vector/src fallback 유지|
|training.js 자유수련4인 카드·현재 인물 toolbar|공통 markup/mount·bust0.88. 옛 벡터 dataURL 경로 제거|
|ui-bridge.camp → main.showCamp의 동행 탭·능력치/갖춘 기예 요약|같은 승인 cache·bust0.88. core campView의 URL 인수는 투명 template marker를 host로 바꾸는 adapter로 호환|
|main 전투 HUD 동행 선택|공통 loader·icon1. 작은 전투 식별 목적을 명시|
|개별 기예 상세/장착·조율 modal|인물 초상 없음. 기존 기예 이미지·텍스트/조작 그대로|
|휴식터 풍경·전장·기예 preview·캐릭터 도감의 전신 배우|UI 승인 초상과 다른 Scene/vector 배우 경로. 그대로 유지|
|shared/engine/src/main.ts의 standalone 원형 UI|활성 HONRO App 소비 경로가 아니며 변경하지 않음|

camp adapter는 detached template의1px 투명 marker를 공통 host로 바꾼 뒤 표시한다. 큰 벡터 canvas/toDataURL 생성이나 화면별 이미지 cache를 만들지 않는다. 안정된 app/modal owner의 이름 있는 slot에 canvas를 보관한다. 원본 PNG/clean 설오/배포WebP·화풍·기존 box 크기·스킬 아이콘/게임플레이는 바꾸지 않았다.

[허공터 모바일 전후](evidence/mobile-training.jpg) · [가로 전후](evidence/landscape-training.jpg) · [모닥불 능력치 전후](evidence/mobile-camp.jpg) · [현재 인물](evidence/mobile-current.jpg). 가로 카드 이름의 기존 세로 줄바꿈도 전후 같으며 이 작업에서 레이아웃을 재설계하지 않았다. 비교 JPG는 실제 screenshot을 리사이즈 없이 나란히 놓은 자료다.

## 검사와 보존

전체 소비 경로12항목 통과: cold4카드 loading/벡터 flash0, 모바일/가로 카드·현재 인물·모닥불5개 초상, 같은 크기,12회 개폐 같은 canvas/추가 paints·request·decode0, 모든 경로4request/4decode/4entries 공유. 강제 Hwigyeom 요청 실패도12개폐 후 vector build/fallback paint/request/decode 증가0이다. [실패 시 정상 fallback](evidence/training-error-fallback.jpg).

별도 ready/abort/8초timeout 정착 후 같은 draw120회의 target clearRect/drawImage0, resize 때1회 통과. common Game/Workshop/직접 Playtest build·syntax·native NPC identity·web-split·retention 검사 통과. 처음 probe가 toolbar의 기예 icon img를 옛 인물 img로 셌던 부분을 구분했다. 새 승인 초상4개와 기예 icon은 별개이며 icon 자체를 교체하지 않았다.

[행32위치/resize](evidence/row-final.json) · [소비12항목](evidence/consumers-final.json) · [120회/timeout](evidence/repaint-final.json) · [build](evidence/build.txt) · [web-split](evidence/web-split.txt) · [retention](evidence/retention-test.txt) · [native identity](evidence/identity.txt).

18장 퀘스트·종·원고·맵·공통 builder와 O05 engine/preview는 최신3b와 동일하다. 진행 중O05를22초에 초기화하지 않는 최신 경계도 그대로이며 새 종 후보를 가져오지 않았다. main은 portrait/drawPortraits/showCamp 외 원문 동일, training의 gameplay act는 mount 호출 외 동일하다. dd878/424c/a0 각각의 공개 current354파일 및3b 후보의 current354파일과 구934의13장 자원을 byte-identical로 보존하고, 최종14개 distinct 성공 그래프4957개 entry hash를 검증했다(16개 실제 발행 이력은 동일 그래프 dedup 포함). dd878 Pages39864363155/22:24:21Z,424c Pages39867259534/22:48:07Z,a0 Pages39870152371/23:15:02Z는 모두 부모가 확인한 성공 사실로 등록했다. 후보 UI 빌드를 발행으로 등록하지 않았다.

병합 충돌은 generated HTML/manifest와 같은 발행 사실의 fixture였다. 최신 master 생성물을 기준으로 공통 rebuild하고, canonical 발행 이력을 유지했다. O05 병합의 BUG_LOG 양쪽 내용도 보존했다. O05의22초 시연/낙하 검사는 부모3b 결과를 다시 실행하지 않았고 소스/생성물 경계와 이번 UI만 확인했다. master/Pages는 부모 담당이다. Chromium headless touch/viewport 모사·음악off이며 실기기/Safari·18장 재완주·전체 캠페인·FPS 개선 검사가 아니다. 코드/이미지/환경의 남은 차단은 없다.
