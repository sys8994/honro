# 실루엣 합성 비용 · 2026-10-22

정상 idle의 느슨한 covers 후보가 실제로는 빈 마스크인 낭비를 확인해, **현재 자세의 보수적 경계로 빈 교집합만 합성 생략하는 후보를 채택**했다. 실제 RGBA/pose 보존과 wrapper 없는3회 A/B의 모든 idle·최대충전·pan p95 개선을 확인했다. 원래 점증 렉 전체의 원인 입증은 아니다.

기반은 architecture546f와 settledHits 정리를 포함한 `1c397248f42f365593be3a154c06d6d1ee5b2ac5`다. master/Pages를 변경하지 않는 별도 `fix/occlusion-render-cost-20261022` 브랜치다.

## 초기 분리 결과

Chromium headless,1280×800/DPR1, seed899411, 기존 QA level10 fixture. camp에서84 icon cached/active0/queued0/failed0 확인 뒤 현행11장 새 진입, 도입 대화 종료, 생산 App/Story의 정상 시작 배너 종료,900ms warmup, 자연 App rAF120frame. Stage11 미술·유닛 배치·게임플레이를 변경하지 않았다. 물리 기기 검사는 아니다.

`baseline-phase.json`은 renderer 메서드의 진단용 소스 복사에 시계만 삽입한 별도 실행이다. Canvas 명령 제출 및 그 시점에 발생하는 지연 작업의 elapsed이며 GPU pass/순수 CPU 분해가 아니다. production 소스나 빌드에 진단 훅은 없다.120frame의 총 silhouette608.7ms 안에서 setup/clear2.5, body redraw39.1, cover redraw26.4, color1.1,8방향 확대58.2, edge subtract0.2, edge intersect29.7, body intersect0.3, 최종2복사447.0ms다. 실루엣과 그 내부 단계를 다시 합산하지 않는다.

`baseline-alpha.json`은 **별도 readback 진단 실행**이다.120개 후보 모두 body/edge 최종 alpha가0이었다. 활성 설오(x720)와 뒤 순서 소단(x615)의 느슨한 covers 조건이 통과하지만 실제 몸·윤곽은 겹치지 않았다. 양의 alpha를 가진 화면 밖 후보는 이 idle 표본에 없었다. 이 파일의 `total`은 강제 readback/JS scan이 섞인 진단 elapsed이며 성능 근거로 사용하지 않는다. 빈 마스크 진단은 그 상태에서만 성립하며 임의 자세·충전에도 계속 빈 것으로 추정하지 않는다.

재현: `BUILD_ROOT=/workspace/honro-occlusion-baseline MODE=phase RUN=baseline-phase FRAMES=120 python tools/testing/occlusion-render-cost.py`, 별도 `BUILD_ROOT=/workspace/honro-occlusion-baseline MODE=alpha RUN=baseline-alpha FRAMES=120 JPG=1 python tools/testing/occlusion-render-cost.py`. source/build/도구 해시는 JSON에 있다. 원자료 및 자연 상태 JPG(<1MB)는 evidence에 보존했다. 두 최초 도구 준비 실패(브라우저 메서드 문자열의 따옴표 차이, 기본 npm cache 경로 부재)는 production 실패가 아니며, 각각 원본 source 기반 주입 및 `/tmp` npm cache 지정으로 해결했다.

## 단일 후보와 품질 경계

현재 후보는 기존 body/cover를 동일384×384·동일rs·동일 위치에서 그대로 재드로잉한다. 이 draw가 실제 사용하는 리그 행렬·경로의 control hull을 stroke/AA 여유와 함께 얻고,8방향 팽창 반경+필터 여유를 더해도 cover hull과 교집합이 없을 때만 이후 color/팽창/교집합/복사를 생략한다. 드로잉 전에 자세를 추정하거나 고정하지 않고 pose state 갱신과 `_occludedUnitIds`도 보존한다. 새 unit bitmap/cache, frame skip, lower LOD/해상도, 예측 궤적 변경은 없다.

경계 수집은 occlusion의 private context 요청이 있을 때만 작동한다. 정적 경로 hull은 기존 리그 renderer별로1회 파싱한다. 현재 absolute M/L/Q/C/Z의 모든 제어점 convex hull만 지원하며 arc/relative/알 수 없는 경로·debug는 null을 반환해 기존 전체 합성을 유지한다. 실제 현재 flex bow·활줄/화살·휘는 부적은 현재 생성 경로를 포함한다. 몬스터/보스/다른 body renderer 역시 경계를 제공하지 않으므로 전체 합성을 유지한다. 경계 정보는 해당 draw 중에만 존재한다.

초기 checker의15개 실제 Scene 사례×6frame에서 RGBA 정확 일치, pose state/후보ID/전투 JSON 일치였다. 정상 idle·charge는78→0회, 실제 겹침·충전 활/지팡이/검/부적·천·outline여백·큰boss·날개·viewport edge·portrait/DPR2·landscape는78→78회였다. Preview는 기존처럼0→0회다.4동행×2facing×5동작의40 mask에서도 hull 밖의 alpha가0이었다. 이 checker는 별도 readback/고정 render fixture이며 성능 근거가 아니다. 최종 clean SHA의 결과와3회 A/B는 다음 기록에 남긴다.

일반 build가 갱신한 party/actor runtime은 source SHA stamp만 바뀌었고 실제 asset JSON은 동일하다. HTML/web는 전체 공통 빌더 산출물이며 직접 수정하지 않았다. master·Pages·11장 미술 source·main/UI·정적 지형 캐시·엔진·밸런스는 변경하지 않는다.

## Wrapper 없는3회 A/B · 채택

- before: `1c397248f42f365593be3a154c06d6d1ee5b2ac5`, after runtime/build: `2d92eca682514241ef1dbadcbc69c5d63af2abd9`. 모든 accepted run의 tracked tree가 clean이었다. 최종 manifest `36647770088653b0b2f5f32d8d8cb3259a9a31fee04db8f8bcd73c5ee34459c1`.
- 초기와 같은 Chromium154.0.8037.57/headless/software,1280×800/DPR1, seed899411, QA roster/11장/정상 배너 종료/84 icon warm/900ms. 각 상태 새 context, 음악·효과음 off. 실기기 검사는 하지 않았다.
- A1→B1→A2→B2→A3→B3 순서로 단독 실행했다. 각 idle·charge·pan은 자연 App rAF240 callback이다. charge는 실제 `beginCharge()` 뒤5200ms를 기다려 **생산 충전 power1**에서 측정했다. pan은 동일한 per-frame sine 입력을 사용했다. 시간/포즈 고정이나 직접 tick은 없다.
- `MODE=measure`는 CDP `devtools.timeline` trace의 `FireAnimationFrame` elapsed다. 내부 `FunctionCall`의 production runtime URL로 App callback을 식별하고 eval sampler callback은 제외한다. 모든 표본은 App240개/eval240개로 구분됐다. production App/Scene/Canvas 함수 wrapper와 readback은 **0**이다. rAF timestamp sampler·longtask observer·타임라인 기록의 공통 관찰 오버헤드는 남는다. 순수 GPU/CPU instruction time이나 이전 wrapper 분해치와의 직접 비교는 아니다.

ms, App callback p50/p95/max. rAF p95는 모든 run에서16.7–16.8ms다.

| 상태 | 회차 | before p50/p95/max | after p50/p95/max | p95 감소 |
|---|---:|---:|---:|---:|
|idle|1|7.84/10.70/27.30|4.37/6.93/14.76|35.2%|
|idle|2|7.70/9.64/15.37|4.10/5.79/13.11|40.0%|
|idle|3|8.11/13.83/29.21|3.53/5.03/12.98|63.6%|
|charge|1|8.69/12.04/16.81|4.27/6.08/28.77|49.5%|
|charge|2|8.56/11.58/21.40|4.61/6.25/8.86|46.0%|
|charge|3|8.54/10.88/13.02|4.05/5.08/6.53|53.3%|
|pan|1|7.96/9.84/13.21|3.71/4.76/6.33|51.6%|
|pan|2|7.99/10.09/13.26|4.12/5.68/14.75|43.7%|
|pan|3|7.83/9.63/17.60|3.92/4.94/11.19|48.7%|

모든9개 짝에서 p50/p95가 감소했다. 최댓값까지 항상 개선된 것은 아니다. 첫 charge의 App max16.81→28.77ms, 둘째 pan의 rAF max33.4→50.0ms 악화도 원자료에 그대로 남겼다. longtask는 전체 before 중pan1의65ms1개, after는0개이나 짧은 표본의 우연성을 배제하지 않는다. FPS·모든 겹침 장면의 성능·장시간 누적/GC·원래 점증 렉 해결로 확대하지 않는다. 실제로 겹치거나 경계를 모르는 경우는 원래 합성에 경계 수집 비용이 더해질 수 있고, 이 경우의 성능 향상은 주장하지 않는다.

raw App/rAF samples와 전체 압축 CDP trace18개, 실행 순서/로그/요약 및 세 번째 자연 상태 JPG6장은 [evidence/ab](evidence/ab/)에 있다. JPG는 모두1MB 미만이다. trace 파일 SHA는 각 run JSON, 모든 증거 파일 SHA는 최종 EVIDENCE_SHA256.json을 따른다. source SHA·renderer/rig/adapter/HTML/manifest/profile/도구 해시도 각 run에 있다.30frame 도구 교정은 판정에서 제외하고 accepted3쌍만 사용했다.

```sh
# 각 i=1,2,3에 대해 before→after 순서로 단독 실행
BUILD_ROOT=/workspace/honro-occlusion-baseline MODE=measure RUN=accepted-before-1 STATES=idle,charge,pan FRAMES=240 python tools/testing/occlusion-render-cost.py
MODE=measure RUN=accepted-after-1 STATES=idle,charge,pan FRAMES=240 python tools/testing/occlusion-render-cost.py
BASE_ROOT=/workspace/honro-occlusion-baseline python tools/testing/occlusion-boundaries.py
```

최종 source의 공통 build를 다시 실행했고 생성 파일은 더 변경되지 않았다. 최종 픽셀 checker에는 완전히 올린 충전과 해제의 draw 구간까지 포함했다. 기존 통합·전 장 검사는 반복하지 않는다. 최종 master/Pages 반영은 부모 검토 이후 별도 담당이며 이 브랜치에서는 수행하지 않는다.

## 최종 품질 증거와 인계

clean 실행 `03119da093abb686e68eac75ca66ca52a52473f9`(runtime/build는2d92eca6 그대로)에서 최종 checker를 실행했다. **16사례·192frame 모두 RGBA 정확 일치**, pose state/후보ID/전투 JSON도 일치했다. 완전 충전은 실제 renderer의 시간/pose 갱신으로18frame을 진행했고, 활 해제는14번째 frame에서 기존 anim 상승/충전 해제 입력 상태를 주어 전환을 대조했다. 이는 별도 scripted render fixture이며 정상 사용자 발사/전투 완주 검사는 아니다. 이 검사는 최종 production Scene 전체를 사용하되 before측 occlusion 메서드만1c397248 원본으로 대체한다.

| 최종 경계 | frame | before→after mask drawImage | 결과 |
|---|---:|---:|---|
|정상 idle|6|78→0|RGBA·pose·state 정확 일치|
|정상 충전 상승→완전충전|18|234→0|동일|
|실제 겹침, 움직임/공중/피격, 최소줌/윤곽, 화면 가장자리, 큰boss/날개|각6|78→78|동일|
|반대방향 활/충전 해제, 지팡이 hover/inspect, 검/천, 부적, portrait DPR2, landscape|각18|234→234|동일|
|미리보기 경계|6|0→0|동일|

4동행×2facing×idle/move/full-charge/airborne/hit의40 mask에서 실제 alpha가 경계를 벗어난 pixel은0이었다. arc 명령을 가진 미래 경로는 unknown을 반환하는 fallback도 확인했다. 무기·의복·팽창 여유를 줄여 빈 영역으로 둔갑시키지 않았다. body/cover 재드로잉은 그대로 유지하므로 기존 동적 pose state의 중복 draw 부작용도 바꾸지 않는다.

[pixels/checks.json](evidence/pixels/checks.json)에 매 frame 비교 결과의 집계와 최종 원본/후보 RGBA hash가 있다. 각 최종 PNG는 실제 RGBA 원자료이며 디코딩 hash가 해당 두 hash와 일치함을 확인했다. 같은 이름의 JPG는 보기용(모두1MB 미만)이다. 정상 자연 App 화면은 [idle](evidence/ab/accepted-after-3-idle.jpg), [최대충전](evidence/ab/accepted-after-3-charge.jpg), [pan](evidence/ab/accepted-after-3-pan.jpg); 겹침/가림 표본은 [큰 보스](evidence/pixels/large-boss-fallback.jpg), [부적](evidence/pixels/charge-talisman.jpg), [활 해제](evidence/pixels/charge-release-bow.jpg)다.

최종 build 재실행은 [final-build.txt](evidence/final-build.txt)에 보존했고 산출물 추가 변경이 없었다. source syntax3개·diff whitespace·실제 production HTML 진입/자연 입력 및 위 집중 검사만 수행했다. 보호 범위(main/camera/11장 미술/캠페인/밸런스)와 party/actor 실제 미술 JSON의 불변은 [PROVENANCE.json](evidence/PROVENANCE.json)으로 확인했다. 전체 통합/전 장 검사는 중복 실행하지 않았다.

공통 범위에서만 읽는 경계 metadata가 추가됐으며 해상도·샘플 격자·동적 자세·기존3개384 canvas는 유지한다. 표본 밖의 모든 장/캐릭터/기기에서 성능이 개선된다는 주장은 하지 않는다. 실기기, GPU별 병목 분해, 장시간 누수/점증 렉은 미검사·미해결이다. 한 후보의 채택으로 종료했으며 다른 궤적/캐시/renderer 개편을 함께 넣지 않았다.

변경 단위별 commit/push를 수행했다. 확인한 원격 master/integration은1c397248였고 이 작업은 쓰지 않았다. master/Pages 반영과 실제 배포 화면 검토는 **부모의 최종 검토 이후 작업**으로 남긴다. 권한 거부·미확정 원격 쓰기·기능 차단은 없다.
