# Release candidate — 엔딩 화면 교정·승인12장 통합

**요청 범위 내부 검수 통과, 부모 최종 픽셀 승인 대기.** 새 브랜치 `integration/release-candidate-20261021`에 정상 커밋·비강제 push한다. master/Pages는 변경하지 않았다. 공개 Pages 접근도 실행하지 않았으며 실패나 배포 성공으로 표시하지 않는다. 다른 cloud task의 비공개 조회·추가 지시·우회는 하지 않았다.

기준은 `728712f3db6157076fd7edd7ef0f90770069a6b5`, 승인12장 원본은 `001653efe0bd0f5a80afbf5054c52c0618b681ee`(최신 구현 `7ad53ad74aabbaa8c0aa13859cf1c08288a7392a`)다. 실제 런타임·재빌드 소스는 **`8afb034e3f2ace33f35d6e5efa52d24167940a35`**, 별도 최종 종합 실행의 검사·증거 기준은 **`71643fdeccd480337b6987b76d504947556ca167`**이다. 이후 변경은 최종 증거/보고서뿐이다. [PROVENANCE](PROVENANCE.json), [별도 종합 판정](FINAL_REVIEW.md), [원본 파일 해시·크기](evidence/MANIFEST.json).

## 부모가 바로 볼 최종 엔딩

아래 PNG는 모두 실제 Chromium 원본 캡처다. JPEG는 원본 PNG 변환물이 아니라 **동일 브라우저의 실제1440×900 화면을 별도로 quality85 캡처**했다. JPEG를 PNG라고 부르지 않는다. 모바일 PNG는 그대로 보존했다. 현재 모든 JPEG는1MB 미만이다.

| 막 | 320×568 PNG | 390×844 PNG | 844×390 PNG | 1440×900 원본 PNG / 별도 JPEG |
|---|---|---|---|---|
| 1 거목·매듭 | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act1-320x568.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act1-390x844.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act1-844x390.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus1-act1-landscape.png) · [JPEG q85](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus1-act1-landscape.q85.jpg) |
| 2 녹청 종·동굴 | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act2-320x568.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act2-390x844.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act2-844x390.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus1-act2-landscape.png) · [JPEG q85](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus1-act2-landscape.q85.jpg) |
| 3 기록·강변 | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act3-320x568.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act3-390x844.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus3-act3-844x390.png) | [PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus1-act3-landscape.png) · [JPEG q85](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus1-act3-landscape.q85.jpg) |

3막 긴 문구의 [1440 PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus2-act3-copy.png) / [JPEG q85](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/focus2-act3-copy.q85.jpg)도 확인했다. 기록/지도의 핵심 모양을 글자로 완전히 덮지 않는다. 실전10장22턴 저장을 이어 간 [실제1막 엔딩](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/final-real-checkpoint-act1.png), [안전 후일담](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/final-safe-outro-first.png), [2막 휴식터](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/endings-final/final-real-next-rest.png)를 함께 보존했다.

## 화면 교정과 소스 통합

- `contain`과 세로74% 이미지 영역을 폐기하고 전체 viewport를 `cover`로 채웠다. 세로 focal point는1막78%,2막30%,3막72%다. 가로는 중앙 구도를 최대한 남기며3막 수직 초점만58%다. 이미지 하단에 plain text를 겹치고 하단 약150–230px의 좁은 음영으로 대비를 만든다. 전체 tint·letterbox·거대한 박스·다음 버튼·초상화를 추가하지 않았다. 다음 막 제목 화면은 기존 별도 연출이다.
- 부모 공급 root 제작 version1 WebP3개는 기준728712f3와 바이트 동일하다. 생성/편집/재압축을 하지 않았다. 원본1672×941·바이트458682/471910/560200 및 SHA256은 [source-scope](evidence/checks/source-scope.json)에 있다. 원본 PNG 공급본은 부모 Library에 있고 이번 저장소 WebP를 그대로 사용했다.
- 오래된12장 브랜치를 통째로 merge하지 않았다. 승인 최종001653ef의 **12장 canonical 전체만** 가져오고 공통 compiler/schema/attachment·후방 지지·단일 빈 수레 연결을 통합했다. 옛 개별12장 후보를 중복 병합하지 않았다. 최신2/5/11장과 다른29장, 기존845개 Library 항목은 정확히 보존했다. 공통 등록6개를 추가하여851개가 됐다. [정확한 범위](evidence/checks/source-scope.json).
- `elements.js:terrainFaceClip`의 표시 연장 rim 보호는 승인 소스와 동일하다. 기본2대 수레 그림은 유지하고 단일 empty 옵션만12장에서 사용한다. 최신 조이스틱·Engine/AI·카메라·음악·스킬·엔딩 상태/입력/보상 소스는 기준본과 바이트 동일하다. shared/build의 stage2-layered-road, stage5-positioning, sodan-withdrawal, act-endings 목록을 유지하며 공통 후방 지지만 추가했다. 생성 HTML/web/hash는 소스에서 재빌드했다.

## 12장 최종 화면

일반/전체/근접/모바일 모두 실제 게임 문서에서 캡처했다. debug 정지 장면이며 정상 전체 전투 증거와 구분한다. 카메라/화면비/소스는 [capture.json](evidence/stage12-final/capture.json), 재현 입력은 [STAGE12_VIEWS](STAGE12_VIEWS.json)이다.

| 대상 | 원본 PNG | 별도1440 JPEG q85 |
|---|---|---|
| 전체 후방 지지 연결 | [전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-center-overview.png) | [JPEG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-center-overview.q85.jpg) |
| old-road 일반 / 동쪽 | [일반](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-old-road-normal.png) · [동쪽](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-old-road-east.png) | [일반 JPEG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-old-road-normal.q85.jpg) · [동쪽 JPEG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-old-road-east.q85.jpg) |
| 빈 수레 일반 / 근접 | [일반](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-carrier-normal.png) · [근접](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-cart-close.png) | [일반 JPEG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-carrier-normal.q85.jpg) · [근접 JPEG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-cart-close.q85.jpg) |
| 모바일 / 짧은 가로 | [390 수레](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-carrier-mobile.png) · [320 길표](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-sign-mobile.png) · [844 수레](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/release-candidate-20261021/evidence/stage12-final/stage12-carrier-landscape.png) | 해당 없음 |

## 새 검수와 이전 정상 전투의 구분

| 항목 | 이번 실행과 판정 |
|---|---|
| 집중1: 전체 구조 | 엔딩 각 막1440 구도,12장 center/rear-root의 연결·뒤 지지·열린 통로를 직접 열었다. `endings-focus/focus1-*`, `stage12-focus1/` |
| 집중2: 가독성 | 긴3컷 plain text와 밝은3막 기록 위 대비,12장 old-road 면 연결/일반·근접 빈 수레의 짐칸·테두리·살·바퀴를 직접 열었다. `endings-focus/focus2-*`, `stage12-focus2/` |
| 집중3: 화면비/상태 | 엔딩320·390세로/844가로의 밀도·줄바꿈·터치·키보드·reload,12장 수레390/길표320/짧은 가로를 직접 열었다. 실제 길표/열린 통로 저장도 확인했다. `stage12-focus3/`, `stage12-save-browser/` |
| 별도 최종 종합 | 최종 소스71643fde에서 새로 실행한 `endings-final/`3막×4화면비12 PNG와3막 긴 문구, `stage12-final/`10 PNG를 모두 직접 열었다. 막별 핵심·하단 문구/3막 기록 보존,12장 rear support/old-road/cart/rim/모바일을 다시 확인했다. [별도 판정](FINAL_REVIEW.md) |
| 엔딩 진행/저장 | 3막 모두4컷→제목→휴식터, touch/compatibility click/Enter/Space/진입 guard/reduced motion,2컷 reload와 실제 download/fileinput import, XP/SP/장착/가입/장부/방문수 exactly once, 완료 후 재접속 미재생. **pageerror0/HTTP실패0**. 제목 초기 이미지 요청0. [summary](evidence/endings-final/summary.json) |
| 실제10장 checkpoint | 이전 정상22턴 저장부터 실제 브라우저 Tab+D로 출구→4인 철수→안전 후일담→엔딩→다음 막 휴식터를 새 확인했다. 전체22턴 전투는 반복하지 않았다. [trace](evidence/endings-final/checkpoint-traversal.json) |
| 12장 같은 revision 저장 | 실제 초기/길표/열린 문/중간/상·하 승리7저장에서 현재 SP/HP/AI 이관 후 두번째 Continue 전체battle exact, 물리·좌표·landmark/elements 보존. [trace](evidence/stage12-saves/trace.json) |
| 12장 충돌/근접 진행 | 실제 entry R1→3, 길표 직후 R6→9, 상층 R17→19만 정상 move/defend·생산 App/Engine으로 진행. 곡괭이 근접 공격·수레/공명혼 행동·박쥐/다음 턴을 확인했다. 외부 actor/resource 쓰기0·강제복구0. DOM/시계/렌더는 double이며 수동 브라우저 전체전투가 아니다. 근접 피해·모든 전략 난이도 통계로 확장하지 않는다. |
| 12장 구 revision | 실제 구지형 초기/열린 문/terminal3개는12장 전투만 R1 재시작하고 현재 정상 이관된 성장·SP·장착·진척을 보존했다. [obsolete](evidence/stage12-saves/obsolete.json) |
| 12장 보상/연결 | 기존 실제 하층8턴·상층17턴 승리를 새 완주로 부르지 않는다. 현재 보상1회/재호출 불변·성장/장착13장 carry 및 선택한 A/B 진입을 native와 실제 브라우저에서 확인했다. 브라우저5개 저장 Continue와 download/fileinput 왕복 통과. **pageerror0/HTTP실패0**. [browser trace](evidence/stage12-save-browser/trace.json) |
| 렌더/물리 회귀 | attachment solid 외부0, old-road 보호 rim28점 무채색, 실제asset dispatch13개·순수성/캐시 한도·재사용 통과. 기존 수레2대6개 native 픽셀 동일·빈 수레 정확히2바퀴/접지 오차≤4.55e-13. 최신1/2/5/11/13/30 공통 렌더 픽셀은 통합 전과 같고, 상/하2경로×4동행 분리 이동 통과. [checks](evidence/checks/) |
| 빌드/기본 입력 | build, typecheck, author2회 멱등/다른 장 보존, joystick120, 철수/후일담 계약, web-split249개 파일hash/크기·공통 데이터·Game/embedded/Workshop 연결 통과. |
| 이전2/5/10장 | **2장16턴·5장9턴·10장22턴**은 이전 통합의 검증된 정상 실행이다. 이번에 전체 장별 전투를 반복하지 않았고 최신 소스를 바꾸지 않았다. 이전 보상/저장 검수의 범위는 [기준 통합 README](../final-integration-20261021/README.md)에 그대로 있다. |

실제 정상 저장 화면은 그 저장에 동결된 기존 장식·표현을 보존하므로, 새12장 미술의 fresh 화면과 같다고 표시하지 않는다. 브라우저는 HUD의 `encounterDensity.existingWarnings={}` 빈 캐시만 초기화하므로 native DOM double과 비교할 때 이 한 필드만 명시 정규화했다. 물리/보상/다른 상태는 그대로 비교했다.

## 한계·실패·발행 상태

초기 build는 설치되지 않은 game TypeScript 때문에 중단했고 정상 설치 후 통과했다. 새 cart 검사 초안의 빠진 `before` 선언, browser의 위 빈 HUD 캐시 비교를 교정했으며 런타임 수정으로 감추지 않았다. [실패 원문](evidence/failures/). 844px 수레 검수의 첫 카메라 y3500은 짧은 canvas 위로 수레를 잘랐으므로 검수 카메라만3300으로 고쳐 다시 촬영했다. 소스/카메라 로직은 바꾸지 않았다.

원래 통합에서 알려진 existence-damage/variety, 역사 stage2-airborne clone, current-runtime-contracts의 과거 build 해시, 과거5장 직접경로 기대/옛HP fixture/1장 story-direction 위치 기대의 실패는 이번에 수정·재검사·통과했다고 주장하지 않는다. [기존 실패와 한계](../final-integration-20261021/README.md#실패미실행남은경계)를 참조한다.

실제 휴대기기/Safari, 전체30장 연속·모든 전략/난이도·수동 전체전투·새4막·공개Pages는 미검증이다. 접근 거부/결과 불명 쓰기는 없었다. master `bafc275c10c7a256692425641d7f0e4f69c002ca`와 Pages는 부모 최종 픽셀 승인 전 보류한다. 원격 branch push와 master 반영/Pages 배포는 구분한다.

재현은 `node tests/release-candidate-scope.mjs`, `node tests/release-candidate-faces.mjs`, `node tests/release-candidate-cart.mjs`, `node tests/release-candidate-common-regression.mjs`, `node tests/release-candidate-stage12-checkpoints.mjs` 및 로컬8000 서버에서 `tests/final-act-endings-browser.py`, `tests/release-candidate-stage12-save-browser.py`, `tests/release-candidate-stage12-browser.py`를 사용한다. 엔딩 checkpoint/출력은 `HONRO_ENDING_CHECKPOINT`, `HONRO_ENDING_OUT` 환경변수로 별도 경로를 지정한다. 기존 전체 정상전투를 증거 조회만을 위해 다시 실행할 필요는 없다.
