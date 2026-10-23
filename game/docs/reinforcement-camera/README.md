# 증원 카메라 · 2026-10-23

최초 후보 기준은 `befca64e4026aa83d8f15326c5fc19f1e18e1677`이며, 전투 혼 보완은 최신 master `e1e4b9aaa7e1d6013c4eb1e9c9245dbca2edb435`를 통합했다. master 병합과 Pages 최종 발행은 부모 작업이 담당한다. 전 장 정상 플레이 전수 완료를 뜻하지 않는다.

## 전투 혼 필터 보완과 전달 가능한 PNG

최초 후보의 `!u.honroSpirit` 일괄 제외는 잘못된 범위였다. `act2.configureEnemy`는 resonance/echo/bellCluster/monkVessel에 실제 전투 방어 속성과 `honroSpirit/spiritHidden`을 함께 설정한다. 이 제외만 제거했다. 시각 전용 proxy(`honroVisualOnly`), 사망/먹귀/목표 proxy는 여전히 제외하고, staging에서 숨겨져 전투 배열에 없는 배우는 포착하지 않는다. `spiritHidden` 자체를 비전투 상태로 추정하지 않는다.

- `node tests/reinforcement-camera.mjs`: 살아 있는 혼/숨김 혼/현형/노출 상태 포함, 시각 전용·사망·배열 밖 hidden 배우 무초점 집중검사 추가. 기존 무리/복귀/수동 조작 회귀도 통과.
- `node tests/reinforcement-camera-spirits.mjs`: 실제 Act2 생성기의 네 전투 혼 종류, 실제 존재 방어, 숨김/노출, 무리 framing/복귀, 저장 상태 무변경 확인.
- `python tests/reinforcement-camera-spirits-browser.py`: 최신 통합 빌드 실제 Chromium 16장, 소단의 실제 spiritSight, 세 종류 전투 혼 직접 추가, 정확한 무리 중심/배율과 표적 사망 복귀, pageerror 0. 정지 inspection fixture이며 생성 안전 배치·정상 플레이 검수는 아니다.
- `node tests/player-turn-order.mjs`: 최신 행동순서의 fresh/action/다음 round/죽음/stun/수동/옛 Continue/save/import/debug 회귀 통과. 행동순서 엔진·store·compiler·전용 UI 소스는 e1e4b9aa와 바이트 동일하다.
- 최종 `npm run build` 성공. Pages39878187459(2026-10-23T00:29:18Z)의 e1e4b9aa를 성공 발행으로 등록하고 18개 발행 그래프의 고유 immutable 자산 528개 존재·크기·SHA256을 확인했다. 후보를 발행 성공으로 등록하지 않았다.
- master 병합 충돌은 생성물 HONRO.html/HONRO_WORKSHOP.html/index.html/web/manifest.json 네 개였다. 최신 발행본 기준으로 해결하고 공통 빌드로 재생성했다. 소스 충돌은 없었고 동시 UI 후속/카드 드래그 변경은 가져오지 않았다.

부모 요청에 따라 [review의 실제 PNG와 작은 JSON](review/README.md)을 Git에 보존한다. 기존 다섯 장은 0a4b27d9 당시 PNG를 변경 없이 복사했고 전투 혼 보완 뒤의 새 이미지로 표시하지 않는다. 새 16장 전투 혼 PNG 한 장과 측정 JSON은 출처를 별도로 기록했다. 최초 30장 source 감사/대표10장 직접 spawn/3장 inspection 결과를 전수 정상 플레이로 확대하지 않는다. 이번에는 필터 관련 집중검사만 추가했으며 기존 전 장 목록 검사와 기존 3장 전체 시퀀스는 불필요하게 반복하지 않았다.

## 원인과 현재 계약

- 증원 생성 경로에는 Scene에 전달하는 전용 표적이 없었다. `story-framing.bind`의 미등록 `eventSource`는 active actor를, `targetFrame`의 표적 소실은 현재 목표/active actor를 fallback으로 골랐다. 대사 화자, 턴 알림 `focusUnit`, active-unit follow도 서로 독립적으로 카메라를 갱신했다.
- `reinforcement-camera.js`는 mount/Continue의 기존 인원을 기준으로 삼고, 실제 전투 배열에 새로 들어온 살아 있는 적 ID만 포착한다. 요청 좌표·예상 생성 수·근처의 기존 적을 추정하지 않는다. 배열에서 숨었다가 다시 추가되는 scripted actor도 포함한다. 같은 프레임/450ms 내 추가 무리는 합쳐 보여 준다. 이후 연속 무리는 현재 화면에서 새 무리로 연결하며 최초 복귀점을 유지한다.
- 420ms smoothstep 팬과 로그 줌 → 생성부터 총 1,500ms까지 표시 → 420ms 복귀. 무리의 실제 몸체와 여유, HUD/대사 영역을 고려한다. 단일 적도 최소 1,200 world 폭 맥락을 유지하고 기존 배율보다 확대하지 않는다. 매우 넓은 무리는 전술 줌 하한보다 일시적으로 축소할 수 있다. reduced-motion은 이동을 즉시 적용한다.
- 증원 insert가 화자/목표/턴/active follow보다 우선한다. 같은 시점 대사는 원래 조작 시점을 복귀점으로 저장한다. 끝나면 진행 중 대사의 현재 framing으로 자연스럽게 연결하거나 기존 조작 위치·배율·manual 상태로 돌아간다.
- 실제 드래그·휠·pinch·미니맵 조작은 insert를 취소하고 1,900ms 동안 새로운 자동 초점도 억제한다. 이때 들어온 증원은 다시 재생하지 않는다. 표적이 죽거나 사라지면 원래 시점으로 복귀한다. 아군·목표용 hostile proxy·먹귀·시각 전용 원혼·훈련 표적은 대상에서 제외한다.
- 일반 이벤트는 성공적으로 추가된 ID를 `honroState.reinforcementEvents[eventId]`와 첫 대사 줄의 `reinforcementIds`에 저장한다. 늦게 열리거나 Continue로 복구되는 증원 안내도 그 ID만 사용한다. 모두 사라지거나 옛 저장의 증원 안내에 확실한 ID 이력이 없으면 해당 framing은 동작하지 않으며 다른 적/목표/아군으로 fallback하지 않는다. 이벤트 안내 첫 줄 뒤의 일반 대사는 기존 정책이다.
- 카메라 진행 상태는 Scene의 WeakMap에만 두며 전투 저장을 바꾸지 않는다. 저장되는 이벤트 ID 목록은 추가 메타데이터이고 기존 진행·스폰·행동·보상 조건을 바꾸지 않는다.

## 조사한 생성 경로

| 경로 | 실제 추가 지점 / 판정 |
|---|---|
| 일반/멀티/저격 이벤트 | `encounters.flush` → `allies.execute/prepareSpawn`. shadow 예약 후 성공한 무리만 push. |
| 일반 scripted/목표 방어 wave | `authored`, `act2.wave`, `act3-objectives.spawnHold`, `mission.reinforceHold` → `allies.execute`. |
| 10장 보스 연동 습격/공동 방어 | `mission.rush`의 두 방향 `multi` → `allies.execute`. |
| 예고/행동 경계/안전 배치 대기 | `encounter-density.spawnMembers`, `stage8-bier.spawn`, `stage22-vertical`의 실제 commit. 막힌 요청과 재시도는 실제 추가 전에는 초점을 만들지 않음. |
| scripted hide/reveal | `story-staging.reveal`의 실제 b.units 추가. 최초 배치/숨김 이전의 적을 재추정하지 않음. |
| legacy `App.spawnWave` | 현재 활성 소스에 호출자는 없지만 Scene의 공통 추가 포착 경로 적용. |
| 엔진 summon | 현행 `Engine.spawnSummon`은 플레이어 소환 경로. 아군 및 side=1 먹귀를 제외. 별도의 boss-enemy spawn writer는 활성 엔진에서 찾지 못함. |
| 초기 배치/훈련/목표 proxy | 최초 mount 인원은 prime, 훈련과 preview/editor 제외, `quest-targets.sync`의 목표 proxy 제외. |

컴파일한 30장 각각의 이벤트/hold-wave 목록을 읽었다. 아래의 직접 호출은 이벤트 자격·행동·경고 gate를 통과한 정상 플레이가 아니다. 배치 거부는 실패한 카메라 검사로 숨기지 않고 기록한다. 경로 상세 JSON은 `_local/reports/reinforcement-camera/paths.json`.

| 장 | combat 이벤트 수 | 별도 hold wave | 직접 호출에서 실제 생성 확인 |
|---|---:|---|---|
| 1 | 1 | 없음 | cart |
| 2 | 2 | 없음 | road-pressure |
| 3 | 1 | 없음 | dock-beasts |
| 4 | 2 | 없음 | siege-0 |
| 5 | 1 | 없음 | 안전/상태 gate로 생성 안 됨 |
| 6 | 3 | 없음 | bridge-crows |
| 7 | 2 | 없음 | upper-crows |
| 8 | 3 | 없음 | 안전/상태 gate로 생성 안 됨 |
| 9 | 2 | 없음 | evac-beasts |
| 10 | 1 | 없음 | sodan-hounds |
| 11 | 3 | 없음 | ravine-response-west-return |
| 12 | 0 | 없음 | 해당 이벤트 없음 |
| 13 | 0 | 없음 | 해당 이벤트 없음 |
| 14 | 0 | hold-refuge | 해당 이벤트 없음 |
| 15 | 0 | 없음 | 해당 이벤트 없음 |
| 16 | 2 | 없음 | 안전/상태 gate로 생성 안 됨 |
| 17 | 2 | hold-hoist | 안전/상태 gate로 생성 안 됨 |
| 18 | 1 | hold-silence | 안전/상태 gate로 생성 안 됨 |
| 19 | 0 | 없음 | 해당 이벤트 없음 |
| 20 | 0 | hold-convoy | 해당 이벤트 없음 |
| 21 | 2 | refuge-hold | 안전/상태 gate로 생성 안 됨 |
| 22 | 3 | compare-ledgers | 안전/상태 gate로 생성 안 됨 |
| 23 | 3 | 없음 | 안전/상태 gate로 생성 안 됨 |
| 24 | 3 | 없음 | 안전/상태 gate로 생성 안 됨 |
| 25 | 0 | 없음 | 해당 이벤트 없음 |
| 26 | 0 | 없음 | 해당 이벤트 없음 |
| 27 | 0 | 없음 | 해당 이벤트 없음 |
| 28 | 0 | 없음 | 해당 이벤트 없음 |
| 29 | 3 | old-seal | act3-response-29-0 |
| 30 | 3 | ferry-hold | 안전/상태 gate로 생성 안 됨 |

18장의 유지된 legacy hold 목록과 실제 단축판의 진행 조건을 구분한다. 본 수정은 18장 데이터/조건을 변경하지 않는다.

## 검증과 증거

- `node tests/reinforcement-camera.mjs`: 실제 ID 필터, 3개 viewport의 무리 bounds, on/offscreen, 무확대, 정확한 복귀, 죽음/삭제, 연속 추가, scripted 재추가, 수동 취소/억제, 대사 spring 복귀, Continue baseline.
- `node tests/reinforcement-camera-paths.mjs`: 30장 컴파일 목록, 대표 실제 생성 1/2/3/4/6/7/9/10/11/29장, 생성 거부 시 무초점, 첫 대사 표적 및 죽은 표적 무fallback, 실제 encounter flush와 ID 저장 JSON 왕복. 그 외 장의 정상 wave/예고 해제/보스 소환까지 실제 플레이한 것은 아니다.
- `python tests/reinforcement-camera-browser.py`: 실제 Chromium 1280×800/390×844, 3장 production event 직접 호출, 시간순 원본 PNG, 동시 대사/턴 표적 변경, 휠/드래그 취소, 연속 생성, 표적 사망, serialized remount 및 reload/Continue. 시뮬레이션을 멈춘 inspection fixture이며 정상 전투 완주 증거가 아니다.
- `node tests/camera-follow.mjs` 210건, `node tests/camera-resize.mjs` 17건, `node tests/narrative-event-delivery.mjs`, `node tests/web-build-retention.mjs` 확인. 새 런타임 소스의 정식 `npm run build`와 Chromium 실행 확인.
- 기존 `tests/camera-bounds.mjs`는 Stage18 공간 편대 `sb-a-*` 등 소실 목록의 스키마 검증에서, `tests/story-framing.mjs`는 2장 옛 대사 `위에서 돕` 기대값에서 실패한다. 동일 기준 SHA의 별도 worktree에서도 같은 실패를 재현했다. 무관한 원본/검사 기대값은 수정하지 않았다.
- 캡처: `_local/reports/reinforcement-camera/{desktop,mobile}-00-before.png`, `01-pan`, `02-group`, `03-hold`, `04-return`, `05-restored`, `concurrent-dialogue.png`. 같은 폴더 `browser.json`에 실제 카메라/표적 화면 좌표·결과, 별도 `/tmp/honro-reinforcement-*.log`에 실행 로그가 있다.
- 실제 이벤트 모든 분기 정상 플레이, 전 장 화면 순회, 전체 verify, 실기기 터치/pinch, 모든 타이밍 조합은 미실행이다. source coverage와 fixture coverage를 전수 연출 검수로 확대하지 않는다.

## 통합 시 겹침

독립 모듈과 `shared/build.mjs` 항목 하나, `renderer.js` 카메라 소유권/zoom hook, `main.js` mount/pan/minimap/pause hook, `encounters.js` 실제 이벤트 ID 보존, `story-framing.js` 증원 전용 no-fallback/복귀점을 변경했다. `story.js`, `portraits.js`, CSS, 아군 자동선택, 모닥불 설정은 변경하지 않았다. UI/행동순서 작업이 같은 `main.js`/`renderer.js` 또는 생성물에 손댔다면 부모가 작은 hook과 최종 공통 빌드를 통합해야 한다.

성공 Pages39875661732의 `befca64e` 그래프(2026-10-23T00:04:55Z)를 실제 성공 발행으로 등록한 뒤 빌드했다. 이전 성공 발행 자산은 보존하며 후보를 성공 이력으로 등록하지 않았다. 18장 단축/O05 낙하/상호작용 제한 제거/승인 UI·미술 원본은 그대로다. 승인 대기 묵종 시안·새 그림·대사 원고는 포함하지 않는다.
