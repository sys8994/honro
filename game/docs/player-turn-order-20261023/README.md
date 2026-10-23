# 모닥불의 기본 행동 순서

> 역사 기록: 아래는 별도 편집기 당시 결과다. 현행은 [카드 직접 정렬](../camp-card-turn-order-20261023/README.md)로 교체했으며 Engine/저장 형식은 유지한다.

기준 공개 master `befca64e4026aa83d8f15326c5fc19f1e18e1677` 위 `fix/player-turn-order-20261023` 후보. master/Pages는 부모 담당이며 이 브랜치에서 변경하지 않았다.

모닥불의 **행동 순서**에서 합류한 동행만 앞/뒤 버튼으로 옮기고 저장한다. 드래그는 필요 없다. 저장/취소/카드 기본순서와44px 이동 버튼을 제공한다. **카드의 고정 배치와 전투 자동선택 우선순위는 별개**임을 편집기에 표시한다. 미합류 이름·초상화는 새 편집기에 노출하지 않는다.

## 동작과 보존

- `profile.playerTurnOrder`에 네 클래스의 우선순위를 저장한다. 프로필에 없는 구 기록은 기존 순서를 그대로 쓴다. 새 설정을 저장할 때는 중복/잘못된 값을 제거하고 빠진 클래스는 카드 기본순서(설오·담허·휘겸·소단)로 채운다. UI에는 현재 합류한 사람만 표시한다.
- 새 전투의 최초 선택, 아군 한 명의 행동 종료 뒤 다음 자동선택, 다음 아군 라운드 최초 선택에 적용한다. 현재 살아 있고 출전한 후보만 대상으로 하며 죽음·포획·행동 소비/기절을 건너뛴다. 전투 중 수동 선택은 기존대로 가능하다.
- `units`, `party`, 출전 위치·ID, 적/소환/NPC queue를 정렬하지 않는다. 자동선택 후보의 복사본에서 플레이어 동행만 우선순위로 비교한다. NPC 등 비플레이어 슬롯은 그대로다.
- 모닥불에서 진행 중 저장의 설정을 바꾼 뒤 Continue해도 **현재 수동 선택·이미 소비한 행동·HP/MP/위치는 유지**한다. 새 정책만 전투에 동기화하며 이후 자동선택부터 적용한다. 다음 라운드에는 바뀐 우선순위가 적용된다.
- 설정은 정상 프로필의 저장/새로고침/export/import에 유지한다. 디버그는 기존 세션 복제에만 적용되고 정상 저장/내보내기는 원래 설정을 보존한다. 순서 미설정의 구 전투에는 새 필드도 넣지 않아 whole-battle Continue exact를 유지한다.

## 소스·생성물

- 구현 코드 `0ad37f3116f9c2bf603744e2a645e948df25726b`.
- queue 검사 커밋 `07855754507cf6c525ab464bdb8b32d3e21a625f`(게임 소스 동일).
- 공통 build/typecheck PASS. 생성물 커밋 `fc67257a21fc64276845f2d053a351c9a17eacfe`.
- entry `web/entries/game.7d28f8236e93eef3.js`, embedded `web/entries/game.15475d50bb713714.html`.

독립 소스는 `shared/engine/src/turnOrder.ts`와 `shared/runtime/player-turn-order.js`다. 기존 CSS·초상화·campUI/card/localize 구조는 수정하지 않았다. 모닥불 제어는 `.armory-shell`의 별도 section이다. 병렬 UI 작업과 겹치는 최소 연결은 **main.showCamp 말미, main.mount의 정책 동기화, main 클릭 handler** 세 곳이며 기존 `drawPortraits` 등은 보존했다. 맵 compiler 끝에 fresh 최초 선택 hook 한 곳, 기존 core factory와 Engine 행동 종료/newRound에 각각 좁은 연결이 있다.

## 검사

[Native 결과](native.json): 준비한 Engine 행동 창에서 소단→휘겸→담허→설오 설정, 정상 wait/Engine tick을 거친 적 턴→실제 R2 소단 선택을 확인했다. 중간 설오 수동 선택을 마치면 아직 행동하지 않은 우선 동행으로 이어졌다. 배우 배열/ID는 불변이다. 사망/기절은 별도 준비 fixture에서 실제 `newRound` 처리로 검사했다. 정상 모험 전체 완주나 무적 전투 증거가 아니다.

실제 production summon queue와 NPC queue 생성도 정책 유/무에서 같았다(`summon-1, summon-2`, `npc-z, npc-a`). 구 프로필/전투 Continue exact, 맵 새 진입, 현재 선택 보존, 반복 export/Continue, 취소·저장·reload·import, 디버그/일반 분리를 확인했다. Native 실행 게임 소스 표시는0ad37f31이며 추가 queue 테스트가07855754로 보존됐다.

[최종 생성 UI](browser.json): Chromium390×844 touch로 앞/뒤 버튼을 눌러 소단·휘겸·담허·설오를 저장하고 새로고침했다. 새18장 실제 입장에서 소단이 선택됐고, 방어 뒤 휘겸 자동선택→설오 수동선택→실제 export/persist/reload/Continue whole-battle exact를 확인했다. 이후 모닥불에서 담허를 맨 앞으로 옮겨도 현재 설오 선택과 소단의 소비 행동은 그대로였다. 설오 방어 후 담허가 자동선택됐고 소단·설오는 다시 행동하지 않았다. 카드 DOM 순서 불변, 미합류2인 편집기, 가로 넘침 없음, 브라우저/HTTP 오류0도 확인했다.

UI 실행은 이전 장 완료/성장을 준비한 fixture이며18장 전체 전투나 물리 모바일 실기기 검사가 아니다. 프레임 스케줄을 고정하고 정상 App 방어/선택/저장 경로를 사용했다. 이 고정 때문에 자동저장 루프가 동작하지 않으므로 export 이후 실제 App.persist를 한 번 호출한 뒤 새로고침했다. 초기에는 다운로드 파일과 오래된 localStorage를 그대로 비교해 실패했고, 이를 구분해 검사기를 바로잡았다. 게임의 선택/행동 복구 실패가 아니며 export 내용을 강제로 바꾸지 않았다. 전투 사진은 실제 짧은 행동 창의 카메라만 검사 목적으로 고정했고 렌더 순수성도 확인했다.

관련 보존 검사: O05 집중 낙하/귀환·저장·피해·미리보기 PASS,18장 실제 구 R12/R22/R29/R45/R54 저장 및 반복 Continue 보존 PASS. [결과](preserved-behavior.json). 캠페인/원고·공통 interaction/회귀망령 source·portrait/campUI/ui-bridge는bef와 byte exact다. 새 묵종 미술 미포함. 전체30장/전역 verify/18장 재완주/무관한 UI 수정은 하지 않았다.

최신 실제 성공 bef(Pages39875661732,2026-10-23T00:04:55Z)을 빌드 전 등록했다. 공개17그래프521파일과 구934 chapter13 JSON2개 hash/길이를 보존했고 후보를 성공 발행으로 등록하지 않았다. [보존 검사](preservation.json).

## 실제 화면/저장

- [모바일 순서 편집](evidence/mobile-editor.jpg)
- [미합류 인물 비노출](evidence/mobile-known-only.jpg)
- [새 전투 소단 자동선택](evidence/fresh-selected-sodan.jpg)
- [이어하기 후 소비 행동 보존·담허 자동선택](evidence/continued-next-mage.jpg)

사진은 각각1MB 미만. 실제 짧은 행동 창의 마지막 저장은 `tests/fixtures/player-turn-order-actual-window-20261023.json.gz`. 완주/보상 저장이 아니라 R1에 소단·설오가 방어하고 담허가 다음 선택된 상태다.

재현: `node tests/player-turn-order.mjs` 뒤 `python tools/testing/player-turn-order-browser.py`. Native가 준비 프로필을 생성한다. 공유 모닥불4열 카드/휘겸 crop/대사창 후속은 별도 UI 작업이며 이 후보로 덮지 않는다.
