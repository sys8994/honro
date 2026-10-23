# 모닥불 카드 순서 = 행동 순서

`fix/camp-card-turn-order-20261023` 후보. 기존 별도 **행동 순서 버튼/편집 모달을 제거**했다. 카드를 짧게 누르면 캐릭터를 선택하고, 모바일은420ms 길게 누른 뒤 좌우로 옮겨 놓으면 즉시 한 번 저장한다. PC 마우스 드래그와 카드에 포커스를 둔 Alt+←/→도 지원한다. 현재 선택 캐릭터는 드래그 때문에 바뀌지 않는다.

기존 `profile.playerTurnOrder`와 Engine 우선순위·저장/Continue는 재사용한다. 새 전투/다음 자동선택은 **합류한 카드의 표시 순서**를 따른다. 미합류 카드는 이름/초상화 없이 비활성 placeholder로 뒤에 두며 드래그 대상이 아니다. 저장 배열은 같은 네 클래스 형식이므로 이전 설정도 유지된다. 합류 변화와 중복/잘못된 값은 기존 정규화로 처리한다. units/party/배우 ID·배치·적/소환/NPC queue는 바꾸지 않는다.

## 입력과 취소

- 길게 누르기 전 이동은 재배치 대기를 해제한다. 세로 `pan-y`는 실제 모닥불 스크롤로 이어지고, 짧은 탭은 기존 캐릭터 선택이다.
- 활성 드래그는 pointer capture로 추적하고 원래 카드 배치는 놓기 전까지 유지한다. 대상 카드를 표시하며, 정상 drop에서만 순서를 저장한다. 같은 순서에 놓으면 저장하지 않는다.
- pointercancel, Escape(누르기 대기 중/드래그 중), 영역 밖 이탈, 두 번째 포인터, 창 이탈/숨김·크기 변경, DOM/프로필/합류 목록 변화에서는 저장하지 않고 복구한다. 포인터/타이머/리스너는 재진입 때 정리한다.
- 드래그의 후속 click이 캐릭터 선택으로 처리되지 않게 막는다. 새 포인터의 짧은 탭은 즉시 허용한다. Chrome에서 긴 드래그 직후 native 호환 click이 누락되는 경계를 재현하여, touch pointer-up에서 한 번 선택하고 기존 main click hook으로 중복만 흡수하도록 보완했다. 마우스/키보드의 기본 선택은 유지한다.

## 최종 통합·SHA

처음 기준은 공개e1e4b9aa였고, 이후 부모가 승인한 카메라 d1963a0b와 최종 UI **c8b342b5e79757f5089785d9f01650d23940333a**를 병합했다. c8b의 story-portraits/portraits/story와 전체 승인 CSS prefix를 exact로 보존했다.4열 카드 media block은 한 번만 두고, 카드 정렬·번호·touch-action과 PC4열에 필요한 scoped 규칙만 추가했다. 새 묵종/부착혼40% 변경은 없다.

- 최종 동작 소스/브라우저 검사: `0cf04a85`(전체 SHA는 browser.json). 승인 UI 병합: `6ffa7b69410b5e88116e3040dd9978e434e2810a`.
- Native/타입 검사:6ffa7b69의 동일 Engine/저장 코드. 최종 추가 변경은 touch 취소/click 경계와 실제 UI 검사다.
- 최종 생성물: `127fce39`.
- 실제 entry: `web/entries/game.87356c05c5af54e4.js`, embedded `web/entries/game.6d6545f147ad9a31.html`.
- master/Pages는 이 브랜치에서 변경하지 않았다. 최종 원격 HEAD는 이 브랜치의 문서 커밋이다.

변경 중심은 `shared/runtime/player-turn-order.js`와 카드용 CSS다. main의 기존 hook에는 click event 인자 하나만 추가했다. Engine/우선순위/저장, 카메라 모듈과 main의 나머지 내용·renderer/story-framing/encounters/build, O05/18장/interaction/캠페인·원고는c8b와 exact다. [보존 결과](preservation.json).

## 검증한 범위

[Native](native.json): 새 전투, 아군 행동 종료, 정상 wait/tick을 거친 실제 R2, 사망/기절 제외, 수동선택, 구 저장 whole-battle Continue, export/import/reload, 디버그/일반 기록 분리, 준비한 합류 변화·잘못된 설정 정규화, 소환/NPC queue identity PASS. 여기서 사망/기절/합류는 준비 fixture이며 정상 캠페인 전체 플레이 증거가 아니다.

[최종 실제 브라우저](browser.json):390×844 Chrome touch 입력으로 드래그/drop1회→persist1회, 짧은 탭과 **드래그 직후 탭**, native 세로 스크롤, hold 전 swipe, pointercancel/Escape/대기 중 Escape/영역 밖/멀티터치 취소, 취소 뒤 다음 드래그 복구, 저장·새로고침을 통과했다. 취소는 순서/선택/persist를 바꾸지 않았다. PC 마우스와 Alt 방향키도 통과했다. 별도 버튼·모달이 없고 미합류 이름은 노출되지 않는다.

같은 실제 카드 설정으로 새18장에 들어가 소단이 먼저 선택됐다. 소단 방어 후 설오를 수동 선택하고 실제 export/persist/reload/Continue whole-battle exact를 확인했다. 모닥불에서 카드로 담허를 앞으로 옮긴 뒤에도 현재 설오와 이미 행동한 소단의 HP/MP/좌표/행동은 유지됐다. 설오가 방어한 뒤 담허가 자동선택됐고 소단·설오는 다시 행동하지 않았다. 실제 마지막 창은 R1, 단일 정산/완주 저장이 아니다.

브라우저는 합법 여부를 평가하는 전투 측정이 아니라 이전 장 완료를 준비한 프로필의 짧은 UI/행동 창이다. 프레임을 고정하여 실제 App.persist로 자동저장을 한 번 수행했고, 기록 내용/배우/목표를 강제로 바꾸지 않았다. 검사 카메라만 고정했다. 물리 휴대폰·Safari·모든 입력 장치, 전체30장/전역 verify/18장 재완주는 미실행이다. 최종 build/type/native/browser PASS, 브라우저 오류/HTTP 실패0. 초기 경계 검사에서 드래그 후 호환 click 누락을 발견·수정했으며 최종 결과는 그 수정을 포함한다.

## 실제 JPG / 저장

모두1MB 미만이며 최종 c8b 통합 생성물의 실제 화면을 직접 확인했다.

- [모바일 길게 누른 드래그 중](evidence/mobile-dragging.jpg)
- [모바일 놓은 뒤 순서 저장](evidence/mobile-saved-cards.jpg)
- [미합류 placeholder·이름 비노출](evidence/mobile-known-only.jpg)
- [PC4열 카드와 키보드 대체 입력](evidence/desktop-cards.jpg)
- [Continue 후 소비 행동 보존·담허 자동선택](evidence/continued-next-mage.jpg)

실제 짧은 입력 창 저장은 `tests/fixtures/camp-card-order-actual-window-20261023.json.gz`. 재현: `node tests/player-turn-order.mjs` 뒤 `python tools/testing/player-turn-order-browser.py`(Native가 준비 프로필 생성).

## 공개 보존과 별도 관찰

실제 성공e1e4(Pages39878187459,00:29:18Z), d196(Pages39881056212,00:58:47Z), c8b(Pages39882052190,01:08:33Z)를 등록하여 **공개20그래프545파일**과 구934 chapter13 JSON2개를 hash/길이로 보존했다. 후보는 성공 발행으로 등록하지 않았다. 중간 자체 미발행 생성물 중 보호/활성 집합 밖의 untracked 파일9개만 정리했으며, 이후 최종 생성물을 source로 재빌드했다.

d196 공개 직후 원경 SVG HTTP503/retry가 있었고, 부모 재시도에서01:01:19 실제 휴식터 진입이 확인됐다. 발행 timestamp는 바꾸지 않았고 로더는 수정하지 않았다. 부모가 별도 관찰한 **debug14 휴식터 휘겸 선택대화 무반응**은970에서도 있었으며 원인/범위 미상이다. 이 카드 정렬 후보의 회귀로 확정하지 않았고 현재 범위에서 조사·수정하지 않았다.
