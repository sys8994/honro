# 17장 인양 작업장 벡터 미술 후보

브랜치 `art/stage17-vector-finish-20261022`, 기준 공개 `6544b7da6783703b7c6d65ecc88f38023bb44322`. 최종 소스·생성물·검사 SHA **`5438c7318faeffe0454097239d46177da2850ceb`**, entry `web/entries/game.70f93cdc4760ca1f.js`.3집중과 별도 종합을 마친 **부모 미술 판단 대기 후보**다. master/Pages는 변경하지 않았다.

[최종 중앙](review/stage17-final-center.jpg) · [전체](review/stage17-final-overview.jpg) · [인양기 근접](review/stage17-final-hoist.jpg) · [모바일](review/stage17-final-mobile.jpg)

## SOP 설계·보존 카드

2막7장 두드리는 벽,11200×8200. 입구/서측 작업터→상부 암반 이동로·중앙 대형 인양기/도르래/축→하부 정비굴→동측 인양축/복구문·기록방의 구조를 보존한다.41충돌/7경로와 모든 anchor·actor·marker·목표·대사·밸런스·기계/문/낙하·붕괴/저장 초기 판정·기존 Library·타29장·원경/물/카메라는 exact 불변이다. 옛 문서의 제거된 collapse-pin/5회 방어를 복원하지 않는다. 별도 게임플레이 진단 후보를 병합하지 않았다.

변경은 act2-floor/cave-roof 및 실제 크게 드러난6자연 암반 앞면의 공통 정적 terrainPlanes와 저작 metadata뿐이다. 원래 둥근 solid 실루엣·보행선/목재 가교·사다리·기계 구조와 앞뒤 레이어를 바꾸지 않는다. 잘라 낸 작업대 모암과 자연 암편의 큰 명암/엇갈린 중간 파단/소수 짧은 절리를 연결했다. 새 충돌벽/발판/가짜 통로·반복 스탬프/미세 텍스처·프레임 생성/전용 runtime renderer를 추가하지 않았다.16장 석축이나15/16장 좌표 패턴을 복제하지 않았다.

## 실제 기준·발행 보존

Library `libfile_979eb1e9bc4c8191afca6b4db53ddcdf`/stage17-before-center.png의 현행 지원 helper 전송과 별도 로컬 목적지1회 재시도는 모두 `library file transfer failed: download failed`, 소비 환경 파일 존재 false였다. 임의 URL/인증 우회 없이 중단했다. **원본 PNG는 보지 못했다.**

허용된 같은6544 게임 entry `d6bc5a0aa4362948`의 실제 UI 입장→대화 넘기기→휠2회→중앙 팬으로 [기준 중앙](review/before-center.jpg)·[전체](review/before-overview.jpg)·[인양기](review/before-hoist.jpg)를 확보해 직접 열었다. 큰 인양기/도르래/가교는 보존할 장점이며, 자연 암반의 둥근 단색/얼룩과 바닥·천장의 빈 띠를 확인했다. 최종 중앙은 같은 절차/배율이며 follow·애니메이션 소수점 차이가 있어 픽셀 hash 일치를 주장하지 않는다.

빌드 전에 실제 성공6544/[Pages39849168900](https://github.com/sys8994/honro/actions/runs/39849168900)/부모 확인 updated_at `2026-10-22T20:30:30Z`를 등록했다. graph SHA256 `b1f611a65b7a5db66bfe1498df8665a0ec4b0cec1a37374cfb55e23f50619730`, 원본/현재 검증·복원0. 최근7일 전체+최소2개와 구934 chapter13 JSON2개를 보존한다. 후보를 성공 발행으로 기록하지 않았다.

## 작은 저작 전용 공유 처리

`tools/environment/authored-rock-planes.mjs`로 반올림/색 명도·solid 단면·정적 면 기록과 접합 polyline 분리만 공유했다.15/16의 고유 mesh/좌표/팔레트·자산은 그대로다. 두 author 각각6544 전체 campaign을 **JSON 바이트까지 재현**, 현재 승인 두 장 exact·반복 멱등/현재 프로젝트 무변경을 확인했다. 공유 runtime/렌더러 리팩토링은 없다.17장은 자기 지질 데이터만 별도로 저작하며 기존 build의 마지막 opt-in 경로에 연결한다. 전체 Act2 recipe를 재실행한 결과로 주장하지 않는다.

공유 처리 첫 검사에서는 SVG compile의 null-prototype gradient 사전과 JSON 일반 object의 strict 메모리 비교가 실패했다. 승인 JSON 바이트는 이미 같았고 검사도 실제 직렬화 경계에 맞춰 교정했다. repair 비교 첫 입력도 raw canonical과 현재 evidence/대사 초기화가 끝난 battle을 섞어 실패했다. 같은 런타임 초기화/session을 적용하고 허용 시각 필드만 제외해 다시 비교했다. 이 QA 교정을 게임/원고/저장 수정으로 기록하지 않는다.

##3회 집중·별도 종합

| 회차 | 직접 본 문제·교정 | 최종 확인·남은 특징 |
| --- | --- | --- |
|1 입구/서쪽/인양기/동쪽/하부 | 첫 후보의 동일 x 경계가 여러 층을 관통해 격자/세로 기둥처럼 보였다. 이를 통과로 쓰지 않고 층별 접합을 엇갈리고 일부 공유 층리/짧은 절리를 꺾어 교정했다. | 기존 기계·암반 실루엣·상층 길/하부 정비굴이 유지된다. 작업장 절삭면과 자연 암편은 연결되지만 동일 타일 배치는 아니다. |
|2 근접 보행/파단·가교/배우·기계 상태 | 상부 바위/기계 기단·하부 가교/복구문 전후를 직접 열었다. 몇 군데에만 짧은 절리와 얇은 모서리광을 넣고 원래 작은 발판·탄도/인물 공간을 보존했다. | 모든 새 유한 면은 기존 solid clip 안에 그려진다. 문 전후 fixture의 기존 기계/배우·새 재질 결합과 캐시를 확인했다. 정상 전투/인양틀 제압/복구 완주 증거는 아니다. |
|3 모바일 기본/최소·실제 양끝/하단 |390×844 실제 UI 기본 .82/최소 .098465, x−320/11520와 하단 y8440 도달 후 직접 열었다. 기본 입구 바닥이 한 면으로 차는 문제를 발견해 그 면 안에만 얕은 공유 파단을 넣었다. | 최종 기본 화면에서 얕은 파단으로 단색 인상을 완화했다. 외곽 수직 시작선/빈 연장부는 발견하지 않았다. 깊은 곳과 일부 가까운 모암에는 큰 저대비 면을 남겼다. 실기기 검사는 아니다. |
|별도 종합 | 최종5438c731의 새 UI 입장/중앙·전체·인양기와 근접/모바일을 다시 촬영하고 직접 열었다. 앞 수정의 회귀와 기계/경로·배우/목표의 결합을 확인했다. | 후보로 인계한다. 자동 assertion/면 수가 미술 승인을 대신하지 않으며 부모의 최종 실제 픽셀 판단이 남는다. |

최종 `final-structure`6장/`final-contact`8장/`final-mobile`6장/`final-whole`5장은 모두 같은5438c731 **clean 작업 트리**에서 촬영했다. JS/HTTP 오류0. 상태·배우/목표·카메라·sourceHashes/캐시 표본은 각 capture.json에 있다. 자동 원자료는 `_local/reports/stage17-vector-finish/`에만 둔다. Git에는 기준3장/최종 선택10장만 보존하며 각각1MB 미만이다.

전체 고정뷰1440×900 `(5600,4100,.105)`는 별도 저작 검수 카메라다. 실제 중앙1180×757은 UI 최소 .173529·x5800 부근/y입장 follow 부근, 인양기 근접 `(5600,4510,.33)`, 상부 바위 .75/기계 기단 .75/하부 가교 .55는 명시적 수동 검수다. 게임 카메라/한계값은 불변이다.

## 변경 범위 검사

- `npm run build`, `npm --prefix game run typecheck`, `node tests/stage17-vector-finish.mjs`, `node tests/authored-rock-planes-preservation.mjs` 통과. 최종 미술 입력/생성물을 빌드한 뒤 커밋했고, native/type/승인15·16 보존 검사는 clean5438c731에서 재실행했다. 로그 `/tmp/stage17-build-final.log`, `/tmp/stage17-check-final.log`, `/tmp/stage17-shared-final-clean.log`, `/tmp/stage17-type-final.log`.
- 허용17 시각 필드/metadata만 정규화한 전체 프로젝트 deep-equal. 보호 project SHA256 `4241633408558395cbe34d4f2ec42d17400278539a52f254708f99f1c00681c8`.41 polygon/7경로·anchor/actor/marker/목표·대사·밸런스/저장 초기 계약·모든 Library/타29장·runtime/main/renderer/UI bytes 불변.
- 기존 목재/작은 지형 재질 exact, 저작 재현·멱등, 전체 solid coverage, 현재 chapter17 생성물 exact. 새 유한 면의 점과 각 변1/4 표본이 원래 solid 안/경계에 있고 기존 공통 clip도 그대로다.
- 공통 prepare 재사용·sceneVersion 무효화,3회 반복 draw 새Path2D0·battle JSON/Canvas 순수성, 강제 복구 상태의 반복 캐시/순수성 통과. 정적 재사용은 draw 비용0/FPS 개선/첫 준비 비용 동일의 증거가 아니다. ms/FPS 미측정.
- 현재 production repair를 호출한 clone fixture의 원본 battle/배우 exact와6544의 같은 초기화/session을 거친 전체 기계 상태 전이가 시각 필드를 제외하고 exact다. 문 열린 상태도 재질/캐시가 유지된다. 제거된 collapse-pin/gate-debris 부재도 기준과 같다.
- 기존 traversal을 선택 실행해 `main,lower-service-route`2경로×archer1체형 무피해 통과. 적 제거/문 개방·시작점 초기화/이동력 충전의 격리 물리 검사이며 정상 전투가 아니다. `/tmp/stage17-routes.log`.
- 공개10그래프473고유 immutable 파일을 hash·길이로 확인했고 구934 `chapter-13-assets.1387b6a1f088fc74.json`/`chapter-13.516170b245a8b075.json`도 보존했다. 보호 파일 삭제/변조0. 정리된16/17 파일은 미발행 중간 후보뿐이다.

## 상태·완료 경계와 사진

[기준 중앙](review/before-center.jpg) → [최종 중앙](review/stage17-final-center.jpg), [전체](review/stage17-final-overview.jpg), [인양기](review/stage17-final-hoist.jpg), [문 닫힘](review/stage17-final-gate-before.jpg) → [문 열린 강제 fixture](review/stage17-final-gate-after-fixture.jpg), [모바일 기본](review/stage17-final-mobile-entry.jpg)/[중앙](review/stage17-final-mobile.jpg)/[왼쪽](review/stage17-final-mobile-left.jpg)/[오른쪽](review/stage17-final-mobile-right.jpg)/[아래](review/stage17-final-mobile-lower.jpg).

강제 fixture는 clone에서 선행 목표/위협 predicate만 격리하고 production repair를 호출한 후 원래 배우를 복원한다. 따라서 살아 있는 원래 인양틀/적을 유지한 **문/재질 렌더 표본**이며 정상 제압·복구 전투 상태라고 부르지 않는다. Canvas는 fixture, HUD는 원래 입장의 표시일 수 있다. source 원본 battle은 변하지 않는다. 이미 제거된 붕괴 이벤트를 만들어 검수하지 않았다.

Library 원본 전송 실패는 허용된 실제 UI 대체 기준으로 해소했고, 구현/커밋·푸시에 남은 차단은 없다. 전체30장/verify·정상17장 완주/방어·Continue·18장 입장·무관한 실패 수리는 하지 않았다. 미술 최종 판단과 최신 게임플레이 후보 통합/공개 검수는 부모 담당이다. 통합 시 최신 campaign 전체를6544로 덮지 말고17 시각 필드/metadata와 공유 author 출력 보존을 적용해야 한다. 별도 진단 브랜치/최신 master 중간 병합은 없고 새 장은 시작하지 않았다.
