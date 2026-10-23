# 실제 공격 경계의 전투 카메라 복귀 — 2026-10-23

[997c4fc8 조사](../attack-camera-state-20261023/README.md)의 원인을 수정했다. 최초 공개 기준9f7a6273 위의 카메라 구현을, 부모가 master에 반영한 **a3c99e33ec8c7a2c050bf71866a077bbc2cbd9ee 피해 편차/오사격**과 통합했다. master/Pages 최종 배포는 부모 담당이다.

## 바뀐 동작

**실제 새 공격이 수락되면 자동 추적으로 전환한다. 직접 카메라를 움직이면 그 행동의 나머지는 수동이며, 다음 실제 새 공격에서 다시 자동으로 돌아간다.** 시간이1,900ms 지났는지는 더 이상 기준이 아니다.

- 독립 `shared/runtime/attack-camera.js`가 Scene의 의도 번호·공격 수·수동 잠금·현재 카메라 포인터 제스처를 관리한다. Engine/Battle/프로필의 피해·자원·턴·RNG를 변경하지 않는다. 카메라 토큰은 crypto/시각을 사용하며 gameplay Math.random을 소비하지 않는다.
- mounted Engine의 최종 fire wrapper가 **성공 반환**만 보고 전환한다. fire 본문·검증·피해 경로는 a3 원문이다. player 투사체/warrior melee/beast/AI/NPC spell을 같은 경로로 처리한다. 실패·기예 선택·충전 준비·predict/preview는 전환하지 않는다.
- 별도 소환귀의 실제 bolt 묶음 시작과 직접 근접 타격 직전에 optional `onAttackStart(actorId)`를 한 번 알린다. 소환 이동/방호만으로는 전환하지 않고, 같은 묶음의 child bolt마다 알리지 않는다. NPC guard/scout의 직접 검 타격/검기에도 같은 알림만 더했다.
- 연사·반사/분열·지속 orb 방출·피해 tick은 새 시작으로 처리하지 않는다. S13의 `meleeFollow=ready`로 주어진 검술은 기존 한 행동의 연속이므로 카메라 세대도 유지한다. 새 일반 공격만 새 세대다.
- pan/zoom/pinch/minimap의 직접 입력은 현재 수동 잠금을 만든다. 피해/턴 focusUnit은 그 잠금을 해제하지 못한다. 포인터를 계속 움직이는 동안 새 AI 공격이 시작돼도 직접 조작이 우선하고, 손을 뗀 뒤 다음 실제 새 공격에서 자동 복귀한다.
- 새 공격은 현재 화면을 유지하면서 자동 follow에 넘기며 오래된 증원 insert를 취소한다. 표시 중/같은 프레임까지의 증원으로 나중에 다시 튀지 않는다. 새 공격 전까지의 수동 상태를 복원하지 않는다. 별도의 새 증원이 실제로 들어오고 수동 잠금이 없으면 기존 실제 적ID/무리 bounds/무확대/no-fallback framing을 그대로 사용한다. 수동 의도 중에는 해당 증원으로 화면을 빼앗지 않는다.
- Scene snapshot에 카메라 token/intent를 기록하고 storyRelease/증원 복귀가 현재 의도와 맞을 때만 복귀시킨다. 대사 종료 복귀 도중 새 공격이 시작되면 그 오래된 tween/goal을 해제한다. 활성 필수 storyFrame 자체는 취소하지 않는다. 새 Scene의 Continue는 옛 snapshot을 호환하며, 새 공격 뒤에는 이전 세션의 snapshot도 수동값을 되살리지 못한다.

기존 renderer의 부드러운 actor/projectile/review/target follow 수식·줌·공격 물리는 유지했다. 이번 변경은 전체 카메라 재작성이나 밸런스 조정이 아니다.

## 수정 전/후 기대값과 실제 확인

기존14사례×PC/모바일=28개를 같은 이름으로 비교하고, 선택/예측/실패·실제 발사 조작·held gesture·save/Continue를 각각 더해 **18사례×2=36개**로 확인했다. 원본 before는 조사 당시9f bundle, after는 a3 통합 최종 bundle이다. [상태와 호출 측정](browser-after.json), [간단 전후 비교](comparison.json).

| 사례 | 수정 전 | 수정 후 |
|---|---|---|
| 수동 없음: player/AI/근접/소환 | 기존 자동 follow 정상 | 동일 정상 |
| 발사 전 pan → 새 player 공격 | manual=false여도1,900ms 차단 | 즉시 자동 follow |
| 비행 중 pan →2,100ms 경과 | manual=true가 남지만 다른 focus가 부수적으로 해제 가능 | 같은 행동은 시간과 무관하게 수동, 피해/턴도 해제 안 함 |
| 다음 player 공격 (이전1,900ms 안/밖) | 안에서는 여전히 차단 | 둘 다 새 공격에서 자동 |
| 같은 적군 side의 다음 실제 AI 공격 | manual=true 지속 | 수락된 AI 공격에서 자동 |
| 턴 알림만 요청 | 시간 유예에 따라 우연히 해제, 거부 후 재시도 없음 | 새 공격이 아니므로 직접 수동 유지; 다음 실제 공격은 별도 공통 시작으로 복구 |
| pan 뒤 실제 S00 명중 | 피해가 발생해도 화면 고정 | 새 melee 행동 시작에서 자동, 실제 target focus 정상 |
| 실제 등불귀 bolt | manual=true가 남고 shot 증가도 없음 | 실제 소환 공격 알림에서 자동, child 묶음은 한 번만 전환 |
| 연속 증원 도중 새 공격 | old manual=true 복원, 새 화살 추적 중단 | 새 공격이 insert 복귀권을 무효화, 실제 새 화살 추적 |
| 대사 finish의450ms tween 도중 새 공격 | tween 끝에 old manual=true 복원 | 종료 tween 해제, 새 화살 추적 지속 |
| 기예 선택/predict/실패한 fire | 명확한 공통 경계 없음 | 의도 번호·수동 잠금 변화 없음 |
| Space/모바일 실제 발사 버튼 → pan → 다음 공격 | 조사 fixture에서 API 동작 재현 | 실제 키/터치 이벤트로 다음 공격 자동 복귀 |
| held pan 중 새 공격 → 손 뗌 → 다음 공격 | 시간 유예만 사용 | held gesture 동안 수동, 그 행동은 손을 떼도 수동, 다음 새 공격 자동 |
| 실제 localStorage reload/Continue | 기존 저장 계약 | 진행 중 phase/actor/shot/projectile ID·attackSide·damageRoll·damageSequence 그대로, 새 Scene에 stale 수동 잠금 없음 |

after의 연속 증원 사례는 바뀐 수동 계약을 정확히 구분한다. 최초 수동 잠금 중 증원은 시점을 빼앗지 않는다. 실제 첫 공격으로 잠금을 해제한 후 새 두 번째 증원 insert가 켜지는 것을 확인하고, 다음 실제 공격이 그 insert를 중단하는 시점까지 측정했다. before/after의 이 차이를 숨겨 동일한 timer 동작이라고 표시하지 않았다.

`python tools/testing/diagnose-attack-camera-state.py --after` 통과. 기본 before 기대값은9f 조사 시점용이며 수정본에 그대로 적용해 통과시키는 방식이 아니다. PC1280×800은 browser wheel/Space, 모바일390×844는 CDP touch drag/실제 fire 버튼 touch를 사용했다. pageerror0. 평지·턴·HP prerequisites, deterministic clock, Engine.tick/Scene.render 수동 진행을 사용하는 **frame fixture**다. 실제 production Engine.fire/AI planner/warrior hit/summon scheduler와 실제 입력 handler를 사용하지만 정상 campaign/fullplay 증거는 아니다.

원본 시간순 PNG:

- PC [실제 공격](evidence/desktop-flow-00-attack.png) → [직접 수동](evidence/desktop-flow-01-manual.png) → [다음 공격 자동](evidence/desktop-flow-02-next-attack.png)
- 모바일 [실제 공격](evidence/mobile-flow-00-attack.png) → [직접 수동](evidence/mobile-flow-01-manual.png) → [다음 공격 자동](evidence/mobile-flow-02-next-attack.png)

## 일반 게임 루프의 추가 확인

`python tools/testing/attack-camera-live.py`는 **평지/HP/좌표/턴/clock/Engine/프레임 대체 없이** 실제 일반1장을 PC와 모바일에서 확인한다. 새 표준 프로필, enemy speed4/player speed1 설정과 실제 대사 버튼을 사용했다. 첫 실제 발사 → 직접 wheel/touch pan → 자연2라운드의 다음 아군 차례에서 실제 발사 → 자동 복귀가 양쪽에서 통과했다. 첫 적군은 이동/방어만 했으므로 그것을 다음 공격으로 잘못 셌던 초기 테스트 전제를 고쳤다. 적군 이동/방어만으로 직접 수동이 풀리지 않고 **다음 실제 발사**에서 풀린 결과다. 두 번의 발사까지만 확인하며 정상1장 완료를 주장하지 않는다. 실제 AI 공격은 별도36사례의 production planner fixture에서 확인했다. [실제 일반 진행 측정](browser-live.json).

- 일반 PC [첫 공격](evidence/live-desktop-00-player-attack.png) → [직접 수동](evidence/live-desktop-01-manual.png) → [자연 다음 차례의 새 공격](evidence/live-desktop-02-natural-next-attack.png)
- 일반 모바일 [첫 공격](evidence/live-mobile-00-player-attack.png) → [직접 수동](evidence/live-mobile-01-manual.png) → [자연 다음 차례의 새 공격](evidence/live-mobile-02-natural-next-attack.png)

## a3 피해·오사격 통합과 보존

충돌은 `shared/engine/src/engine.ts`, `shared/runtime/allies.js`, HTML3개/manifest와 generated entry rename들이었다. **a3 원문을 먼저 채택한 뒤 카메라 observer만 재적용**했다. engine에서 아래3줄, allies에서2회 callback을 제거하면 각각 a3와 바이트 동일하다. fire 인접 damageRoll/attackSide, 소환귀 `summonDamageOrigin`/섭혼 origin, NPC roll·진영 전달을 모두 보존했다.

- engine class `onAttackStart?: (actorId:string)=>void`
- stepSummonTurn: lantern targets가 있을 때 묶음 시작1회
- stepSummonTurn: 실제 직접 근접 hit 직전1회
- allies.tick: guard/scout 직접 검/검기 직전 각1회

독립 module, main mount/input gesture/releaseCharge, renderer.zoom/storyRelease, story-framing snapshot, reinforcement ownership가 카메라 변경 파일이다. `story.js`, portraits, CSS, 카드 드래그/행동순서, 스킬 이미지 전용/guide 투명행, 장 데이터와14장 천장 후보는 수정/수입하지 않았다. 동시 engine 작업은 위3 observer 줄만 맞추면 된다.

검사:

| 검사 | 결과/범위 |
|---|---|
| `npm run build` | 정식 Game/Workshop/direct Playtest 최종 통합 산출물 |
| `npm --prefix game run typecheck` | 통합 TS Engine 통과 |
| `node tests/attack-camera.mjs` | 성공/실패 경계, 수동 수명/held, 소환 알림, stale release, required dialogue, Continue, duplicate attach |
| `node tests/attack-camera-actions.mjs` | 실제 연사·반사/분열·지속 방출·S13 연속·predict/실패, observer 유/무 Engine 쌍의 전투 저장 bytes 동일 |
| `node tests/reinforcement-camera.mjs` | 실제 적ID/무리 bounds/죽음/연속/수동/대사/Continue 계약 |
| `node tests/reinforcement-camera-paths.mjs` | 기존30장 source 목록 및 대표10장 직접 spawn 계약 유지. 정상 전장 플레이가 아님 |
| `node tests/reinforcement-camera-spirits.mjs` | 실제 전투 혼 포함·시각 전용/배열 밖 제외 |
| `node tests/camera-resize.mjs` | 기존17개 resize/painted bounds/소유권 |
| `node tests/player-turn-order.mjs` | 기존 행동순서/수동선택/save/import/debug |
| `node tests/combat-damage-variance.mjs` | a3의64 cast 정책·24,576표본·독립 RNG/계수 상속 |
| `node tests/coalition-damage-reduction.mjs` | a3 오사격30%/최소·치명·진영·지연/중복 적용 방지 |
| `node tests/projectile-friendly-fire.mjs` | 근원탄/자동·특수 보호와 mounted App 양방향 오사격 |
| `node tests/combat-damage-continue.mjs` | 6종 실제 App Continue/import, 각180tick 재개 동일 |
| `python tests/combat-damage-browser.py` | 실제 built Chromium 저장/reload/Continue 계수·진영·index·행동·기력·성장/장착/완료 보존,30%/보고서, SVG fallback 없음, Workshop, pageerror0 |
| `node tests/web-split.mjs` | 활성354개 해시·바이트, canonical30장/856 library, Game/embedded/Workshop·저장 보호 |

추가 `node tests/story-staging.mjs`는 첫9장 숨김/구 저장 보존 항목은 통과하나, 다음 motion 완료 뒤 `assert(npc(a))`(21행)에서 실패했다. 별도 worktree의 **수정 전 a3 원본에서도 같은 위치·같은 undefined 값으로 재현**했다. 관련 없는9장 staging 원본/기대값 수리는 포함하지 않았다. 대사 종료 뒤 새 공격의 stale release 회귀는 별도36사례에서 실제 Story.start/finish로 통과했다.

기존 camera-bounds/story-framing 검사의 옛 맵/대사 기대값 실패는 [기존 기록](../reinforcement-camera/README.md)대로이며 무관한 수리를 포함하지 않았다. 전체 verify·전 장 정상 플레이·실기기 성능·모든 스킬 조합/채널링 형태 전수는 하지 않았다. 지속 orb 방출과 실제 충전 입력은 검사했지만 이를 모든 장기 효과 검수로 확대하지 않는다.

## 발행 자산과 인계

부모가 확인한 **9f7a6273 / Pages39886957929 / 2026-10-23T02:00:19Z**를 성공 발행으로 정확히 등록했다. 9f까지22개 발행 그래프/고유 immutable559개를 확인했고, a3 추가 뒤의 최종 보존 수·해시는 verification.json에 구분한다. **부모가 후속 확인한 a3c99e33 / Pages39889380063 / 2026-10-23T02:26:33Z도 정확한 성공 발행으로 추가 등록했다.** 부모는 공개 entry `game.eb159c693a154367.js`와 title→휴식터→모닥불을 확인했다. 기예 편차 안내의 DOM 누락은 별도 UI 작업 중이며 그 미완료 변경은 가져오지 않았다. 생성물은 부모 manifest를 기준으로 재빌드했다. 이 후보 역시 발행 성공으로 등록하지 않았다.

정확한 entry/소스 해시·검사 결과·보존 비교는 [verification.json](verification.json)에 기록한다. master/Pages에 쓰지 않았으며 최종 병합·발행·공개 실행 확인은 부모가 담당한다.
