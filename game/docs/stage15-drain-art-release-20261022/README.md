# 15장 배수 접촉·승인 미술 통합 후보

브랜치 `integration/stage15-drain-art-release-20261022`. 기준 실제 공개는 `d55b6c6876a79ce041bf7473ba43b50a10389543`이며 master/Pages에는 쓰지 않았다. 부모가 승인한 접촉 수정 `16ea6ae9` 위에 미술 helper와 opt-in 저작 연결·관련 검사/캡처·기록을 선별해 가져왔다. 미술 후보의 옛 campaign/manifest/생성물을 덮어쓰지 않았다.

| 구분 | 정확한 SHA/생성물 |
| --- | --- |
| 승인 미술 소스 | `bd69ca49d39b19573d02adf310442eb33f196a23` |
| 접촉 런타임 기준 | `16ea6ae9be928cadcf2cb62709eb35968262f209` |
| 시각 통합 소스 | `6c697b213bd64f31f686b1a2004d95e174e21fef` |
| native 검사·공통 빌드 당시 HEAD | `6fcaf694deb54908f58f1a7444d94a05f8748fa5` |
| 실제 배수/저장 브라우저 검사 당시 HEAD | `a49276d37e4e42ee5cb31a71884695eab289a96b` |
| 최종 생성물 커밋 | `80dbaf526b176ec937bf3655ee6344a63d26bcf4` |
| 게임 entry | `web/entries/game.a3ef88844bfd41a4.js` |
| campaign / 15장 데이터 | `web/data/campaign.79772371a7cedf9a.json` / `web/data/chapter-15.006c52a5adb3e7c4.json` |

검사 뒤의 변경은 테스트 어댑터와 생성물·문서·선택 JPG다. 브라우저는 빌드된 로컬 HTML을 열었다. 각 캡처의 manifest SHA256이 최종 생성물 manifest와 같음을 대조했다. 전체 기계 자료는 [evidence.json](evidence.json)에 있다.

## 통합과 보존

`applyStage15VectorFinish`를 현재 campaign에 실행했다. 결과 campaign 전체가 승인 bd69와 deep exact다. 허용한 `stage15.design.space.terrainPlanes`와 저작 metadata만 기준으로 돌리면 전체 프로젝트는 d55/16ea와 deep exact다. 기존12개 충돌 지형·아치/물가 면·A/B 경로·배우·HP·목표·대사·카메라·물효과·Library·타29장과 모든 수치는 그대로다. 바닥/천장의 승인된 정적 재질만 적용했다.

`shared/runtime`, `shared/build.mjs`, engine/map 및 game 입력은 16ea에서 **byte exact**다. 배수 접촉 모듈·공용 `place`의 선택 옵션·저장 정규화 연결을 다시 작성하지 않았다. 미술 검사의 옛 “runtime=d55” 기대만 “runtime=승인 접촉 수정16ea”로 바꿨으며, 승인 시각 exact와 시각 외 전체 campaign 불변 검사를 추가했다. 기존 나머지 계약은 유지한다.

## 관련 검사

| 실행 | 결과·범위 |
| --- | --- |
| `npm run build` / `npm --prefix game run typecheck` | PASS. 공통 Game/Workshop/direct Playtest 생성, 활성354파일 |
| `tests/stage15-drain-transition.mjs` | PASS,15기록. 원래26명 living roster, 국소 원자적 전이, 자원/행동/AI 보존,20ticks, 반복 tick/Continue, 구 저장, 플레이어/동맹 점유, 하나라도 막히면 전체 보류, 대화/행동 지연 |
| `tests/stage15-drain-contact.mjs` | PASS. 활성 예정 형상은 원래 minecart15/17을 검출, 공개 후 새 invalid0·추가 sanitize 이동0 |
| `tests/stage15-current-routes.mjs` | PASS. groove 선행, A의 수문+발판 조건/B의 수문 선택, 국소 위협, 실제 E·대화·배수·6개 저장 경계 exact·중복 보상 방지·A/B 각각16장 연결 fixture |
| `tests/act23-route-geometry.mjs 15` | PASS.4클래스×A/B의8개 기본 이동/점프 경로. 이동 예산을 준비하는 고립 지형 fixture |
| `tests/stage15-vector-finish.mjs` | PASS. 승인 시각 exact, 시각 외 전체 프로젝트 불변, helper 재현/멱등, whole-solid coverage, 생성 chapter 동등, prepare 재사용, 반복 draw 새Path2D0, render 순수성·Canvas 상태·sceneVersion 무효화 |

native 미술 검사의 옛 `stage15-drain-render-fixture`는 강제 활성 clone에서 정적 렌더 순수성과 캐시 재사용만 검사한다. 이 clone의 원래 minecart 좌표가 invalid로 기록되는 사실도 유지했다. **아래 실제 배수 전이·저장 검사의 근거로 사용하지 않았다.** 원본 접촉 실패는 [기존 수정 인계](../stage15-drain-contact-20261022/README.md)와 원자료에 보존돼 있다.

## 최종 생성물 브라우저 확인

중앙1180×757과 모바일390×844는 실제 UI로15장 진입→대화 넘기기→휠2회→중앙 팬을 했다. 전체 그림만 별도 고정 검수 카메라다. 이 미술용 UI는 debug 초기 경지1이므로 정상 캠페인 전투 조건으로 사용하지 않는다. 최종 중앙/전체/모바일을 직접 열어 승인된 바닥·천장 재질, 기존 비대칭 아치·물골·발판·목표 라벨의 결합을 확인했다. 카메라와 시각 형상을 새로 바꾸지 않았다.

별도 정상 모드 브라우저 입력은 현행 plan15 경지14.4/XP48393·4동행의 **수문 직전 도착 fixture**다. 최초 준비에서 활성 동행 한 명을 기존 수문 marker에 두고 주변 필수 위협 `a2-enemy-5/6/8`만 subdued로 공급했다. 두 먼 minecart의 원래 위치/HP/휴면 상태와 나머지 roster는 그대로이고, 수문 완료·공개 플래그·활성 발판을 입력하지 않았다.

이후 최종 HTML의 production `HonroInteractions.use`로 수문을 조작했다. 수위120 하강과 실제 대화를 거쳐 공개가 지연되는 것을 확인한 뒤, production story/Engine/mission tick으로 정상 경계에 도달해 `HonroNarrativeRevision.tick`의 실제 배수 전이가 실행됐다. 사진을 위해 배우 위치를 되돌리지 않았다. 실제 수문 행동이 끝나 설오의 행동권이 소비되고 다음 동행으로 넘어간 정상 처리는 그대로다.

| 배우 | 실제 전이 전 x,y | 실제 전이 후 x,y | 거리·접촉 |
| --- | --- | --- | --- |
| a2-enemy-15 | 6210,4553.207547 | 6290,4539.622642 |81.145238px, valid |
| a2-enemy-17 | 5890,4749.411765 | 5874,4760.235294 |19.317060px, valid |

전이 함수를 변경 없이 호출하는 읽기 전용 관찰자로 직전·직후 배우 복사본을 기록하고 원래 함수를 복원했다. 실제 전이에서는 이동 대상의 접촉6필드 외 자원/행동/AI가 exact이고 나머지 배우는 전체 exact다. 수문 상호작용·일반 story/tick이 소비한 행동권과 정상적으로 초기화한 0값 timer를 배수 위치 보정과 섞지 않았다. 이후20 production Engine ticks에도 두 minecart 접촉은 valid다.

실제 `HonroApp.export()`의 브라우저 다운로드 JSON을 저장해 다시 `Continue`했고, 전투 JSON 전체 exact를 **2회** 확인했다. 단순 profile 복사나 가짜 Blob으로 대신하지 않았다. JS/HTTP 오류0이다. 다운로드 비교는 production JSON 직렬화 영역에서 했다(DevTools 직접 객체 전송의 undefined→None 변환을 저장 변경으로 오인하지 않게 수정). 처음 fixture의 VM 배열 prototype 비교 오류와 너무 이른 전후 비교도 어댑터에서 바로잡았으며 게임 변경은 없었다.

검사 중 자동 frame 예약만 정지해 관찰/다운로드 사이의 외부 tick을 막았다. 실제 interaction/story/reveal/Engine/export/Continue 로직은 사용했고, 관찰자도 상태를 수정하지 않는다. 이 실행은 준비된 도착 조건에서 시작했으므로 **정상 전투로 수문까지 도달한 재현이나 전체15장 완주 증거가 아니다.**

## 실제 최종 JPG

소수6장, 각각1MB 미만. 중앙/모바일은 실제 UI 팬, 전체와 배수 구간은 명시한 고정 검수 카메라다. 배수 전·후·Continue를 직접 열어 물선 하강/발판 경계/두 minecart의 접촉과 Continue 후 같은 배치를 확인했다.

- [중앙](review/center.jpg) · [전체](review/overview.jpg) · [모바일](review/mobile.jpg)
- [수문 직전](review/drain-before.jpg) → [실제 배수 후](review/drain-after.jpg) → [실제 export·Continue 후](review/drain-continue.jpg)

## 발행 파일 보존과 남은 제한

빌드 전 실제 성공 이력만 재확인·등록했다. 최신은 d55/Pages39828457605/`2026-10-22T18:08:34Z`/`game.80058be2c7d5a3e3.js`다. 미발행 접촉/미술/통합 후보를 발행 이력에 넣지 않았다. 빌드 후 최근7일 전체+최소2개 정책의8개 공개 그래프454개 파일과 현재/중간 그래프까지 합친472개 파일을 읽어 SHA256·길이를 확인했다. 제거된4파일은 보호되지 않은 과거 중간 빌드 자산이며 공개 그래프 삭제/변조는0이다.

구934의 `chapter-13-assets.1387b6a1f088fc74.json`과 `chapter-13.516170b245a8b075.json`도 보호 목록과 실제 바이트를 확인했다.

기존 접촉 수정의192px/8px 샘플·ID 순서 greedy 계획 한계를 유지한다. 새 공개에서 한 배우라도 국소 해법이 없으면 전체를 보류한다. 이미 활성화된 병리적 구 저장에 국소 해법이 없으면 원거리로 보내지 않고 invalid 접촉이 남는다. 모든 손상 저장 복구를 주장하지 않는다. 실제 사용자 저장, 정상 전투 도달/전체 완주, 실기기 모바일은 미확인이다. 전체30장/전역 verify/긴 정상 완주는 실행하지 않았다. master/Pages 최종 반영은 부모 담당이다.
