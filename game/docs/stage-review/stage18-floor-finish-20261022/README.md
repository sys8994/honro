# 18장 묵종 바닥·천장 미술 후보

브랜치 `art/stage18-floor-finish-20261022`, 기준 공개 `793a9a953d6f82038d44dc44b51ea5a01ce996c4`. **부모 미술 판단 대기**이며 master/Pages는 변경하지 않았다.

- 최종 미술 소스·생성물: `f420f2ff03689363b4a4aebc1b35714c2a6f1026`
- 최종 QA 포함 코드·검사·모든 최종 캡처: `af25a4ea34075bffbde4c026b903d5b34662d439`의 clean 작업 트리. f420 이후 미술/생성물은 불변이며 캡처 검사만 교정했다.
- 현재 entry: `web/entries/game.2e5ecd617e4248ee.js`

[최종 종 아래](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-under-bell.jpg) · [전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-overview.jpg) · [중앙 실제 UI](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-center.jpg) · [모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-mobile.jpg)

## SOP 보존 카드

2막8장 묵종,**현재13600×9600/65지형/27경로**. 입구→억제진/서쪽 꺾인 길→거대 청동 묵종/내부 단면→종 아래/동쪽 통로를 보존한다. 변경은 act2-floor와 실제 전체 화면에서 빈 면이 확인된 cave-roof의 공통 정적 terrainPlanes/저작 metadata뿐이다. 낮은 대비의 중간 층리·엇갈린 파단/소수 짧은 절리를 연결했다. 종·곡선 공명·억제진/고정구/사슬·하강 기계와 기존 유한 발판/자연 암반 앞면·Library·원경은 교체하지 않았다.

65충돌/27경로·모든 anchor/actor/marker·목표/대사/밸런스·종 하강/접촉/쓸림면/기계·저장 초기 동작과 타29장·카메라는 exact 유지한다.17장 새 route anchor와15–17 승인 미술도 보존한다. 미세 텍스처/타일/과도한 대비·매프레임 생성/전역 렌더러·물리 변경/새 게임플레이는 없다. 별도 진단 후보와 최신 master를 중간 병합하지 않았다.

## 실제 기준·발행 보존

부모 지시에 따라 Library 원본 전송을 반복하지 않았다. **부모 PNG를 직접 본 것으로 기록하지 않는다.** 같은793a 게임 entry4fd156b0f594da4a의 실제 UI로18장 입장→대화 넘기기→휠2회→가로팬을 수행하고 [기준 중앙](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/before-center.jpg)·[전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/before-overview.jpg)·[종 아래](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/before-under-bell.jpg)를 직접 열었다. 청동 곡면·내부 단면/주변 고유 암반은 보존할 장점이고, 종 아래의 큰 파란 단색 띠가 수정 대상이었다. 최종 중앙은 같은 절차/배율이며 follow·애니메이션 소수점 차이가 있어 픽셀 hash 일치를 주장하지 않는다.

빌드 전에 실제 성공793a/[Pages39858691582](https://github.com/sys8994/honro/actions/runs/39858691582)/부모 확인 updated_at `2026-10-22T21:38:56Z`를 등록했다. graph SHA256 `b5c3b3efc9092232d1f5154dfe83a35e34f6a1098b69783578dc969e7120cbe1`, 원본/현재 검증·복원0. 최근7일 전체+최소2개와 구934 chapter13 JSON2개를 보호하며 미발행 후보를 성공 발행으로 등록하지 않았다.

## 공유 저작 처리

17장 안의 정적 단면 mesh 계산을 기존 `authored-rock-planes.mjs`의 `appendSectionRock`으로 옮겨18장이 재사용했다. 각 장의 좌표/팔레트·고유 데이터는 그대로다. 기존15/16 보존 검사를 유지하며793a의15–17 **전체 campaign JSON 바이트 재현·멱등/현재 승인 장·교정17 route exact**도 추가 확인했다. 새 runtime/렌더러 모듈은 없고 전체 Act2 recipe도 재실행하지 않았다. 첫 저작 guard가 저장 전 깊은 row 경계 교차를 검출해 해당 좌표를 바로잡았다.

## 3집중과 별도 종합

| 회차 | 직접 본 발견·교정 | 최종 확인·남은 특징 |
| --- | --- | --- |
|1 입구/억제진/종 하부/동쪽·연속성 | 기준의 단색 띠를 공유 모암으로 저작하고 전체/종 아래·입구를 직접 열었다. | 원래 종/곡선 암반·기계·꺾인 발판의 구도와 보행선은 유지된다. 천장은 종보다 낮은 대비다. |
|2 근접 보행/발판·인물/종 상태 | 종 아래 첫 층 두 면이 세로로 길어 보여 그 안에만 약한 공유 파단을 넣었다. 실제 근접/매달림·100하강·200안착 표본을 직접 열었다. | 기존 발판/인물·종의 단면/접촉 여백이 읽힌다. 상태는 기존 테스트 방식의 강제 렌더 fixture이며 자연 전투/안전 하강 통과가 아니다. |
|3 모바일 기본/최소·실제 외곽 | 실제 기본 카메라x827부근이 첫 예상보다 오른쪽이어서 넓은 입구 면이 남았다. 그 면 안에 얕은 파단을 이어 교정했다.390×844 기본 .82/최소 .098465·x−320/13920·하단y9840을 실제 UI로 확인했다. | 외곽 수직 재질 시작선/빈 연장부는 발견하지 않았다. 깊은 곳과 일부 가까운 모암에는 큰 저대비 면을 남겼다. 실기기 검증은 아니다. |
|별도 종합 | 최종 clean af25의 새 UI 입장/중앙·전체/종 아래와 근접·모바일·3종 상태를 다시 촬영하고 직접 열어 앞 수정의 회귀를 확인했다. | 후보로 인계한다. 자동 assertion/면 수는 미술 승인을 대신하지 않으며 부모의 최종 픽셀 판단이 남는다. |

최종 `final2-structure`6장/`final2-contact`7장/`final2-mobile`6장/`final2-whole`6장은 모두 af25a4ea의 **같은 clean 작업 트리**, JS/HTTP 오류0이다. 상태·배우·카메라/sourceHashes·캐시 표본은 각 capture.json에 있다. 자동 원자료는 `_local/reports/stage18-floor-finish/`에만 두고 Git에는 기준3장·최종 선택11장만 보존한다. 각 JPG는1MB 미만이다.

전체 고정뷰1440×900 `(6800,4800,.09)`, 종 아래 `(7400,7500,.35)`, 종 상태 비교 `(7350,6900,.3)`은 별도 저작 검수 카메라다. 실제 UI 중앙은1180×757·휠2회 후x7400 부근의 가로팬이다. 게임 카메라/한계값은 변경하지 않았다.

## 변경 범위 검사와 상태 표본

- `npm run build`, `npm --prefix game run typecheck`, `node tests/stage18-floor-finish.mjs`, `node tests/authored-rock-planes-preservation.mjs` 통과. 빌드 입력/생성물은 f420, 타입은 같은 TS/runtime bytes의8357에서 통과했고 최종 native/저작 보존 검사는 af25에서 재실행했다. 로그 `/tmp/stage18-build-final.log`, `/tmp/stage18-type-final.log`, `/tmp/stage18-check-final.log`, `/tmp/stage18-shared-final.log`.
- 허용18 시각 필드/metadata만 정규화한 **전체 프로젝트 deep-equal**. 보호 project SHA256 `d3c110a23efb08b00627b1e7fde880ad73fe6eb627fb7f073c4be7e0294ade7f`.65충돌/27경로/모든 anchor·actor·marker/목표·원고·저장 초기 계약·종/기계·기존 Library/타29장·전역 runtime/main/renderer/물리 bytes 불변.
- 원래 유한 지형/종/발판 재질 exact, 저작 재현·멱등/전체 solid coverage·현재 생성 chapter18의 전체 비미술 exact. 생성 chapter17의 교정 route/anchor도 exact다.
- 공통 prepare 재사용/sceneVersion 무효화,3회 반복 재질 draw 신규Path2D0·battle JSON/Canvas 순수성 통과. 매달림/하강100/안착200의 원본 배우 exact·793a 같은 초기화/session의 전체 비미술 상태 exact·반복 캐시/순수성도 통과했다. 브라우저 실제 Scene도 각 fixture의 렌더 전후 JSON 불변을 통과했다. draw 비용0/초기 준비 비용 동일/성능 개선을 뜻하지 않으며 ms/FPS는 미측정이다.
- 기존18 traversal을 선택 실행: entry-under-bell·under-bell-keeper 각각 initial/settled 접근·귀환4개, settled-inner-east-shortcut의 settled 접근1개와 initial 실제 차단1개, archer1체형만 확인해6케이스 기대대로 무피해였다. 적 제거·시작점 배치·이동력 충전의 격리 물리 검사이며 정상 전투/27경로 전체 검사가 아니다. 새 경로 실패는 관측하지 않았다. 원자료 `routes/{under,east,shortcut}.log`.
- 공개11그래프479고유 immutable 파일을 실제 hash/길이로 확인했고 구934 `chapter-13-assets.1387b6a1f088fc74.json`/`chapter-13.516170b245a8b075.json`도 보존했다. 보호 파일 삭제/변조0. 빌드가 정리한 파일은 미발행 중간 후보뿐이다.

상태 fixture는 기존 `stage18-bell-traversal.mjs`의 production `HonroStage18Bell.shift` 방식을 재사용한다. 원래 배우는 한 명도 옮기지 않고, cloned 실제 모델을0/100/200으로 그린다. 선행 목표/쓸림 점유·안전 행동 경계·자연 하강/전투·Continue 통과 증거가 아니다. Canvas는 강제 상태이고 HUD는 원래 입장의 표시일 수 있다.

최초 QA 이식에17 전용 release-helper import가 남아 실행 실패한 것은18 전용 strict 시각 정규화로 교정했다. 또한8357 캡처는 화면 변위가 맞아도 메타데이터가원본 engine을 읽어 전부0이 되는 오류가 있었다. 실제 fixture engine의 offset/status를 assert하도록 도구만 고치고 af25에서 모든 최종 증거를 다시 맞췄다. **8357/기존 final 캡처는 최종 상태 근거로 쓰지 않는다.** af25의 final2 상태 메타데이터는 정확히0/100/200이며 Scene 순수성도 통과했다. 게임/미술/생성물은 이 QA 교정으로 변하지 않았다.

## 사진·완료 경계

[기준 종 아래](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/before-under-bell.jpg) → [최종 종 아래](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-under-bell.jpg), [전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-overview.jpg), [실제 UI 중앙](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-center.jpg), [매달림](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-suspended.jpg)/[강제 하강100](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-lowering-fixture.jpg)/[강제 안착200](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-settled-fixture.jpg), [모바일 기본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-mobile-entry.jpg)/[중앙](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-mobile.jpg)/[왼쪽](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-mobile-left.jpg)/[오른쪽](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-mobile-right.jpg)/[아래](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage18-floor-finish-20261022/review/stage18-final-mobile-lower.jpg).

구현/커밋·푸시에 남은 차단은 없다. 전체30장/verify·정상18 전투 완주·쓸림 안전/자연 하강·저장·19장 입장·무관한 실패 수리는 하지 않았다. 별도 게임플레이 진단/최신 master 중간 병합·새 장 작업도 하지 않았다. 부모 최종 미술 판단과 이후 최신 게임플레이 보존 통합/공개 검수가 남는다. 통합 시 최신 campaign 전체를793a로 덮지 말고18 시각 필드와 공유 author 출력 보존만 적용해야 한다.
