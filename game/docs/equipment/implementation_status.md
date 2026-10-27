# 장비52 구현 기록 (2026-10-27)

기준: 휴식터 복원 `039f3426`, 설계 `3ff01388`, 최종 아이콘 `ef7c3ae1`.
구현 브랜치: `codex/equipment-52`. 최종 공개 반영 상태는 아래 미결정 항목과 별도로 확인한다.

## 구현 정책

- 코어 revision13 유지. 캠페인 schema5 + equipment.schema1. 기존 성장 migration 순서·SP·기예·클리어·전투·대사 기록을 보존한다.
- 장비 원장 하나에 runId, ownedItemIds, 클래스별 personal/common, 사건별 pending/committed·선택 itemId·알림 확인을 저장한다. 전투에는 인벤토리가 아니라 착용 두 ID만 보관한다. 알 수 없는 버전·정의·중복 공용품·장착 불일치는 가져오기 실패로 원본을 보존한다.
- 선택·착용·공용품 이전은 candidate를 `profileStore.save`로 성공적으로 저장한 뒤 실제 프로필에 반영한다. 실패·이중 클릭·재접속·이전 전투 체크포인트는 선택을 바꾸거나 중복 지급하지 않는다. App.persist의 반환값은 사용하지 않는다.
- 새 회차의 기본 장비는 해당 정규 멤버 합류 후 새 전투 전 빈 전용 칸에만 자동 장착한다. 기존 저장 소급품은 인벤토리에만 추가하며 진행 중 전투에는 자동 장착하지 않는다. 옛 선택 사건은 미결정으로 남긴다. 선택 정예·수문은 클리어만으로 소급하지 않는다.
- 착탈은 실제 휴식터에서만 가능하다. 진행 중 전투·허공터·분할 원정은 교환을 잠근다. 공용품 이전은 이전 착용자를 보여 주고 명시적으로 확정한다. 현재 HP/기력/이동력은 보존·하향 clamp하며 레벨업은 기존 생존자 전회복을 유지한다. 분할 복원은 착용 ID가 달라졌을 때 최대치 차액을 회복으로 더하지 않는다.
- 정의52개·효과26개는 모두 코어에 있다. 정상 지급은 공개1–3막 사건만 허용한다.4막 미리보기와5–6막은 잠금이며 디버그52개는 정상 저장·내보내기와 분리된다.12그룹에서 회차 하나만 선택한다. 전체 설계 최대36개, 현재 공개 설계 최대23개다.
- 실제 아이콘52개는 itemId 기반256px WebP, 합계637,782B. 승인 커밋과 blob/출력 SHA256을 비교했다. 빌드는52개가 모두 없으면 실패한다. 임시 그림·원본 PNG·프롬프트는 포함하지 않는다.

## 현재 정식 단계 ID 대응

인계서 일부는 v4 이전 ID다. 사건 의미와 원장을 유지하고 실제 완료 기록에 연결했다.

|사건|현재 정식 근거|옛 스냅샷 근거|
|---|---|---|
|13장 석공 구조|13.release (실제 호송 후 안전 해제)|resident|
|16장 증언|16.testimony|witness|
|17장 인양틀|17.hoist (위협 정리·받침 후)|hoist|
|18장 종지기|18.keeper|keeper|
|22장 문서|v4.record-bundle|upper-register|
|29장 담허 흔적|stage29-echo|hyeonmuk-letter|

15장 수문은 실제 상호작용 성공에서 별도 receipt를 남긴다. 접근 장면·명중·step 값을 만드는 것만으로는 주지 않는다.

## 미결정: 정식12장 공용품06

인계서 eq_co_06은 `honroAct2Elite && honroQuarryEntry`인 유한 수레 정예 제압이다. 옛 스냅샷 경로의 실제 유한 증원→제압→지급은 검증했다. 하지만 정식 v4는 `honroQuarryRevision=0`으로 이 경로를 끄고, 현재 `reviewed.12.gap`의 원혼2명만 유한 증원한다. 이들은 지정 정예가 아니고 옛 진입 표지도 없다.

전투 수·능력치·XP를 임의 변경하지 않았다. 현재 유한 증원 첫 제압으로 사건을 옮길지 조정자에게 확인 중이다. 이 대응 전에는 정상 정식1–3막의 자동 획득 연결을31개/최대23개 완료로 보고하지 않으며 master/Pages에 발행하지 않는다.

## 집중 검증

- `npm --prefix game run typecheck`
- `node tests/equipment-core.mjs`:21묶음.26효과의 수정 helper, 상한, 기력 비용 순서, 같은 난수 표본·저장 범위, 피해/방어 순서, 수명 생성시 반영, HP만 회복 등을 확인.
- `node tests/equipment-state.mjs`:12묶음.2/3택 미결정·재접속·이중 확정·실패 원자성·중복 보상·공용 이전·4막 잠금·디버그 분리·소급·분할 복원.
- `node tests/equipment-app.mjs`: 실제 App5묶음. DOM/storage doubles이며 실제 브라우저 증거와 구분.
- `node tests/equipment-events.mjs`: 옛12장 실제 유한 증원/Engine 제압, 현재15장 실제 상호작용/receipt. 전투·위치·대사 종료 선행조건은 fixture다.
- `node tests/equipment-icons.mjs`:52개 승인 Git blob·256px·출력 바이트 동일.
- 기존 `tests/combat-damage-variance.mjs`, `tests/levelup-companion-growth.mjs`12묶음, `tests/act3-split-v2.mjs`6묶음 통과.
- `node game/build.mjs`; `python3 tests/equipment-browser.py`: Chromium1280×800/390×844/844×390. 비교·착용·2택 닫기/재접속/확정/이중탭·3택 저장 실패/재시도·공용 이전·이름+아이콘 알림.52개 실제 로컬 HTTP200과256px 디코딩 확인. 스크린샷은 `_local/reports/equipment-browser/`에 둔다.

전체30장 순회는 실행하지 않았다. 정식12장 대상 대응, 최종 통합 SHA의 Pages 성공·공개 UI/아이콘 HTTP 확인은 아직 완료가 아니다.
