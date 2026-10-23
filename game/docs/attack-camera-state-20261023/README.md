# 전투 카메라 상태 조사 — 2026-10-23

후속 승인 구현과 수정 전후 결과는 [공격 경계 수정 기록](../attack-camera-fix-20261023/README.md)에 있다. 아래는9f 시점의 원인·당시 미구현 제안을 보존한 조사 기록이다.

**결론: 자동 추적 자체는 있지만, 수동 해제와 복귀가 공격 시작에 묶여 있지 않아 사용자 기준과 다른 동작이 재현된다.** 기준은 `9f7a62739c6c7682850d5991792290de64329fb7`, 실제 사용한 기존 entry는 `game.795c4f3ba61a14b1.js`다. 이번 변경은 진단 스크립트·보고서·측정·캡처뿐이며 gameplay/카메라/엔진/빌드/자산은 수정하지 않았다. 새 빌드·master 병합·Pages 배포도 하지 않았다.

사용자 기준은 **직접 카메라를 조작할 때는 수동을 존중하고, 다음 실제 공격 시작에서 다시 공격자/대상/투사체 자동 연출로 복귀**하는 것이다. 아래 최소 수정안은 다음 단계 제안이며 아직 구현하지 않았다.

## 바로 확인된 원인

1. **플레이어의 수동 해제는 이미 있다.** `main.js:692–698`의 `releaseCharge()`가 `engine.fire()` 뒤에 `scene.manual=false`를 설정한다. 따라서 “발사에서 수동 해제를 전혀 하지 않는다”는 설명은 틀리다. 하지만 공격 성공 여부와 무관하게 이 flag만 바꾸며 다른 소유권·유예는 해제하지 않는다.
2. **d196 증원 카메라의 1,900ms 억제가 일반 전투에도 적용된다.** `reinforcement-camera.js:17`의 `cancel()`은 실제 증원이 없어도 모든 drag/zoom/minimap에서 `manualUntil=now+1900`을 만든다. 같은 파일34행에서 renderer 전체 카메라 갱신을 차단한다. 플레이어의 다음 정상 발사가 manual=false로 바뀌어도 유예는 남는다. 실제 증원이 전혀 없는 일반 발사와 실제 S00 명중에서도 PC/모바일 모두 화면이 고정됐다. 기존 증원 패치의 이 부분은 보완이 필요하다.
3. **유예 만료는 manual=true를 해제하지 않는다.** 1,900ms 뒤에는 module의 차단만 풀리고 `manual`은 그대로다. 현재 공격 도중 조작 후에는 별도 이벤트가 오기 전까지 manual이 계속 유지된다. 다음 플레이어 발사는 다시 해제하지만, AI의 같은 팀 내 다음 공격과 소환귀 공격은 공통 해제 경로가 없어 manual이 남았다.
4. **오래된 복귀 snapshot이 새 공격을 덮는다.** `reinforcement-camera.js:38/51`은 최초 insert의 `original.manual`을 저장·복원한다. 수동=true인 시점에 증원→연속 증원→새 플레이어 공격이 시작되면, 새 발사는 false로 바꾸지만 insert 종료가 다시 true를 복원했다. 종료 시 실제 새 화살이 여전히 존재했다.
5. **대사 종료에도 같은 형태의 오래된 복귀가 있다.** `Scene.storyRelease()`의 static tween은 저장 manual 값을 갖고, `renderer.js:239`가 완료 시 그 값을 복원한다. 실제 `HonroStory.start/finish` 뒤 450ms 복귀 도중 새 발사를 시작하면 tween 종료가 manual=true를 되살렸다. 실제 화살이 날고 있는데 다시 추적이 멎었다. 증원 insert만 고쳐서는 이 경로가 남는다.
6. **턴 알림이 항상 복구해 주지는 않는다.** `story.js:67`은 round/side별로 한 번만 알림을 처리하고 enemy/ally에서 `focusUnit(...,1200)`을 호출한다. module이 그 요청을 거부해도 lastTurnNotice는 이미 기록된다. 유예 만료 뒤 같은 턴에서는 재시도하지 않았다. summon phase는 이 알림에서 아예 빠진다.

## 현재 실제 우선순위와 상태 전이

| 상태/요청 | 현재 처리 | 함의 |
|---|---|---|
| 직접 drag / wheel / pinch / minimap | cancel → manualUntil 1900ms, 입력 경로가 manual=true | 실제 증원이 없어도 공통 renderer 억제가 생김. PC wheel·모바일 CDP touch drag로 재현 |
| module.update가 true | 다른 카메라 로직 전체를 건너뜀 | 수동 유예 또는 증원 insert가 story/투사체/대상/active 추적보다 먼저 소유 |
| storyFrame | 일반 follow/tween을 배제하고 마지막에 story framing 적용 | manual=true여도 storyFrame은 움직일 수 있음. 필수 대사 잠금은 공격 추적과 분리할 필요 |
| storyTween / goalFocus | 일반 follow 계산 뒤 값을 덮음; goal은 tween 없을 때 직접 지정 | manual=false만으로 공격 추적을 되찾지 못함. static tween 종료가 manual 값을 다시 쓸 수 있음 |
| 일반 자동 follow | `!storyFrame && !manual && active` 안에서 speaker → 첫 non-child projectile(없으면 첫 projectile) → reviewFocus → focusId → active | 실제 공격 ID/타깃에 따른 공통 소유권은 없음. speaker가 유효하면 투사체보다 앞섬 |
| focusUnit(id,ms,speaker) | insert/유예면 버림. 아니면 focusId/Until을 설정하고 manual=false | damage/턴/화자 같은 여러 원인이 부수적으로 manual을 해제함 |
| 피해 | main.hurt wrapper가 HP 감소 시 focusUnit(target,720) | projectile이 있으면 일반 follow에서 projectile이 여전히 우선. 유예 밖의 피해 초점은 같은 공격 중의 manual도 false로 바꿀 수 있음(소스 확인) |
| focusUntil/speakerUntil 만료 | 초점 후보에서만 빠짐 | manual을 해제하거나 다음 공격을 시작시키는 이벤트가 아님 |
| Engine.fire 성공 | phase=flight, shot++, projectile/warrior/beast 시작 | scene 소유권을 알리는 공통 공격 시작 이벤트가 없음. player App만 별도로 flag 해제 |
| S00 melee | fire의 root projectile을 제거하고 meleeAction 생성 | “투사체가 새로 생기면 수동 해제”만 넣으면 근접 공격을 놓침 |
| 소환귀 | runSummonTurn/stepSummonTurn/launchSummonBolt의 별도 경로 | 실제 child bolt가 생겨도 b.shot은 증가하지 않음. “shot 변경만 감지”로는 불충분 |
| 공격 종료/review/팀 전환 | engine.finishAction, queue/phase/active 변경 | scene.manual을 일괄 복구하지 않음. 자동 상태일 때만 기존 review/active follow가 동작 |

speaker/storyFrame/goal의 우선순위는 소스에서 확인했다. 활성 필수 대사와 정상 공격을 억지로 동시에 진행시켜 정상 플레이 사례라고 주장하지 않는다. 이번 실제 대사 재현은 **대사가 끝난 뒤 조작이 가능한 450ms 복귀 구간**이다.

## 실제 코드로 구동한 28개 진단 결과

동일 14개 항목을 Chromium PC 1280×800과 모바일 390×844에서 실행했다. PC는 실제 browser wheel, 모바일은 CDP touchstart/move/end로 canvas pointer drag를 발생시켰다. pageerror는0이다.

| 사례 (PC/모바일 공통) | 관측 결과 |
|---|---|
| player 무조작 | 실제 화살을 자동 추적함 |
| 발사 전 수동 → 실제 다음 발사 | manual은 false로 바뀌나 1,900ms 억제로 화면 고정 |
| 비행 중 수동 → 2,100ms 진행 | 유예는 끝났지만 manual=true로 그대로 고정; 실제 화살 존재 |
| 유예가 끝난 뒤 다음 player 공격 | manual=false, 실제 화살 추적 복귀 |
| 유예 안에서 다음 player 공격 | shot이 새로 증가해도 억제 유지, 고정 |
| 무조작 enemy | 실제 enemyAction planner가 fire, 투사체 자동 추적 |
| 같은 enemy side의 다음 actor 공격 전 수동 | 유예가 끝난 뒤 실제 AI가 발사해도 manual=true, 고정 |
| 유예 중 enemy 턴 알림 / 만료 후 같은 알림 | 요청 거부 후 같은 round/side 재시도 없음; force=true를 따로 호출하면 복구되는 차이 확인 |
| 무조작 실제 S00 근접 명중 | root projectile 없이 meleeAction·HP 감소, target focus로 이동 |
| 수동 직후 실제 S00 근접 명중 | 실제 피해가 나도 억제 중이라 camera 고정 |
| 무조작 실제 등불귀 소환 턴 | 실제 scheduler의 child bolt를 추적 |
| 수동 후 실제 등불귀 소환 턴 | shot 증가 없이 실제 bolt 발생, manual=true로 고정 |
| 연속 증원 중 새 player 공격 | insert 종료가 old manual=true 복원, 새 화살이 있어도 고정 |
| 실제 대사 finish 직후 새 player 공격 | static storyRelease 종료가 old manual=true 복원, 새 화살이 있어도 고정 |

PC 수치 예: 발사 전 수동 사례는 camera.x=183.97에서 고정된 동안 실제 화살 x가930.2→1352.9로 이동했다. 연속 증원 사례는 새 발사 직후 manual=false였으나 종료 후 camera.x=183.97/manual=true로 복귀했고 실제 화살은 x=1367.2에 남았다. 대사 복귀 사례도 실제 화살 x=1437.2인 상태에서 같은 manual=true 복원이 확인됐다. 전체 원본 상태/시간/공격 수락 결과·focus 호출은 [browser.json](browser.json)에 있다. owner 표기는 production의 새 신호가 아니라 진단기가 현재 flag/우선순위로 분류한 값이다.

[PC 수동 후 발사](evidence/desktop-pan-before-fire.png) · [PC 증원 종료가 새 공격을 덮음](evidence/desktop-insert-return-over-attack.png) · [모바일 수동 후 발사](evidence/mobile-pan-before-fire.png) · [모바일 증원 종료가 새 공격을 덮음](evidence/mobile-insert-return-over-attack.png)

## 다음 단계 최소 수정안 — 아직 구현하지 않음

기준을 **“수동 유예 N초 뒤 해제”가 아니라 “다음 실제 공격 시작에서 자동 복귀”**로 맞춘다.

1. 성공한 새 공격을 공통 경로로 알린다. player/AI/투사체/warrior melee/beast는 fire 성공 지점, 소환귀·NPC의 직접 근접/별도 bolt는 실제 attack 시작 지점에 최소 hook을 둔다. 실패한 fire, 준비만 한 행동, 매 프레임의 동일 projectile, 각 child 발사마다 새 공격으로 잘못 처리하면 안 된다. b.shot 또는 새 projectile 배열만 감지하는 방식은 위 melee/summon 증거 때문에 부족하다.
2. 공통 beginAttack에서 이전 수동 유예와 오래된 복귀권을 무효화하고 현재 공격 자동 초점을 시작한다. attack 일련번호/카메라 의도 번호를 작게 추가해 insert.original.manual와 storyRelease의 예전 manual이 더 새 공격을 덮지 못하게 한다. 현재 직접 drag/pinch 중인 포인터 의도는 우선 보존하고, 이미 끝난 수동 조작을 다음 공격까지 영구 유지하지 않는다.
3. 사용자 기준대로 새 공격이 시작되면 진행 중 증원 insert/대사 **종료 복귀 tween**은 현재 화면에서 공격 추적으로 넘기는 것이 권장된다. 최소한 stale manual 복원은 반드시 금지한다. 활성 필수 storyFrame/대사 잠금까지 공격 때문에 취소하는 것은 별개이며 이번 수정 범위에 자동 포함하지 않는다. 새 증원 무리의 실제 ID/no-fallback 계약은 보존한다.
4. 같은 공격 중의 damage/turn focus가 직접 카메라 조작을 몰래 해제하지 않도록 요청의 역할을 구분한다. 현재 focusUnit의 “항상 manual=false” 부수 효과와 1,900ms 전역 차단을 함께 정리한다. renderer의 기존 smooth follow·무리 bounds·각 공격의 물리/피해/턴 순서는 유지한다.

먼저 위 공통 시작/복귀 무효화만 좁게 구현하고, 이 진단 행렬에서 **next attack 직후 automatic**으로 기대값을 바꾸는 것이 다음 검증 단위다. 단순히 releaseCharge에 manual=false를 한 번 더 쓰거나 1900ms를 줄이는 것은 현재 근본 원인을 해결하지 않는다.

## 검증 범위와 작업 상태

`python tools/testing/diagnose-attack-camera-state.py`가 **현재 잘못된 상태 전이를 재현하는 진단**으로 통과했다. 게임이 사용자 기준을 만족한다는 통과가 아니다. 실행 소스는 committed web bundle이며 Engine.fire/App.releaseCharge/warrior hit/enemyAction/실제 summon scheduler를 사용했다. 평지 arena·HP·loadout·turn prerequisites를 준비하고 completion guard를 막았으며, performance clock과 Engine.tick/Scene.render를 수동으로 진행한 frame fixture다. 정상 campaign/fullplay·모든 스킬/맵·물리 배치·실기기 touch 검수는 아니다. mobile CDP touch는 실제 장비의 성능·OS 제스처 증명이 아니다.

9f7a6273의 gameplay/runtime/shared/HTML/web은 원본 그대로이며 새 build는 하지 않았다. 따라서 카드 드래그, 대사 실루엣, d196 전투 혼 포함 증원 카메라, SVG fallback 제거, guide 행 수정과 성공 발행 자산도 변경하지 않았다. 진단 결과의 source SHA256/entry hash를 browser.json에 보존한다. 다른 engine/runtime 진행 작업과 코드 충돌은 없다. 다음 구현은 renderer/main/reinforcement-camera 및 attack 시작 경계가 변경 후보이므로 부모가 해당 담당자와 통합해야 한다.

부모가 공개 확인한 사실: **Pages39886957929 / 2026-10-23T02:00:19Z / source9f7a6273** 성공, 공개 entry795c4f3b·실제 camp 진입·training tree image 로딩 확인. 처음26개 skill DOM의 SVG0과 로딩 뒤 실제 이미지도 부모 확인이다. guide 투명행은 후보의 실제14장 전후/64위치 검수이고 부모가 같은guide를 공개에서 다시 열지는 않았다. 이 사실은 부모 근거로 구분했으며, 후속 실제 build 시 해당 성공 그래프를 정확히 등록해야 한다. 이번 진단은 발행 그래프를 변경하지 않았다.
