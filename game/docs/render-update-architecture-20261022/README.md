# 갱신 소유권·렌더링 검토 · 2026-10-22

확인된 불변 DOM 쓰기와 기본 일시정지의 동일 전장 재그리기를 제거했다. **일반 전투의 큰 실루엣/궤적 비용과 사용자가 말한 플레이 지속 후 점증 렉은 미해결**이다. 원래 누적 조사는 `fix/battle-runtime-performance-20261022`의 별도 보고서에 보존했다. 폐기한 raster 후보는 적용하지 않는다.

## 실행 기준과 재현

- 기준 master: `a091c6bd5e64eff748f5028fb6d0080faea3da87`. 2막/엔딩 및23장 수정이 포함된 기준이며 장/미술/충돌/적/전투 수치 소스는 바꾸지 않았다.
- DOM 수정 빌드: `2445358072892f3329758f56f1b76a8e0a00d9ce`. 이후 pause 재사용·canvas origin·legacy fallback을 포함한 최종 런타임: `29487122a2650d0e9736db1d13824cb825c82439`.
- 최종 실행 HEAD: `6d953327c32bfabe3de65ba5301066d55ae87e34`(런타임은 위 SHA와 동일, 계측 도구의 배너 종료 대기만 추가). 모든 accepted 실행의 tracked tree는 clean이었다. 최종 manifest SHA-256: `217cebb07cac6e131a4900d8a51fd95c70c56e6f7dba4b34dd0be6a194bf3416`. HTML: `9074fe2c9e6f4788f6b0e45a0ece19c00e16c35ed98fffa95f0679b7ec57ad64`. sampler/runner 해시는 raw JSON에 있다.
- Chromium `154.0.8037.57`, headless/software 환경,1280×800/DPR1. 모바일은390×844·844×390 및 DPR2를 Chromium에서 모사했다. 물리 Android/Safari 검사 아님. 음악/효과음 off, 동일 level10 QA roster,1–10장 개방 기록, 브라우저 RNG899411. 사용자 실제 저장/실기기/난이도 승인 표본 아님.
- **채택한 최종 조건**: 정상 camp 화면에서 아이콘 warmup 완료(cached84/active0/queued0/failed0) → 현행11장 새 진입 → 도입 대화 종료 → 생산 App.frame/Story가 시작 배너를 정상 종료 →900ms warmup → 대표 상태. 자연 App rAF/실제 AI·HUD·저장 루프를 사용하며 직접 tick하거나 정상 애니메이션을 멈추지 않는다.
- pause A/B는 동일 고정 카메라(x=active.x,y=active.y−140,scale=.68,manual=true), 같은 입력으로 일반 pause 메뉴를 열고 각240 frame을3회 측정했다. before는 DOM 수정까지 적용된24453580, after는 최종 실행6d953327이다. 정상 전투/미리보기/휴식터/여정첩은 각120 frame의 별도 대표 계측이다.

```sh
BUILD_ROOT=/workspace/honro-render-dom STEADY=1 MODE=measure RUN=accepted-dom-pause-1 STATES=pause-fixed FRAMES=240 python tools/testing/render-update-architecture.py
STEADY=1 MODE=measure RUN=accepted-final-pause-1 STATES=pause-fixed FRAMES=240 python tools/testing/render-update-architecture.py
STEADY=1 RUN=accepted-count FRAMES=120 JPG=1 python tools/testing/render-update-architecture.py
BUILD_ROOT=/workspace/honro-render-baseline STEADY=1 RUN=accepted-before-dom-count STATES=idle,pan,pause FRAMES=120 python tools/testing/render-update-architecture.py
python tools/testing/render-paused-boundaries.py
python tools/testing/render-update-boundaries.py
```

baseline worktree는 a091c6bd, dom worktree는24453580이다. 입력 fixture는 `tests/fixtures/render-update-profile-20261022.json`. MODE=count는 함수/DOM/레이아웃/canvas 호출을 owner별로 계측한다. MODE=measure는 이 wrapper 없이 App.frame elapsed/rAF/longtask와 DOM observer를 기록한다. 샘플러의 대기 rAF는 생산 예약 수와 구분한다. **Scene/HUD/Preview는 frame 안에, status/skill은 HUD 안에 포함되므로 시간을 합산하지 않는다.** elapsed는 스케줄링 지연도 포함하며 순수 CPU instruction time/GPU 시간이 아니다.

## 갱신 소유권 지도

| 경로 | 빈도·소유권·무효화 | 검토 결론 |
|---|---|---|
| App.frame → audio/story | 단일 App rAF. ending/void/withdrawal 분기는 다음 예약 후 return | 중복 App 루프 없음. 내부 오디오 설정 감지·이야기 clock 유지 |
| frame → Engine.tick | 모달/대화/이야기 pause/done이 아닐 때120Hz accumulator, 최대32step, planning4ms | 시뮬레이션/AI/전투 규칙 변경 없음 |
| frame → renderBattleFrame → Scene.render | 일반 전투 매 rAF. 시간 기반 camera/대사/preview는 기존 경로 | **기본 pause-dialog의 실제 불변 전장만 재사용** |
| Scene → 배경/정적 지형 | world/appearance/scene version·해상도·view별 기존 cache | 기존 타일12/24(별도 opt-in20/48), 화면 두 슬롯 각6Mpixel 제한, authored far LRU3 유지. raster 재작성 없음 |
| Scene → 유닛/물/실루엣/궤적/FX | 정상 view animation·simulation/effect clock | 여전히 큰 비용. 표현/해상도/애니메이션을 줄이지 않음 |
| frame → charge display | 매 rAF, HUD frame은 HUD가 한 번 소유 | 중복 호출·동일값 text/style/dataset 쓰기 제거 |
| frame → HUD | uiAge>.11초 + 명령 직후 force | HP/기력/이동력/조준/턴/바람별 diff. HUD 전체를 하나의 sig로 막지 않음 |
| HUD → skill/status/passive/interact | 매 HUD 검사, 기존 signature/keyed DOM | 스킬 keyed DOM/cache 재사용을 유지. 상태 칩/목표 text/title 동일값만 제거 |
| HUD → minimap | visible일 때 HUD 주기 | 정적 지형+동적 유닛/목표/카메라. 동일 sizing 쓰기 및 중복 rect 읽기 하나만 제거. 새 static cache는 미채택 |
| modal open/close | 입력 이벤트에서 DOM 생성/제거 | idle에서 shell 재생성 없음.20회 개폐 후 DOM 일정 |
| frame → SkillPreview.tick | connected preview + 열린 modal | 별도 실제 Engine/Scene·카메라·관측값 유지. battle 위 preview도 계속 진행 |
| skill-images | body MutationObserver + IntersectionObserver, URL별 상태/cache | 최대84 decoded originals·4job. idle callback의 전체84개 선제 warmup이 콜드 계측과 겹칠 수 있음. 매 frame 재생성과 구분 |
| portraits | actor identity/ratio별 원본 bust cache, 최대8 | 기존 crop/품질/초상화 변경 없음 |
| frame → rest | 같은 App rAF, visible·connected 조건, desktop24Hz/mobile20Hz | 기존 감속/reduced motion 정책 유지. 별도 무한 루프 없음 |
| journey labels | mount/restore/resize/zoom/scroll | zoom→layoutBook→labels 뒤 scroll 보정→labels와 scroll rAF 중복 존재. idle는0. 이번에는 변경하지 않음 |
| 저장 | dirty + 마지막 저장1200ms 이후 및 종료/명령 경계 | roster sync/battle clone/persist 유지. schema/게임 상태 변경 없음 |

소스: `shared/runtime/main.js`, `renderer.js`, `combat-status.js`, `objectives.js`, `skill-images.js`, `skill-preview.js`, `rest-journey.js`, `portraits.js`, `authored-far-art.js`. 기존37모듈/초기 요청 감사는 `INTRO_LOADING_AUDIT.md`를 재사용했으며 새 전체 감사를 하지 않았다.

## 채택한 변경과 계측

### 표시값별 DOM diff

실제 node 값을 비교해 교체된 DOM에 오래된 signature가 남지 않게 했다. 인물 chip만 보호하던 hudSig를 전체 HUD gate로 확장하지 않았다. 발사 tooltip은 status refresh 한 곳이 disabled 이유/이전 발사값을 소유한다. enabled 이전 발사 hint가 다음 HUD 갱신에서 반영되는 차이(기존 charge display는 매 frame)는 있다. 연속 게이지·폭발 label·disabled 계산·즉시 force HUD는 유지한다. 실제 폭발 전투 검증으로 UI query fixture를 세지 않는다.

최종 수정 조건의120 frame 비교:

| 상태 | Text node 교체 전→후 | 충전 표시 호출 전→후 | DOM 수 |
|---|---:|---:|---:|
|idle|420→0|145→120|251→251|
|pan|468→0|149→120|251→251|
|pause|588→0|159→120|266→266|

HUD 횟수는 실제 경과시간에 따라 달라지므로 raw call 감소를 FPS 개선으로 계산하지 않는다. 최종 charge88회·fire5회의 Text node 변화는 실제 표시 변화다. 이 DOM 수정만으로는 안정적인 전체 frame 개선을 입증하지 못했다.

### 일반 pause의 기존 canvas 재사용

대상은 pause-dialog, dt/effectDt=0, 미종료 일반 전장이다. dialogue/preview/training/custom map/editor/legacy painted provider/story frame·tween·frozen·goalFocus/timed focus·speaker가 있거나 authored far/font가 준비 중이거나 context가 lost이면 기존 매 frame 경로로 진행한다. 일부 이전 이미지 지형의 준비 상태까지 단정하지 않고 해당 provider는 보수적으로 제외했다.

재그리기 경계는 Engine/battle/modal 노드, Engine 이벤트, canvas origin/CSS·physical 크기·DPR/viewport, 카메라/clock, HUD top/미니맵 rect, 목표/hover/inspect, active/phase, scene/appearance/visual-style/debug revision, 선택/충전값, context lost/restored다. 두 번 일치하는 정상 paint 뒤 **같은 canvas**를 유지한다. 새 bitmap을 만들지 않으며 Scene 당 키 하나·context listener 한 쌍만 보유한다. 재개 시 즉시 기존 렌더로 복귀한다.

초기 prototype에서 landscape 회전 뒤 목표 화살표가 stale인 것을 픽셀 검사로 찾았다(844×233의690,106–838,158). 목표 draw가 HUD/미니맵 rect도 읽는데 키에 없었다. 이 불완전 경계는 폐기했고 해당 rect/목표 및 canvas origin을 포함했다. 최종 회전·DPR·origin 이동은 정상 강제 paint와 RGBA 정확 일치했다.

3회 동일 pause 비교, ms. 각240 frame, 자산84개 준비 완료/실제 시작 배너 종료:

| 회차 | frame p50/p95/max 전 | frame p50/p95/max 후 | rAF p50/p95/max 전 | rAF p50/p95/max 후 | longtask 개수/총ms 전→후 |
|---|---|---|---|---|---|
|1|9.3/23.6/41.0|0.2/1.3/14.6|33.3/50.1/66.7|16.7/33.4/66.7|2/114→0/0|
|2|10.8/25.5/45.5|0.2/1.4/13.4|33.4/50.1/83.4|16.7/49.9/100.0|4/257→0/0|
|3|9.1/23.5/432.8|0.2/2.2/107.4|50.0/100.0/516.6|16.7/66.6/283.3|6/854→1/123|

기본 pause의 frame p95 감소는 반복해서 확인했다. 최종 대표120 frame에서 Scene.render는120회 대신1회였고(첫 준비 paint 일부는 계측 진입 전), 남은 상태는 실제 불변 픽셀을 유지했다. 다만 rAF p95/최대 지연은 혼재하며 after에도107.4ms frame/123ms longtask가 남았다. 사용자 기기의60FPS 또는 전투 지속 렉 해결로 확대하지 않는다.

### 정상 동적 경로의 남은 비용

최종 owner 계측에서 idle Scene.render p50/p95=9.6/15.1ms, 그 안의 실루엣=7.3/12.0ms였다. background=0.1/0.2ms, static world cache=0.0/0.2ms다. charge에서는 궤적=6.1/15.5ms·실루엣=8.0/15.5ms, Scene.render=16.6/34.2ms였다. unit/pose/body는 실루엣 안에도 포함되므로 합산하지 않는다. 정상 동적 경로를 cache 재작성·중단·품질 저하로 바꾸지 않았다.

아래는 **호출 wrapper를 포함한** 대표 상태120 frame 결과이며 서로 다른 상태의 A/B 성능 판정이나 실제기기 FPS가 아니다. 반복 불변 DOM/모달·이미지의 소유권과 비용 분포를 확인하기 위한 표본이다.

| 상태 | frame p50/p95/max | rAF p95 | longtask 수 | Scene.render 수 | DOM 초기→말 | 타일 초기→말 |
|---|---|---:|---:|---:|---:|---:|
|idle|10.6/16.7/27.7|33.3|0|120|251→251|12→12|
|charge|18.8/37.8/43.2|50.0|5|120|251→251|12→12|
|fire|13.6/21.7/31.9|33.4|0|120|251→251|12→15|
|pan|11.3/20.8/31.7|49.9|2|120|251→251|12→12|
|pause|0.2/1.3/16.4|49.9|0|1|266→266|12→12|
|preview|2.3/5.5/18.1|50.1|0|—|997→997|—→—|
|rest|0.1/2.2/4.5|16.8|0|—|602→602|—→—|
|journey|0.0/0.3/0.6|16.8|0|—|119→119|—→—|
|journey-zoom|0.1/0.1/0.5|16.8|0|—|119→119|—→—|

모든 최종 상태는 icon cached84/failed0/active0/queued0를 유지했고 src/decode의 frame별 재설정은 없었다. 일반 전투48 unit의 시작/말과 FX/투사체·spark·heap·far cache·tile bytes는 raw JSON에 있다. 이 표본은 FX 최대치를 매 frame 기록한 검사가 아니며 독립 particle 배열은 없다(spark FX만 별도 수집, 날씨는 기존 procedural26 slot). 최종 전투 타일12→최대15(발사), 타일 메모리12,780,288→15,975,360B, 정지 view의 기존 두 screen slot은6,850,560B였다. 새 pause bitmap은0개다. 짧은 heap 변동은 강제 GC 없이 도구 배열까지 포함하므로 누수 판정에 사용하지 않는다.

journey zoom6회의 함수 p50/p95=1.6/2.2ms였다. labels의 sizing/scroll 소유권 중복은 코드와 호출로 확인했지만 현재 한 개 열린2막 pin 상태의 한정 표본이다. font/resize/선택·gallery 복귀 계약과 다른 작업 충돌을 고려해 해당 파일은 수정하지 않았다. minimap static/dynamic 분리도 비용 대비 invalidation 근거가 더 필요해 채택하지 않았다.

## 집중 검수와 별도 실제 픽셀 비교

1. **병목/중복 재현**: 동일값 text/title/style 쓰기,120 frame의 중복 charge 호출, 동일 pause canvas의 반복 전체 paint를 생산 실행에서 확인. 수정된 준비 조건으로 pause3회 A/B 완료. 정상 idle/charge/fire/pan의 큰 비용은 남음.
2. **기능/저장 보존**:120회 HUD 동안4개 skill button identity 유지. pause20회 개폐 후 DOM251, 유닛/투사체/지형/턴·성장/장착/완료/아이템 불변. 실제 persist→stopBattle→Continue의 해당 상태 복원. 폭발 label·이전 발사 tooltip은 통제된 presentation fixture로 확인. 실제 resume→충전→발사/flight와 event 피격·720ms focus 유지 확인.
3. **반복 안정/경계**: preview12회 개폐 후 DOM 일정 및 preview/request 해제. pause12회 전환에서 한 canvas/DOM 일정·타일≤24. 최초 paint/모달 교체/실제 회전3방향/DPR2(기존1.7 상한)/origin/scene revision/Engine hit/timed camera/legacy-provider·image-pending query/context restore 이벤트를 확인. 실제 legacy30장·GPU reset·네트워크 장애/물리기기 검사를 한 것으로 표현하지 않음.

별도 `render-paused-boundaries.py`는 retained canvas와 정상 강제 Scene.render를 같은 실제 상태에서 SHA-256/RGBA로 비교했다. 불변30frame·회전/DPR/origin·실제 flight pause에서 정확 일치했고 battle 전체 JSON이 그대로였다. 시간 기반 camera는 진행되고 battle 위 preview도20frame 동안 age가 증가하며, 그 동안 기본 전장도 기존 경로로 렌더했다. [경계 결과](evidence/paused/checks.json).

`render-update-boundaries.py`는 **픽셀에만** 고정 display clock/수동 view를 사용해 이전/최종 production 빌드의 실제 Chromium screenshot RGB7장을 비교했다. 성능 샘플에서는 이 고정을 하지 않는다. 시작 배너 DOM도 fixture 조건에서 명시적으로 닫았다. 결과:

| 화면 | 정확 일치 | 차이 pixel 수 | 최대 channel 차이 |
|---|---|---:|---:|
|desktop-idle|False|19|3/255|
|desktop-charge|False|18|3/255|
|desktop-pause|True|0|0/255|
|mobile-idle|True|0|0/255|
|mobile-mage|True|0|0/255|
|landscape-mage|True|0|0/255|
|mobile-preview|True|0|0/255|

최초 exact-only assertion은 소수 HUD AA edge 차이로 실패했고 차이 이미지/실제 화면을 따로 확인했다. 잔차를 정확 일치로 표기하지 않는다. 도구는 최대32pixel·3/255 경계를 명시적으로 검사한다. 지형/초상화/효과/해상도 변경은 없다. [픽셀·저장·개폐 결과](evidence/pixels/checks.json). 실제 최종 자연 상태 JPG는 [idle](evidence/final-states/accepted-count-idle.jpg), [pause](evidence/final-states/accepted-count-pause.jpg), [preview](evidence/final-states/accepted-count-preview.jpg), [rest](evidence/final-states/accepted-count-rest.jpg), [journey](evidence/final-states/accepted-count-journey.jpg). 모바일/landscape 고정 비교 JPG는 `evidence/pixels/`에 있다.

## 제외한 계측·한계·인계

- 처음 도구는 도입 직후 turnNotice 데이터만 지워 배너 DOM을 남겼다. 실제 최종 JPG 검토에서 발견해 **성능 결론에서 제외**했다. 현재 runner는 생산 Story.tick의 실제 배너 종료를 기다린다. 이전 raw는 `evidence/historical/`에 보존한다. 예전 after-count/frame 수치를 최종 accepted 수치와 섞지 않는다.
- 초기900ms 표본에는 전체84개 icon의 선제 idle warm/decode가 겹쳤다. 반복 이미지 재생성과 다른 일회성 작업이다. 첫 steady broad 시도는 전투 화면에서 warm 완료 대기가20초에 도달해 중단됐다(정확한 지연 원인은 해당 표본에서 미확정). 이를 게임 예외로 기록하지 않는다. 최종은 동일한 정상 camp에서 먼저 준비하고 cache84/queue0을 확인한다. 콜드 원본/대기 실패 로그도 보존했다. warmup 자체의 정책 변경은 하지 않았다.
- 음악 off·headless Chromium·합성 QA 진행의 한계가 있다. GPU/실기기/사용자 실저장 및 장시간 동일기기 증상은 검증하지 않았다. 큰 렌더 비용의 존재와 원래 점증 렉의 원인 입증은 구분한다. 원래11장 R1→R16 연속 표본은 별도 runtime 보고서에 있으며 그 결과도 점증 렉 미재현이다.
- 전30장 완주/무관한4개 기존 실패 수정은 하지 않았다. 최종 source syntax/build와 실제 분할 HTML 진입·입력/저장/경계/픽셀만 집중 확인했다. 기존 static-screen-cache의 과거 manifest 정규식 실패는 별도 runtime 문서의 기존 실패이며 여기서 수리하지 않았다.
- 순 런타임 변경은 `shared/runtime/main.js`, `combat-status.js`, `objectives.js` 세 파일이다. renderer/rest-journey/menu-ui/act-endings·stage source·초상화는 수정하지 않았다. generated HTML/web는 이 기준의 build 산출물이다. 부모는 최신 master의 다른 stage/art 변경을 보존해 통합 후 공통 build/Pages를 검증한다. 이 브랜치에서 master 병합/배포하지 않았다.
- **b8487309 settledHits 참조 정리는 이 아키텍처 브랜치에 포함하지 않았다.** 별도 `fix/battle-runtime-performance-20261022`에서 source-only 수정/실제 summon lifecycle 검사와 연속 전투 증거를 인계한다. 작고 조건부인 표시 참조 정리이며 원래 렉의 원인/FPS 개선으로 주장하지 않는다. 폐기한 raster 후보는 어느 순변경에도 없다.
- 권한 거부/우회/미확정 원격 쓰기 없음. 각 수정 단위를 commit/push했다. 최종 master/Pages는 부모 담당이다.
