# 신규 배치 방향·조준 일치 · 2026-10-22

**원인은 신규 배치의 facing-only override가 기본 월드 조준각을 미러하지 않은 것**이었다. `shared/map/units.js` 한 곳에서 신규 생성 기본값을 맞췄다. 리그/무기/궤적/발사·초상화·기존 empty-occlusion 최적화는 변경하지 않았다.

- 기준: `c5b51319ef887943726434d84db596f07254bbd3`. 브랜치: `fix/spawn-facing-aim-consistency-20261022`. 런타임/정상 공통 build: `f3ac0953724276bd7e76c38a21308d2a63dc5aaf`. 최종 브라우저 실행: `2378eeea8542f6b59fefd136f7eb37895949bf4d`, tracked tree clean.
- Chromium154.0.8037.57,720×1560/DPR1, touch 모사, 기존 level10 QA fixture/1–11장 prerequisite 공개 기록, RNG899412, 음악/효과음 off. 물리 모바일 기기·사용자 실제 저장의 실행은 아니다.

## 원인과 수정 범위

12장 저작 유닛은 새 생성 record로 `facing:-1`만 지정한다. `C.makeUnit`은 side0의 기본값 `facing:1, angle:44`를 생성한다. factory가 facing만 덮어써 `-1/44`가 되었고, 실제 발사/예측은 월드 angle44의 cos/sin을 사용해 오른쪽 위로 향했다. HUD `displayAngle`은 왼쪽일 때180-angle이므로136°였다. baseline 실제 브라우저에서 이 세 값이 그대로 재현됐다.

네 동행 리그의 원본 얼굴/무기 좌표는 +X 기준이고 renderer가 facing에 따라 한 번 미러한다. 원본 head pivot x240에 대해 nose 경로는 약x255–263이며, `createCanvasRenderer`의 facing1은 양의 X 배율이다. `HonroPoseVisual.aimTargets`도 같은 facing으로 월드 angle을 로컬 elevation으로 바꾼다. 원래 몸과 무기를 따로 뒤집는 규칙이나 trajectory의 좌우 반전 버그가 아니다. 이 코드들은 보존했다.

factory는 생성 직후 방향을 기억하고 record/stageOverrides 적용 후 **명시적 angle이 없는 facing 변경에만** 기존 pitch를180-angle로 미러한다. 명시적 angle-only record는 cos(angle)의 방향을 사용하고, angle/facing을 둘 다 명시한 record/runtimeTemplate/stageOverrides는 그 값을 그대로 보존한다. 새 save flag나 Continue migration은 없다.

| 신규 입장 | before facing/world angle/HUD | after |
|---|---|---|
|1장 설오|+1 /44 /44|동일, 오른쪽|
|12장 네 동행|−1 /44 /136|−1 /136 /44, 왼쪽|

12장의 저작된 왼쪽 배치와 왼쪽 진행 방향을 보존했다. 모든 캐릭터를 우측으로 강제하거나 스프라이트를 일괄 반전하지 않았다. **이미 저장된 명시적 불일치 −1/44도 추정해서 교정하지 않는다.** 해당 old save의 필드는 그대로 Continue하며, 새 진입/retry는 수정된 기본값을 받는다.

## 확인 결과

1. `node tests/spawn-facing-aim.mjs`: 신규1/12장 생성, 네 직업×좌우, explicit angle/pair/template/stageOverrides, NPC/적 기본 방향, Engine origin/velocity, 명시 old save 전체 JSON 보존. 수정 전 동일 검사는12장 p-archer의1≠−1로 실패했고 수정 후 통과했다.
2. `node tests/aim-readout.mjs`: 기존8개 mirrored HUD/adjust 계약 통과. `node tests/joystick-intent.mjs`: 기존120 cone/centre/restart·380 sector transition,5 mobile range,20° inclusive gate·방향 hysteresis·낙하/impulse 독립성 통과. 조작 코드는 변경하지 않았다.
3. 실제 production App 자연 rAF/키보드·신뢰된 CDP touch 입력:1/12장 새 진입, 선택 변경, 네 동행 좌우 실제 보행을 확인했다.1장 정상 roster는 설오1명이며, **나머지3명은 같은1장 지형에 production fresh factory로 배치한 명시적 시각/선택 fixture**다. 캠페인1장 roster를 늘리지 않았다.
4. 12장 네 동행 각각 위/아래 시작 조준 잠금→반대 방향전환→vertical 재진입.8개 trusted pointermove의 동일 이벤트 전후에서 angle이 정확히180−이전각, x/y/이동력이 동일했다. 다음 자연 frame에서 cone 밖의 이동은 허용되고 vertical 복귀 시 x축 입력0을 유지했다. 실제 동작을 freeze하지 않았다.
5. 실제 `beginCharge`→500ms→`releaseCharge` 양방향8회. 설오A01·담허M01·소단O01의6개 실제 탄이 Engine velocity/origin과 일치하고 predict 첫 point의 진행 부호도 일치했다. 휘겸S00의2회는 원래 meleeAction을 사용하며 가짜 투사체로 세지 않았다. 각 발사 전 체크포인트를 별도 보존하고 stopBattle의 정상 저장 이후 명시 fixture를 재설치해 production Continue로 재개했다.
6. 명시 legacy `facing:-1, angle:44`의 production persist→stopBattle→Continue에서 모든 unit의 direction pair가 동일했다. 실제 retry 뒤에는12장 신규 pair가 일치했다. 전체 battle JSON은 dt0 Scene.render 전후 동일했다.

원자료는 [browser.json](evidence/browser.json)(87개 상태/결과, 오류0), [native.json](evidence/native.json), 실행 로그와 source/build 해시 [PROVENANCE.json](evidence/PROVENANCE.json)에 있다. 최종 build 재실행도 통과했고 생성 파일 추가 변경은 없었다. HTML/web는 공통 빌더 결과이며 직접 수정하지 않았다.

## 실제 JPG

모두720×1560,각1MB 미만. 별도 이미지 생성이나 포즈 합성 없이 실제 브라우저 screenshot이다.

- 재현: [수정 전12장 충전](evidence/before-stage12-charge.jpg), [수정 후12장 첫 배치](evidence/after-stage12-entry.jpg).
- 설오: [왼쪽 충전](evidence/after-p-archer-charge-left.jpg), [오른쪽 충전](evidence/after-p-archer-charge-right.jpg).
- 담허: [왼쪽](evidence/after-p-mage-charge-left.jpg), [오른쪽](evidence/after-p-mage-charge-right.jpg).
- 휘겸: [왼쪽](evidence/after-p-knight-charge-left.jpg), [오른쪽](evidence/after-p-knight-charge-right.jpg).
- 소단: [왼쪽](evidence/after-p-occultist-charge-left.jpg), [오른쪽](evidence/after-p-occultist-charge-right.jpg).
- 1장 factory4명 fixture: [왼쪽](evidence/after-stage1-allfour-left.jpg), [오른쪽](evidence/after-stage1-allfour-right.jpg).

## 한계와 인계

초기 브라우저 도구의 Python keyword 인자 오류는 수정했다. 자연 rAF 두 시점 사이에도 조준각이 계속 바뀌어3° 제한 검사가 실패한 것은 동일 pointer 이벤트 전후 관찰로 바로잡았다. 또 stopBattle이 현재 전투를 정상 저장하므로 그 이전 checkpoint를 profile에 미리 놓기만 한 초기 shot reset은 실제 flight 저장으로 덮였다. 도구는 stopBattle 이후 별도 checkpoint를 재설치하도록 고쳤다. 이 준비 실패들을 제품 결함/통과로 섞지 않았고 historical 로그를 보존했다. 최종 clean 실행만 검수 근거로 사용한다.

적/NPC도 explicit facing-only 생성의 기본 angle을 함께 맞추며 explicit pair는 보존한다. 관련 rig/캐릭터 asset/portrait/renderer/Path2D/occlusion/cache/조작/Engine 소스가 기준과 byte-identical임을 PROVENANCE로 확인했다. 성능 검사·전 장 완주·NPC 대사/초상화 문제 검사는 이 수정 범위에서 반복하지 않았다. 실기기 검사는 하지 않았다.

단위별 commit/push를 수행했다. master/Pages는 변경하지 않았으며 부모의 최종 검토·단독 배포로 남긴다. 권한 거부·미확정 쓰기·기능 차단은 없다.

```sh
node tests/spawn-facing-aim.mjs
node tests/aim-readout.mjs
node tests/joystick-intent.mjs
npm run build
# 별도 c5b51319 worktree를 BUILD_ROOT로 baseline 관찰 가능
BUILD_ROOT=/workspace/honro-facing-baseline BASELINE=1 python tools/testing/spawn-facing-aim.py
python tools/testing/spawn-facing-aim.py
```

최종 원격 확인 중 master에 `9890006179e45c7b323941a1252a3003c298751f`의 이전13장 active-session 리소스2개 복원이 추가됐다. 이 master를 **작업 브랜치에만 merge**해 두 리소스를 보존했다. 공통 build 재실행 뒤 파일 hash가98900061과 같고, 검증한 runtime/manifest hash도 그대로임을 확인했다. 다른 작업을 덮어쓰거나 master/Pages에 push하지 않았다.
