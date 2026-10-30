# 18장 15턴 이내 후보

현재 공개 424c0e6b(게임플레이 기준 dd878) 위 후보. master/Pages는 변경하지 않았다. **새 시작 정상 입력 사례는 R10 승리·4인 생존**, 종지기는 HP1 비살상 제압. 실제 R10 저장을 최종 생성 UI에서 Continue하고 완료 대사→한 번 정산→19장 입장→export/Continue까지 확인했다. 19장 전투는 실행하지 않았다.

- 전투 실행 소스: `1a087612f8a73c93d43a8c0ee61ef85f6d9c2b95`.
- 공통 build/typecheck 입력: `2814d26009bc74b74466630bcc6d045cdd20b860`(동일 게임 소스).
- 정산 검사기 보정: `12361dc9`(게임 소스 불변). 생성물/실제 입력 저장 커밋: `a94ef3b8fc131b8c04779f4785cfbf15cc51a570`.
- 생성 entry: `web/entries/game.21a0aab6aada752c.js`, chapter18: `web/data/chapter-18.78edf6319dbc90a1.json`.
- 정확한 실행 hash·성장·동작 수·실패 사례: [summary.json](summary.json). 원자료/실제 저장은 `tests/fixtures/stage18-short-20261022/*.json.gz`.

## 실제 변경

필수 소탕13명과 마지막 별도 청소/보복 파동을 은퇴시켰다. 새 시작은 억제진 가까운 기존 지지면에서 시작하고 고정구를 같은 접근부로 옮겼다. 억제 유지와 사격은 병렬이며 유지는 2라운드, 증원은 한 번 2명이고 출현 수를 채우는 대기는 없다. 누출혼과 종지기는 종 아래 연결된 지지면에 모았다. 초기 전투 적10명(+비전투 목표 배우1), 동시 행동 상한3. 종지기 normal HP880, 고정구 HP120. 나머지 지역은 선택 사격각·우회로로 남는다.

최신 사용자 지시에 따라 **억제진/누출혼은 주변 적의 생존을 이유로 거절하지 않는다**. 살아 있는 담당 동행, 거리·지지면, 기계 선행은 유지한다. 억제 유지의 일반 적 점유 반경도0으로 하되 담허의 생존·실제 위치 유지가 필요하다. 종 하강의 실제 쓸림면 점유, 투사체/행동/불안정 물리/대화 중 지연은 그대로다. 공통 `act2.eligibility`에는18장의 이 두 ID만 면제하는 분기 하나를 넣었고 다른 장에는 적용하지 않았다.

승인된 바닥·천장·종 본체 미술/renderer는 변경하지 않았다. 고정구 목표 형상 하나의 위치·내구도 외 기존 충돌64개, 선언 경로27개, 환경 미술, 다른29장과 library는 deep-equal. 최신 초상화 source는424c와 byte exact. canonical narrative는 부모 확정 guide 한 필드만 다르며 story/outro/summary/beats 원문은 보존했다. 은퇴한 clear-wards beat는 새 진행에서 호출하지 않지만 과거 기록은 남긴다.

## 정상 입력과 비용

normal / seed19388 / 4동행 / 장착4슬롯 / 실제 `C.train` / 능력치 수련6회 / 장착 기예 최저 합법 랭크·슬롯순 고정 배분. 입장 경지는 설오15·담허11·휘겸14·소단15, XP57076/25941/46638/54346. SP 획득/사용/잔여는31/30/1,23/23/0,29/29/0,31/31/0. 설오 잔여1은 장착 랭크 상한으로 사용 불가. 초기 HP856/785/1438/1080, MP199/236/215/323, 이동도1724/1591/1905/1803.

이 입장은 **현행 v4의 필수 대상·목표 기여 보상 receipt를 준비한 fixture**다. 구v3 고정 경지14를 주입하지 않았다. 1~17장을 실제 플레이한 기록이나 신규 캠페인 평균/수학적 최소 성장이라는 주장은 하지 않는다. 앞10장 목표 receipt 및 고정 round-robin 귀속 등 준비 가정은 `readiness-ledger.json.gz`와 helper에 공개했다.

| 실제 단계 | 라운드 |
|---|---:|
| 억제진 가동 | 1 |
| 고정구 유효 사격1회로 해제 | 2 |
| 억제 유지2회·안전 경고 후 종 하강1회 | 3 |
| 소단 누출혼 수습 | 8 |
| 종지기 비살상 제압·승리 | 10 |

종지기 교전은 R8~10(휘겸 S09, 설오 A01, 휘겸 S00, 설오 A01). 전투 적6명을 처치하고 멀리 남은5명은 생존한 채 완료했다. 증원2명은 R1에 실제 출현했다. 실제 R10 정산 전 HP는826/785/1384/1052, 4인 생존. R3 경고·R8 상호작용 뒤 실제 export/Continue도 수행했다.

컨트롤러는 기존 유한 사격 탐색/경로 graph와 목표 방향 전진 정책이다. 진행 중 actor 위치·HP·기력·이동도·목표 사실 강제 쓰기0, 회복 우회0, 소모품0. 새로운 전역 능력치 상향이나 무적은 없다. 목표 쪽으로 가기 위한 서쪽 하강 우회가 실제 포함되어 있으며 최단/사람 평균 플레이로 부르지 않는다. UI 결과의 0:00은 검사 clock 대체값으로 사람 클리어 시간이 아니다.

**실패도 보존했다.** 최신 적 근접 면제 적용 전 첫 시도는 R3에 소단 O04 아군 오사726으로 담허가 사망했다. Engine 피해를 없애지 않고 기존 S09의 격리 Engine 발사 안전 검사를 O04 입력 선택에도 재사용했다. 그 뒤 최신 상호작용 조건으로 새 시작한 위 사례가 R10에 끝났다. 승리 뒤 첫 정산 호출에서는 검사기의 live-write guard가 정상 성장 적용을 외부 쓰기로 오인했다. 정상 정산 호출을 production 경계로 감싼 뒤 **실제 R10 승리 저장에서 정산만 재개**했으며 전투를 다시 실행하거나 승리 플래그를 쓰지 않았다.

## 저장·집중 검수

1. 역할/기계/동선: 실제 새 시작R10, 담당 역할·정상 자원·동작 기록. 준비 fixture로 주변 적 생존 시 두 상호작용 허용/잘못된 역할 거절, 억제-고정구 선후 양쪽, 쓸림면 점유·행동 중 지연·중간 하강 저장 복구를 확인했다. 이것을 추가 정상 전투 완주로 세지 않았다.
2. 기존 저장/정산: 실제 구 R12/R22/R29/R45와 이미 승리한R54를 검사했다. version1의 인식된18장 미완료 목표만 이행하며 몸체/원래 위치/지형/HP·MP/턴/RNG/대사 cursor/완료 사실/성장·보상은 exact. 반복 Continue도 보존. R54 whole-battle exact이며 재보상하지 않는다. 옛 저장은 새 배치로 순간 이동시키지 않으므로 새 시작R10과 동일한 남은 이동 시간을 보장하지 않는다.
3. 실제 화면/흐름: 최종 생성 UI의 실제 시작·R3 하강 경고·390px R8 다음 목표를 확인했다. 실제 R10 저장의 whole-battle Continue exact, keeper beat와 outro 표시, 단일 정산,19장 R1 성장·장착 보존 및 Continue exact. 새 전투 재실행이나19장 플레이는 아니다.

별도 종합에서는 위 정상 입력과 fixture/최종 UI 결과를 대조했다. 타입·공통 build PASS, 기존 승인 시각과64충돌/27경로/다른29장 보존 PASS, opt-in author 재적용 멱등 PASS, 브라우저 오류/HTTP 실패0. 실제 성공 dd878·424c를 빌드 전 등록해 공개13그래프489파일과 구934 chapter13 JSON2개를 hash/길이로 보존했다. 미발행 후보를 성공 발행으로 등록하지 않았다. 전체30장/전역 verify/무관한 baseline 수리/긴 옛 구조 재실행은 하지 않았다.

## 실제 JPG

모두1MB 미만. 카메라·frame scheduling만 검사 목적으로 고정했다. 시작의 in-memory 기록은 첫 export 이전이라 Continue가 빈 `encounterDensity.existingWarnings={}` 하나를 추가한다. 그 외 전투 내용은 같고, R3/R8/R10 실제 export 저장은 whole-battle exact다.

- [시작: 억제진과 고정구](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-fifteen-rounds-20261022/screenshots/entry.jpg)
- [R3: 하강 안전 경고](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-fifteen-rounds-20261022/screenshots/lowering-warning.jpg)
- [모바일 R8: 다음 목표/종지기 방향](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-fifteen-rounds-20261022/screenshots/mobile-next-action.jpg)
- [실제 R10 완료 대사](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-fifteen-rounds-20261022/screenshots/actual-outro.jpg)
- [실제 단일 정산·10턴·전투불능0](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-fifteen-rounds-20261022/screenshots/actual-result.jpg)
- [19장 진입](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-fifteen-rounds-20261022/screenshots/actual-next-stage.jpg)

저장 비교는 [saved-contracts.json](saved-contracts.json), UI 흐름은 [outcome-browser.json](outcome-browser.json), 공개 보존은 [public-preservation.json](public-preservation.json). 입력 시뮬레이션 사례 하나로 모든 성장·난이도·의도적 대기·수동 오조작을15턴 이내라고 보장하지 않는다. 중단된 묵종 미술 a3b473 및 후속 후보는 포함하지 않았다. 부모가 새 SVG 시안에 사용자 승인을 받기 전 새 종을 넣지 않으며 현재 공개 미술·종 물리/기계를 유지한다.
