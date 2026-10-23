# 검증·인계 (2026-10-23)

기준 공개 master: `9f7a62739c6c7682850d5991792290de64329fb7`.

- 편차 구현: `3ce245c3` (feat: add deterministic buffered action damage variance).
- 오사격 구현: `ae31f3a01c43147a5846944e4dd6404ed2446853` (fix: reduce coalition friendly fire to thirty percent once).
- 후속 검수에서 구 완료/실패 전투는 난수 필드도 추가하지 않게 보완했다. 역사적 host/nightParade 소환 생성에도 부모의 편차·진영을 명시적으로 전했다. 별도 최종 검증/빌드 커밋에 포함한다.
- 브랜치 `feat/combat-damage-variance`. master 통합·새 Pages 배포는 부모 담당이다. 이 후보를 발행 성공으로 등록하지 않았다.

## 통과 범위

|검사|확인|
|---|---|
|`npm --prefix game run typecheck`|전체 TS 엔진 타입|
|`npm run build`|Game/Workshop/직접 Playtest, 354개 현재 활성 파일|
|`node tests/combat-damage-variance.mjs`|64개 실제 Engine 발사/분류 누락0, 분포24576표본, 독립 RNG, 청크 교체·JSON 재현, preview/predict 비소모, volley/AoE 배열 역순, 반사/분열/진목/zone/DOT/지박/소환/섭혼/S13 후속, 구 비행 미재산정, 역사적 DOT/host 상속|
|`node tests/coalition-damage-reduction.mjs`|72조합의 HP+shield=기존 최종값×.3, 최소1→.3, 치명/방어, 동맹 정의, 적/환경/자원 비용 제외, 자동탄 면제, 섭혼 전후/발사자 제거, 지연/통/밀침 단일 적용, 보고서0.3표시|
|`node tests/combat-damage-continue.mjs`|실제 App의 A04/M11/M13/O10/O12/S07 Continue/반복 export/import, 행동/자원/계수/index 보존, 각180 tick 동일 결과|
|`node tests/projectile-friendly-fire.mjs`|실제 근원탄/형기혼/검기/목표 보호 정책과 mounted App 양방향 오사격|
|`node tests/autonomous-friendly-fire.mjs`|기존 자동탄 무피해·상태/지형 면제, 적 공격 정상 피해, 삼각/반사/연타/반향/소환/chain·legacy 계약|
|`node tests/autonomous-friendly-fire-save.mjs`|6종 실제 App 소환/연타/공전 및 A03 새/구 저장 Continue|
|`node tests/stage-clear-report-data.mjs`|실제 HP/보호막 간격·DOT/소환/먹귀·분혼·처형/비치사·보상/보고서 불변|
|`node tests/splitting-reflection.mjs`|SP1–8 반사/분열·저장·예상선·안전·30/60/120FPS|
|`node tests/player-turn-order.mjs`|신규/행동/다음 라운드/사망·기절/수동선택/구 Continue/import/debug|
|`node tests/returning-wraith-fall.mjs`|O05 긴 낙하/예상선/3저장 단계/후속/시연1·8|
|`node tests/stage18-short-contracts.mjs`|18장 신규 계약·구 실제5스냅샷과 반복 Continue; 완료 저장 전체 동일|
|`node tests/reinforcement-camera.mjs`|기존 증원 ID·복귀/사망/연속/수동취소·대사·Continue 계약|
|`node tests/web-split.mjs`|활성 파일 해시/바이트·canonical30장/856에셋 일치, Game/embedded title·저장 보호·Workshop 직접 iframe|
|`python tests/combat-damage-browser.py`|최종 생성물 실제 Chromium: mounted Engine발사→localStorage 저장→reload/Continue의 미완료 계수/index/행동/기력/성장·장착·완료 보존, 아군 보호막+HP/보고서30%, 평균/±표시·스킬SVG폴백 없음, Workshop 기본 진입, pageerror0|

각 편차8192표본 결과:

|범위|평균|최소|최대|
|---|---|---|---|
|±5%|1.0|0.9500076144|1.0499923856|
|±10%|1.0|0.9000152288|1.0999847712|
|±15%|1.0|0.8500228433|1.1499771567|

수치는 계수 분포다. 기존 정수 반올림·최소 피해·처형 등 비선형 전투 규칙은 유지하며 최종 HP 손실의 무조건 동일 평균을 주장하지 않는다.

## 관측된 기존 검사 실패와 한계

`tests/splitting-reflection-app-resume.mjs`는 보고서가 없는 fixture에 Continue가 `honroReportSource={kind:'unresolved',...}`를 추가하면서 투사체 전체 일치 assertion에서 실패한다. 9f7a6273의 변경 전 core를 재구성하고 동일 App harness에서 같은 차이를 재현했다. 이번 편차 차이 또는 재추첨이 아니다. 해당 검사를 임의 수정하지 않았으며, 보고서를 정상 초기화하는 신규6종 실제 App 저장/반사 검사는 통과했다.

전체 verify·30장 완주·모든 실제 기예 효과의 전수 브라우저 시연·물리 기기/터치·새 카메라 작업은 실행하지 않았다. Chromium은 아군 표적을 명시적으로 추가한 전투 fixture이며 정상 장 완주 증거가 아니다. 초기 O12 Continue fixture는 허공에 둔 소환체를 기존 mount 보정이 접지시켜 물리 경로가 달라져, 실제 지면 위치의 적법한 fixture로 수정했다. 소환 위치 보정 자체는 변경하지 않았다.

검사 원본/24576표본 요약/Chromium PNG: `_local/reports/combat-damage/`, App 검사는 `_local/reports/combat-damage-continue/`. baseline mismatch 로그는 `combat-damage/baseline-splitting-reflection-app-resume.log`.

## 부모 병렬 작업과 정확한 접점

`shared/engine/src/engine.ts`:

- constructor: 진행 중 전투에서 독립 버퍼를 준비하며 터미널 구 저장 제외.
- `fire()`: 기존 `b.shot++`, cast 집계/shot ledger 초기화 뒤 1회 계수 생성. S13에서 넘긴 검술은 저장 계수 사용. 바로 뒤 근원탄 make에 `damageRoll`, `attackSide`를 저장. 기존 shot ID·입력·발사 성공/실패/기력/행동·이벤트 카메라 hook은 보존했다.
- `allegiance()/attackSide()/protectedAutomaticAttack()`: 현재 동맹/발사 진영의 구분과 기존 자동 보호.
- `hurt()`: 편차는 원 피해 층, 30%는 최종 정수 피해 뒤 보호막 앞. report/HP receipts는 실제값.
- `createZone`, curse/earth/trap, summon/capture/bolt, barrel/linked terrain: 계수/진영 상속.

추가 접점은 `warriorMechanics.ts`(연타/응수/S13/견인 후속), `beastMelee.ts`, `skillMechanics.ts`(분열/진목/이미 감산된 shove), `combatPassives.ts`(실제 살흔 상한), `enemyAI.ts`(평균 예상 오사값), `world.ts`, `types.ts`, `store.ts`, `progression.ts`, `game/engine/build.mjs`다.

runtime 변경은 `allies.js` 직접 NPC 공격, `split-campaign.js` 상태 전달, `act2.js`/`act3-objectives.js` 지형 wrapper의 attack 인자 전달, `clear-report-ui.js` 소수표시, `combat-status.js` 지속 피해 기본값 설명이다. `main.js`, `camera.js`, `reinforcement-camera.js`, `icons.ts`, `skill-images.js`, `skill-icons.css`, `story.js`, `presentation.css`, 캠페인/14장 지형은 변경하지 않았다. 카메라 후속과 병합 시 `Engine.fire()` 인접 줄만 확인하면 된다.

부모가 전달한 성공 발행 9f7a6273/Pages39886957929/2026-10-23T02:00:19Z를 성공 그래프 보존 정책에 등록했다. 해당354파일의 바이트·SHA256 전부 재검증했고 `web/entries/game.795c4f3ba61a14b1.js`를 보존한다. 기존5987/c8/d196 성공 그래프도 유지한다. 새 빌드가 삭제한 것은 보존 대상이 아닌 중간 빌드 파일이며 성공 그래프 파일은 아니다.
