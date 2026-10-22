# 휴식터 중심 이동과 여정첩 UX · 후보

- 기준 master: `d33402627e0c632593a388ec19e0b5370cc68439` (착수 시 fetch, 조상 관계 확인).
- 후보 브랜치: `feat/rest-hub-journey-flow`.
- 구현·검사 커밋: `e581d8582059e8e56e35df50576832617832f205`.
- 후보만 작성한다. master 병합·GitHub Pages 배포는 하지 않았다. 부모의 최종 픽셀 검수와 반영이 남아 있다.

## 버튼 흐름

1. 전투 정지 메뉴 → **휴식터로 가기** → “진행 중인 전투는 초기화됩니다. 휴식터로 돌아가시겠습니까?” → **취소 / 돌아가기**.
2. 취소·닫기·배경 닫기는 엔진과 저장을 보존한다. 확인창이 열린 동안 대기 중인 자동 저장도 보류한다. 승인 뒤 live 엔진/장면과 저장 전투를 폐기하고 즉시 저장한다.
3. 휴식터 → **여정첩** → 막/구간 선택 → spot 선택 → 하단 **휴식터로 진입** 또는 **스테이지 진입**. spot 선택은 이동·저장·전투 폐기를 호출하지 않는다.
4. 휴식터가 있는 spot은 해당 장소의 휴식터를 열고, 그곳의 **스테이지 진입**이 새 전투를 시작한다. 휴식터 없는 spot의 **스테이지 진입**은 직접 새 전투를 시작한다.
5. 휴식터/여정첩에서 이전 전투가 남아 있으면 같은 스테이지라도 **취소 / 새로 시작** 확인을 거친다. 타이틀 **Continue**의 기존 자동 전투 재개와 엔딩 재개는 유지한다.
6. 상단의 숨은 뒤로 버튼은 여정첩에서 제거했다. 하단 **휴식터로 돌아가기**를 항상 표시한다. 선택한 과거 휴식터는 `honroJourney.restStageId`로 재방문·새로고침에 보존하고, 실제 전투 진입 시 해제한다.

짧은 가로에서는 정지 메뉴만 2열로 배치해 휴식터 버튼을 바로 보이게 했다. 설정창 전체를 개편하지 않았다. 정지/확인 중 기존 턴 배너가 문구를 가리지 않으며, 이동 직후 400ms 동안 같은 포인터의 두 번째 탭이 새 화면의 버튼을 누르지 않게 한다. 키보드·보조 기술의 detail=0 클릭은 유지한다.

## 막 해금과 지도

- `HONRO_CONTENT.stages`의 정식 `act`를 사용한다. 1막의 기존 생략 act는 1로 해석한다. 지상/지하는 막 번호가 아니다.
- 일반 모드는 이전 막의 마지막 정식 스테이지 완료로 다음 막을 연다. 현재 기준은 **10장 완료 → 2막**, **20장 완료 → 3막**이다. 마지막 장 해금 자체는 기존 `requires`를 따른다.
- 1막 미완료 시 1막만, 1막 완료 후 1·2막, 2막 완료 후 1·2·3막 지도만 렌더한다. UI 버튼뿐 아니라 선택·이동 핸들러에서도 검증한다. 잠긴 막의 SVG·spot·경로는 만들지 않는다.
- 상단 6칸은 **1막–6막**이다. 4–6막은 비활성 **준비 중**이며 플레이 가능한 콘텐츠를 만들지 않았다. debug는 기존 검수 목적에 맞게 구현된 1–3막만 연다.
- 2막 내부에 **지상 접근부(11·12장)** / **지하 구간(13–20장)** 선택을 둔다. 1막에는 11·12장 pin이 나타나지 않는다. 3막은 기존 city 지도를 사용한다.
- 지역 지명은 기존 좌표의 지도 위 텍스트로 남기고 막 탭에서 뺐다. 기존 지도 SVG·지형·맵 앵커는 변경하지 않았다. 같은 surface 원화를 1·2막이 공유하므로 지형 그림 일부는 겹치며, 이번 범위에서 새 지도 미술을 만들지 않았다.

## 휴식터 유무 판정

단순히 `restName` 존재 여부로 판정하지 않는다. 모든 30개 장소에 저작용 설명이 있지만 기존 정상 진행은 일부 구간의 휴식을 생략한다. 단일 `HonroRestJourney.hasRest(id)`가 CTA와 허브 목적지에 같은 기준을 적용한다.

| 직접 진입 | 기존 흐름 근거 |
|---|---|
| 2장 | `journey-content.transitionAfter(1) === 'direct'`: 진행 중인 장례 행렬 |
| 10장 | `transitionAfter(9) === 'direct'`: 소단의 매듭 사건 연속 |
| 19장 | `transitionAfter(18) === 'direct'`: 같은 묵종 공간의 의식 연속 |
| 25–28장 | `split-campaign`의 24장 준비 후 두 조사팀 연속 조사/합류. 24장이 마지막 준비 휴식터 |

나머지 구현 장소는 휴식터로 진입한다. 해당 전투에서 휴식터로 돌아갈 때는 현재 장 이하에서 가장 가까운 휴식터를 사용한다(예: 2→1, 10→9, 19→18, 25–28→24). 30장 완료 뒤 terminal spot은 기존 **강변 쉼터**로 돌아간다.

## 저장 폐기 범위와 모드

- **승인 전:** `stopBattle`, 전투 스냅샷 교체·삭제, 영구 진행 저장을 호출하지 않는다. 프로필 소유자와 세션을 승인 시 재검증한다. 화면 닫기/취소는 pending 요청만 해제한다.
- **승인 후:** 현재 전투의 획득 성장·보상 원장을 먼저 기존 경로로 보존하고, 엔진/scene·`honroBattle`을 비운다. 사용 완료한 캠프 배정 표시·맵 재시작 표시·자동 direct 진입·전투 retry 임시값을 해제한다. dirty를 비우고 즉시 persist한다. 새로고침 후 옛 전투가 살아나지 않는다.
- **보존:** 캠페인 완료·해금, 영웅 XP/경지·기예/SP·장착, 소지품 프로필, 합류 동료·기록·seen, `honroGrowth` 원장. 보상 계산/중복 제한 코드는 수정하지 않았다. replay 표시는 완료 기록에서 결정한다.
- **분할 조사:** 현재 전투의 HP/상태 스냅샷을 재개하지 않고 기존 장 시작 체크포인트로 되돌린다. 같은 분할 장의 새 전투는 기존 시작값·팀을 사용한다. 명시적으로 다른 여정을 선택하면 진행 중 원정의 임시 carry 사슬만 해제하며 캠페인 완료·성장 원장은 유지한다. 기존 결과의 자동 연속 전투는 수정하지 않았다.
- **debug:** 격리된 메모리 사본만 변경한다. 정상 저장은 유지한다. spot을 눌렀다고 즉시 이동하지 않는다.
- **허공터/커스텀/embedded:** 연습·사용자 맵이 보호된 캠페인 전투를 소유하지 않는다. 원래 여정으로 복귀할 때 그 snapshot을 보존한다. 이후 캠페인의 명시적 진입은 다시 확인한다. 자동 저장·내보내기의 기존 분리 규칙을 유지한다.
- **로딩:** 진입 자산을 먼저 준비한다. 로딩 실패·취소 전에는 snapshot을 폐기하지 않는다. 승인 결과는 한 번만 실행한다.

## 엔딩 보존

`act-endings.js`와 콘텐츠/그림은 원본 바이트 그대로다. 휴식터·여정첩 진입 경계에서 pending 엔딩을 먼저 표시해 4컷/제목을 건너뛰지 않는다. 10·20·30장 pending/seen, 컷2 Continue·파일 가져오기, 중복 outcome, 보상·동료·장착 유지, seen 뒤 재접속 미재생을 실제 Chromium에서 확인했다. 3막 뒤 **4막 준비 중 → 강변 쉼터** 경계도 보존했다.

## 검증

터미널 승리·캠페인 진행은 명시적 fixture다. 실제 브라우저 입력/저장/레이아웃 증거와 정상 전투 완주 증거를 구분한다. 이번 작업은 정상 30장 완주나 난이도 검수가 아니다.

| 검사 | 결과 |
|---|---|
| `npm run build` | 최종 Game/Workshop/direct Playtest 생성 성공 |
| `npm --prefix game run typecheck` | 통과 |
| `node tests/web-split.mjs` | 해시·자산 그래프·native/embedded 기본 진입·저장 보호 통과 |
| `npm run test:rest-hub-journey-flow` | 14그룹 통과: 신규/기존 저장·해금·선택·CTA·취소/승인·새로고침·새 전투·영구 진행·debug·허공터·replay·종료 휴식터 |
| `node tests/journey-stage-departure.mjs` | 6그룹 통과 |
| `node tests/rest-journey.mjs` | 9그룹 통과: 도착 대사·예전 중단 저장·합류·자동 direct 연결 |
| `node tests/camp-persistence.mjs` / `camp-reward-budget.mjs` | 11 / 4그룹 통과 |
| `node tests/rest-scene-controls.mjs` / `rest-idle.mjs` | 8 / 7그룹 통과 |
| `journey-art` / `journey-atlas-proof` / `journey-layout` | 기존 그림 구조·act별 pin/경로·투영·viewport 식 통과 |
| `python tests/journey-gestures-browser.py` | Game/Workshop Playtest, 두 모바일 방향에서 41항목 통과. 휠·경계·드래그·핀치·취소·키보드·저장 보존 |
| `python tests/rest-hub-journey-browser.py` | 실제 Chromium **360×800, 390×844, 844×390, 1280×900** 통과. 정지/확인/휴식터/탭/고정 CTA/진입, 취소/승인/폐기 reload, 회전/드래그/휠/더블클릭. 확인창 대기 중 자동 저장 보류도 검사 |
| `python tests/rest-hub-act-endings-browser.py` | 1–3막 4컷→제목→휴식터, 중간 Continue/가져오기·보상/합류 중복 방지 통과 |
| `git diff --check` | 통과 |

### 기존 실패·미실행

- `quest-targets-app-resume`: `ReferenceError: window is not defined`, `App.bind`의 기존 resize 등록에서 실패. 기준 `d3340262`의 main 소스로도 동일 실패를 재현했다.
- `custom-map-return-profile`: 17/18그룹 통과. 기존 ‘새 여정 이후 reload’ assertion의 `honroBattle:null`/`upgradeNotice:false` 기대값 차이가 기준 main/rest 소스에서도 동일하다. 새 이동의 원본 보호·커스텀 복귀·debug·embedded·허공터 항목은 통과했다.
- `journey-content`: 첫 20장 서술/기존 긴급 연결 감사 후 5장 옛 대사 `방금 저 줄도 당겨졌소` 기대값에서 실패한다. 해당 테스트·대사·journey-content 원본은 기준과 동일하며 이번 UI에서 문구를 되돌리지 않았다. 따라서 묶음 `test:rest-journey` 전체 통과로 표기하지 않는다. 관련 동작 검사는 위와 같이 개별 실행했다.
- 동시 Node 검사 중 빌드 1회가 자원 종료(`Killed`)되어 다른 검사를 끝낸 뒤 직렬 재실행했다. 최종 빌드/그 결과물의 브라우저 확인은 별도로 기록한다.
- **전체 `npm run verify`는 실행하지 않았다.** 전체 migration/integration·전 장 정상 플레이·실기기 Safari·Pages 검증은 하지 않았다.

## 실제 화면·소스 보존 증거

[브라우저 결과](evidence/browser-results.json), [엔딩 결과](evidence/endings/flow-summary.json), [84개 이미지와 지도/엔딩 소스 보존 해시](evidence/source-preservation.json), [검사 로그](evidence/checks/).

| 크기 | 정지 메뉴 | 확인창 | 휴식터 | 1막 선택/CTA | 2막 지상 / 지하 직접 진입 |
|---|---|---|---|---|---|
| 360×800 | [보기](evidence/360x800-pause.jpg) | [보기](evidence/360x800-confirm.jpg) | [보기](evidence/360x800-rest.jpg) | [보기](evidence/360x800-act1-cta.jpg) | [지상](evidence/360x800-act2-surface.jpg) / [지하](evidence/360x800-act2-direct.jpg) |
| 390×844 | [보기](evidence/390x844-pause.jpg) | [보기](evidence/390x844-confirm.jpg) | [보기](evidence/390x844-rest.jpg) | [보기](evidence/390x844-act1-cta.jpg) | [지상](evidence/390x844-act2-surface.jpg) / [지하](evidence/390x844-act2-direct.jpg) |
| 844×390 | [보기](evidence/844x390-pause.jpg) | [보기](evidence/844x390-confirm.jpg) | [보기](evidence/844x390-rest.jpg) | [보기](evidence/844x390-act1-cta.jpg) | [지상](evidence/844x390-act2-surface.jpg) / [지하](evidence/844x390-act2-direct.jpg) |
| 1280×900 | [보기](evidence/1280x900-pause.jpg) | [보기](evidence/1280x900-confirm.jpg) | [보기](evidence/1280x900-rest.jpg) | [보기](evidence/1280x900-act1-cta.jpg) | [지상](evidence/1280x900-act2-surface.jpg) / [지하](evidence/1280x900-act2-direct.jpg) |

각 `*-fresh-stage.jpg`는 실제 새 1턴 진입 후 정지해 캡처했다. 모든 JPG는 실제 Chromium 캡처이며 파일별 1MB 미만이다. 새 그림을 생성하지 않았고 지도 미술(2-4)·초상화(3)·설정창 전체 재설계(4)는 구현하지 않았다. 부모의 최종 미술/픽셀 승인과 master/Pages 반영이 남은 단계다.
