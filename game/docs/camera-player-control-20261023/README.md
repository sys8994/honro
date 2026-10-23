# P0: 수동 카메라 뒤 이동 추적 복구 — 2026-10-23

공개 기준 **0b96adc77629198675241d04b5e29954a525a6bb**에서 내가 추가한 별도 수동 잠금이 기존 이동 복귀를 막았다. `main`은 이동·점프·선택에서 `scene.manual=false`를 썼지만 `attack-camera`의 `s.manual`은 true로 남았고, `reinforcement-camera.update`가 다음 render마다 `scene.manual=true`와 조기 return을 강제했다. 다음 공격만 잠금을 푼다는 정책을 이동 추적 전체에 확대한 회귀다.

## 실제 수정 전 재현

같은 1장 일반 루프, 실제 입력, 일반 시간/물리/지형/좌표에서 확인했다. 수동 입력 없는 기본 오른쪽 이동은 기존에도 따라왔다. 미니맵에서 먼 곳을 본 뒤 실제 이동하면 캐릭터만 이동하고 카메라는 고정됐다. 기대값 수정만으로 통과시킨 검사가 아니다.

| 실제 입력 | 캐릭터 이동 | 카메라 이동 | 이동 후 캐릭터 화면 X |
|---|---:|---:|---:|
| PC 미니맵 → 오른쪽 | 323.02 | 0 | -936.36 (화면 밖) |
| 모바일 미니맵 → 오른쪽 | 337.85 | 0 | -1167.96 (화면 밖) |

[수정 전 원본 측정](before.json). PC [수정 전](evidence/before-desktop-move.png) → [수정 후](evidence/after-desktop-move.png), 모바일 [수정 전](evidence/before-mobile-move.png) → [수정 후](evidence/after-mobile-move.png). 수정 후에는 실제 캐릭터 body가 viewport 안에 있고 카메라 좌표도 이동하는 것을 검사·이미지로 확인한다.

## 최소 수정과 유지할 경계

실행 변경은 `attack-camera.js`, `main.js`, `reinforcement-camera.js` 세 파일이다.

- `resume(scene)`가 두 manual 상태와 오래된 focus/tween/증원 복귀권을 함께 해제한다. 이동 입력·성공 점프/드롭·성공 아군 선택의 기존 복귀 자리를 이 경로로 연결했다. 공격 수·전투 상태를 바꾸지 않는다.
- 새 자기 턴/다음 아군의 조작 시점도 공통 경로를 사용한다. 같은 턴의 단순 render, 적군 턴 알림, 공격 후 retreat와 S13 후속 검술은 새 조작 시점으로 세지 않는다.
- 실제 카메라 pointer가 잡혀 있으면 `resume`가 거부한다. `cancelInput`이 턴/선택 때문에 카메라 gesture를 임의 종료하지 않으며 실제 pointerup/cancel이 종료한다. 손을 뗀 뒤 다음 이동/점프/선택/실제 공격은 정상 follow를 요청할 수 있다.
- 비행 중 직접 조작은 같은 공격의 피해 tick·연사·반사/분열·지속 방출·S13 후속에 빼앗기지 않는다. 실제 새 발사/AI/소환 공격의 공통 시작과 세대 보호는 유지한다.

Engine, NPC 공격, 피해 계산·피해 안내, 승인된 14장 데이터/revision14:1, 대사는 0b96과 바이트 동일하다. 저장 상태에 새 필드를 추가하지 않았다. 줌 수식·프레이밍·게임 밸런스·지형·대사를 바꾸지 않았다.

## 검사 범위

`python tests/camera-player-control-browser.py --before`는 원본 0b96 번들에서 화면 이탈을 확인한다. 기본 실행은 수정 후 일반 1장의 실제 키/joystick/touch 입력을 사용한다. clock·Engine·frame·HP·지형·좌표를 대체하지 않는다. 아군 선택만 추가 mage 1명을 넣은 명시적 roster fixture다. 모바일은 Chromium touch emulation이며 실기기가 아니다. 이동/팬/점프/발사는 실제 touch이고, 방어/아군 선택은 모바일 viewport의 실제 버튼 click이다. CDP drag 직후 Playwright tap이 pointerup까지 내고 compatibility click을 누락한 harness 사례가 있어 방어는 버튼 click으로 턴 전환 발생부터 확인했다. 이 입력 보완 때문에 게임 UI 소스를 고치지는 않았다. 전투 완주를 주장하지 않는다.

PC20·모바일20, 총40건(일반1장34건·명시적 roster fixture의 실제 선택6건)이 통과했다. pan/zoom/minimap 각각 좌우 이동·점프·다음 자기 턴·아군 선택·발사, 수동 없음 기본 이동과 held drag를 포함한다. frame fixture36건도 기존 기대값 그대로 통과했다.

최종 조합별 결과와 원본 캡처는 [after.json](after.json), 공격/증원/대사 회귀는 [attack-regression.json](attack-regression.json), 정확한 번들·보존 해시·검사 결과는 [verification.json](verification.json)을 따른다. 이전 [공격 복귀 보고서](../attack-camera-fix-20261023/README.md)의 “다음 실제 공격만” 수동 해제 정책은 이 P0 수정으로 보완된다.

정식 build/typecheck와 관련 controller/action/reinforcement/resize/행동순서/Continue/web-split, 14장 경계가 통과했다. 최종 entry는 `web/entries/game.a7a0a70ac170e44d.js`, direct Playtest는 `web/entries/game.cb062379fecb4e8c.html?embedded=1`이다. 무관한 기존 story-staging 실패는 이전 보고서 그대로이며 다시 수리하거나 전 장 검사로 확대하지 않는다.

## 발행 상태

master/Pages 반영과 공개 실제 이동 재검증은 부모 담당이다. 부모가 공개했다고 전달한 0b96의 활성 자산 354개를 바이트·SHA256으로 보존 확인한다. 기존 manifest의 성공 발행 그래프 24개도 보존한다. `gh run list`의 Actions 메타데이터 읽기는 GitHub `Forbidden`으로 거절되어 정확한 0b96 Pages run/완료 시각을 추측해 등록하지 않았다. 해당 읽기를 재시도하지 않았으며 후보 제작·push의 차단 사항은 아니다.
