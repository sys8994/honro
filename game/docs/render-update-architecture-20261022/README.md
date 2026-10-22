# 갱신 소유권 검토 · 2026-10-22

기준은 master `a091c6bd5e64eff748f5028fb6d0080faea3da87`이다. 별도 전투 누적 조사/폐기한 raster 실험은 `fix/battle-runtime-performance-20261022`의 보고서에 보존한다. 이 검토는 사용자 실제기기의 렉 재현을 주장하지 않는다. 11장 미술·장 데이터·전투 수치는 수정하지 않는다.

## 생산 실행의 소유권

| 경로 | 호출/변경 경계 | 현재 보존되는 작업과 확인할 중복 |
|---|---|---|
| App.frame → audio / story | 단일 App rAF, screen별 분기 | 오디오 설정 내부 변화 감지와 이야기 clock. debug ending/void/withdrawal 분기는 다음 rAF를 예약한 뒤 return한다. 복수 전투 루프로 합산하지 않는다. |
| frame → Engine.tick | 전투이며 모달/대화/이야기 pause/done이 아닐 때 | 120Hz accumulator, 최대32step, 실제 NPC planning budget4ms. 보간·AI·저장 주기를 임의로 줄이지 않는다. |
| frame → Scene.render | 전투 매 rAF. 모달/대화는 dt/effectDt=0 및 paused 전달 | 카메라·이야기 포즈·배경/정적 terrain·동적 물/유닛/FX/조준·겹침 실루엣. paused redraw를 통째로 생략하려면 resize/이야기/overlay invalidation이 필요하므로 이번 작은 수정으로 다루지 않는다. |
| Scene → 정적 캐시 | world key에 지형/시각 revision·해상도·view 등이 포함됨 | 기존 도메인 타일12/24(별도 opt-in20/48), 화면 raster 두 슬롯 각6Mpixel 제한과 view 안정화, authored far LRU3이 이미 있다. 과거 폐기 실험을 다시 적용하지 않는다. |
| frame → updateChargeDisplay | 매 rAF + updateHUD 안에서도 호출 | 충전 연속값은 매 프레임 필요. 같은 label/text/style/dataset의 반복 쓰기와 tooltip의 두 writer를 따로 확인한다. |
| frame → updateHUD | uiAge>.11초, 명령 직후 force 호출도 존재 | heroSig는 인물 칩만 보호. HP/기력/이동력/각도/바람/버튼/상호작용 값은 별도 소유권. HUD 전체를 같은 sig로 차단하면 안 된다. |
| HUD → skill / status / passive / interaction | 매 HUD 검사, 각 내부 signature | 스킬은 keyed DOM 유지·조건부 속성/텍스트 쓰기. 상태/패시브/상호작용에도 signature가 있다. 기존 innerHTML 문제로 재진단하지 않는다. |
| HUD → minimap | visible일 때 매 HUD | sizing→client尺寸 읽기→정적 지형+동적 유닛/목표/카메라. 비용/동적 요구를 나누어 확인한다. 캐시한다면 파괴지형·resize·전장 변경 invalidation이 필수다. |
| modal open / close | 입력 이벤트 때 innerHTML 생성/제거 | 정상 idle loop에서 shell을 재생성하지 않는다. close는 preview/request 소유권 취소·노드 제거. |
| frame → SkillPreview.tick | modal open + connected preview canvas | 격리된 실제 Engine/Scene·시연·카메라·관측값. 애니메이션을 멈추어 성능으로 계산하지 않는다. readout은 text diff가 이미 있다. |
| skill-images | body MutationObserver + IntersectionObserver | 최대84 decoded originals/동시4job, 동일 URL 상태 재사용. 불변 textContent 쓰기도 Text node 교체를 일으키므로 observer에 작업을 보낼 수 있다. cache 접근과 디코드를 분리 계측한다. |
| frame → rest motion | rest·connected·visible일 때, desktop24Hz/mobile20Hz | 동일 App rAF 공유, reduced motion 정책. 별도 무한 rAF가 아니다. 지도 camera는 pointer 소유. |
| journey layout | mount/restore/resize/zoom/scroll | layoutBook→layoutLabels, zoom 후 scroll 보정→layoutLabels, scroll event가 rAF를 예약. label 후보 충돌/선택 우선순위·font/resize/gallery 복귀를 보존해야 한다. idle에서는 매 프레임 layout하지 않는다. |
| 저장 | dirty일 때 마지막 저장 후1200ms, 종료/명령 별도 | syncRoster·battle clone·persist 포함. UI 표시 diff에서 게임 state를 쓰거나 저장 schema를 바꾸지 않는다. |

소스: `shared/runtime/main.js`, `renderer.js`, `combat-status.js`, `skill-images.js`, `skill-preview.js`, `rest-journey.js`, `authored-far-art.js`. 기존 초기 요청/37모듈 용도 감사는 `INTRO_LOADING_AUDIT.md`를 재사용했으며 다시 조사하지 않았다.

## 계측 방법

`python tools/testing/render-update-architecture.py`가 실제 분할 production HONRO.html을 실행한다. 고정 RNG899411, Chromium headless,1280×800/DPR1, 음악/효과음 off. 기초 level10 QA roster에 이전1–10장 개방 기록을 주고 **현행11장 새 진입**을 사용한다. 사용자 저장·실제기기/난이도 승인 표본이 아니다. 최종 authored far ready 뒤900ms warmup. idle/charge/fire/pan/pause/preview/rest/journey/zoom을 각각 새 context에서 본다. 각120개의 자연 rAF 동안 생산 App.frame이 그대로 실행된다. 샘플러의 대기 rAF는 별도이며 생산 예약 수와 합산하지 않는다.

`MODE=count`는 함수 owner stack, inclusive 호출 시간, DOM/text/style/이미지/레이아웃/canvas 및 rAF/listener 호출을 계측한다. 같은 값 쓰기와 MutationObserver의 실제 노드 변경도 구분한다. `MODE=measure`는 함수/DOM wrapper 없이 App.frame 경과시간, rAF, longtask와 DOM mutation만 기록한다. DOM observer 자체의 비용이 있으므로 이 역시 사용자 FPS 측정과 다르다. frame 안에 Scene/HUD/Preview 비용이 포함되고 HUD 안에 status/skill 등이 포함되어 **합산하지 않는다**. 대표 상태의 비용 비교용이며 전30장 감사나 장시간 누적 재현을 대체하지 않는다.

결과와 채택/폐기 경계는 계측 완료 후 이 문서 아래에 기록한다.

## 채택 1 · 표시값별 DOM diff와 tooltip 단일 소유권

`main.js`의 text/style 표시값 비교, 충전 dataset 비교, HUD가 실행되는 프레임의 중복 충전 호출 제거를 적용했다. 즉시 명령의 updateHUD 호출과 연속 충전값 갱신은 유지한다. `combat-status.js`가 발사 tooltip의 이전 발사값/disabled 이유를 함께 소유한다. 인물 칩과 목표 텍스트도 실제 변화 때만 쓴다. HUD 전체를 하나의 signature로 차단하지 않는다. 미니맵은 static 캐시를 추가하지 않았으며, 같은 sizing 값 쓰기와 중복 rect 읽기 하나만 제거했다.

120개 생산 frame의 계측 결과(호스트 부하에 따라 경과시간/HUD 횟수는 다르므로 같은 값 쓰기 감소와 프레임 개선을 혼동하지 않는다):

| 상태 | Text node 교체 전→후 | 충전 함수 호출 전→후 | DOM 수 전/후 |
|---|---:|---:|---:|
| idle |396→0|143→120|251 고정|
| 충전 |468→90|149→120|251 고정|
| 발사 |449→7|147→120|251 고정|
| 카메라 이동 |432→0|146→120|251 고정|
| 기본 pause |564→0|157→120|266 고정|
| preview/rest/journey/zoom |0→0|해당 없음|각997/602/119/119 고정|

idle 이전 충전 표시의 style.setProperty429회·textContent143회·title143회가 모두 같은 값이었다. 이후 같은 경로의 쓰기는0회다. 충전의90회는 실제 퍼센트/조준 표시 변화이며 연속 게이지는 유지한다. 기존 스킬 이미지·모달·여정첩 idle에는 재생성/재디코드가 관측되지 않았다.

별도 픽셀/경계 검사: UI 갱신120회 동안 기존4개 스킬 button identity 유지. pause20회 개폐 뒤 DOM251 유지, 전투 유닛/투사체/지형/턴·성장/장착/완료/아이템 불변. 실제 persist→stopBattle→Continue가 같은 상태 복원. preview12회 개폐 뒤 노드 수 일정 및 preview/request 참조 해제. 폭발 label은 별도 presentation query 경계 fixture로 확인했으며 실제 폭발 전투 재현으로 표현하지 않는다. 이전 발사67% fixture는 기존 tooltip이 HUD 뒤 일반 안내→charge 호출 뒤67%로 바뀌었고, 수정 후 두 지점 모두67%로 유지됐다.

실제 Chromium screenshot RGB 비교7장 중 pause/mobile idle/mobile mage/landscape mage/mobile preview5장 정확 일치. desktop idle19픽셀, desktop charge5픽셀에만 최대3/255 차이가 있었다(각1,024,000픽셀). 원본 엄격 exact assertion은 이 두 장에서 실패했고, 차이 이미지와 실제 최종 화면을 따로 검사했다. 이 두 장을 정확 일치로 기록하지 않는다. AA 가장자리 잔차로 제한된 검사 기준은32pixel·3/255이며 그래픽/해상도 변경은 없다. [전체 경계 결과](evidence/pixel-checks.json), [desktop](evidence/final-desktop-idle.jpg), [mobile preview](evidence/final-mobile-preview.jpg).

현재까지 이 변경으로 체감 FPS가 개선됐다는 결론은 없다. 큰 비용인 Scene.render의 정지 상태 재그리기는 다음 별도 경계로 검토한다.

## 채택 2 · 기본 일시정지 전장의 명시적 재사용 경계

함수별90프레임 idle 계측에서 Scene.render p50/p95=10.9/15.8ms, 그 안의 occludedUnitSilhouettes=8.0/11.2ms였다. background=0.1/0.3ms, 기존 static-world cache=0.1/0.4ms다. unitBody는 unit 및 silhouette 안에 중첩되어 합산할 수 없다. 이는 현재 보이는 소수 유닛도 겹침 mask 합성에 비용을 지불하는 사례이며, 정상 유닛/물/카메라/궤적 애니메이션을 제거할 근거는 아니다. 정적 지형 raster를 새로 바꾸는 대신 이미 정지한 **기본 pause-dialog**의 동일 전체 전장을 다시 그리는 중복을 제거했다.

`App.renderBattleFrame`이 소유한다. 기본 pause-dialog가 열려 있고 dt/effectDt=0이며, 전투가 종료되지 않고 대사/미리보기/훈련/사용자 맵/editor/이야기 frame·tween·focus·goalFocus가 없으며, authored far와 폰트가 준비되고 context가 정상인 경우만 대상이다. 그 외에는 기존 Scene.render로 바로 진행하고 보유 키를 지운다. normal battle idle은 여전히 매 rAF 렌더한다.

다시 그리는 조건은 Engine/battle/modal 노드 교체, Engine 이벤트, canvas CSS/물리 크기·DPR/viewport, 카메라/표시 clock, HUD top/미니맵 rect, missionTargets, hover/inspect, scene/appearance/visual-style/debug revision, 선택/충전값 및 context lost/restored다. 이미지가 준비 중이거나 폰트가 loading이면 매 프레임 기존 경로로 그린다. 두 번 일치하는 정상 paint로 raster/피격 표시를 준비한 후 같은 canvas를 유지한다. 새 bitmap/canvas cache를 만들지 않으며 Scene 당 키 하나·context listener 한 쌍만 보유한다. 모달 종료 후 정상 frame에서 즉시 제거한다.

초기 prototype의 크기/카메라 키만으로는 landscape resize 뒤 목표 화살표 위치가 늦게 갱신됐다(캔버스844×233의690,106–838,158 영역). 목표 draw가 HUD/미니맵 배치도 읽기 때문이다. 이 불완전 경계를 폐기하고 해당 rect/목표 의존성을 포함했다. 최종 실제 resize3방향 및 DPR-only 변경에서는 정상 강제 재그리기와 **RGBA 정확 일치**했다.

분리된 경계 검사는 유지 canvas와 정상 Scene.render의 SHA-256 정확 일치·전투 전체 JSON 불변, desktop/portrait/landscape 회전, DPR2(기존1.7 해상도 상한), 카메라·scene revision·context restore 이벤트, 실제 Engine.hurt 이벤트의 pause 피격 정리와720ms focus 보존, 준비 중 이미지 query fixture, 시간 기반 카메라 API, battle 위 실제 preview의20프레임 애니메이션, 정상 resume/충전/발사, 실제 flight 중 pause의 FX 픽셀과 상태,12회 pause 전환의 단일 canvas/DOM/타일 상한을 확인한다. 준비 query/context 이벤트 fixture는 물리적인 네트워크 실패/GPU 재설정 검사와 구분한다.

최종 계측 수치는 아래에 추가한다. 일반 전투 idle의 큰 silhouette 비용 및 사용자 점증 렉은 이 수정으로 해결했다고 주장하지 않는다.
