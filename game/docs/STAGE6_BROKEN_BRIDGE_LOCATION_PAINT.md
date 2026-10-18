# 6장 끊어진 나무다리 — 지형·회화, 2026-10-18

부모가 승인한 5장 쉼터 `98865076`을 최신 master `f26dc1eaa30eb534c208b5450240cd78a5b1b4f6`에 병합·push했고 [Pages run39154938816](https://github.com/sys8994/honro/actions/runs/39154938816)의 해당 SHA/completed/success를 확인했다. 승인 tree와 병합 tree가 같아 기존 검증과 빌드를 반복하지 않았다. 부모의 공개 Pages 브라우저에서4장/5장 쉼터와5장 전투의 새 미술 확인도 완료했다고 전달받았으므로 해당 접속을 반복하지 않았다.

6장 전투는 위 master에서 분기한 `art/stage6-broken-bridge-location-paint-20261018`의 별도 검토 단위다. 부모 실제3뷰 승인 후 `e4be8cd2`를 master `cb8f4a8d09d2d4df5af9f00dadcbb918988dc042`에 병합·push했고 Pages run39156677078의 completed/success를 확인했다. 승인 tree가 같아 기존 검증은 반복하지 않았다. 6장 쉼터는 후속 별도 검토 단위이며7장은 미착수다.

## 새 장소와 실제 경로

- production canonical 6600×3800을 유지한다. 하부 길은 들머리 y2600에서 중앙 y2820, 북문 y2540으로 완만하게 이어지는 실제 하나의 확장 polygon이다. 기존 깊은 V자 지형을 낮췄으며 이동·호송·낙사 범위를 확장하지 않는다. 바닥 위에 가짜 collision skirt를 만들지 않았다.
- 온전한 목교 한 점을 먼저 제작했다. 굵은 종방향 들보·사재·석재 교각·비틀어진 난간과 두 좁은 파손부가 연결된 2172×400 외부 WebP다. world x1450/y2158, width3500/height644.567…로 균일 축척하며 재료 strip으로 교량 전체를 늘이지 않는다. source PNG의 투명 상하 여백만 pipeline에서 잘라 쓴다.
- 실제 bridge-west/mid/east one-way의 walking edge를 이 그림의 앞쪽 교판 상면에서 측정했다. 두 끊긴 구간은 약100 world 정도로 일반 도약이 가능하다. 중간 교판도 실제 접근 가능한 선택 사격 위치다. 난간·사재와 뒤쪽 교각은 추가 발판이나 막힌 벽으로 만들지 않는다.
- 교각 기초는 실제 흙길의 낮은 둔덕에 닿는다. 하부 길은 교각의 앞쪽을 지나는 연속 호송로다. 이전 pier-west/east의 얇은 공중 one-way 기둥과 공통 renderer의 겹치는 가는 받침을 제거하고, 그림 자체의 원래 교각을 사용한다.
- 서쪽에는 서로 다른 길이·기울기의 두 부러진 목재, 동쪽에는 두 잔해 상면이 상부로 연결된다. 모두 one-way이고 실제 형태 안에 같은 목교의 목재 grain을 그린다. 잔해 아래의 작은 경사 받침은 뒤쪽 장식이며 바닥을 막지 않는다. 첫 잔해와 출구 가지는 하부 보행 몸체가 겹치지 않도록 높였다.
- 하부는 얇은 젖은 흙·자갈 층과 세 군락의 낮은 암면, 어두워지는 깊이로 구성한다. 동일한 큰 암반 벽을 연속 반복하지 않는다. 기존 작은 수로는 얕은 물길 흔적으로 맞추고 기존 물/날씨 renderer를 사용한다. 새 모션은 없다.
- 옛 refugeeCarts/bell/임시 집·교량 rigging·과밀 소나무의 시각을 숨긴다. objective의 원본 stretcher, ally-ropeguard, midboss-stage6 및 설오·담허·휘겸의 원본 그림·기능은 그대로다. 퀘스트 참조가 없는 place6-west/east-rock 두 장식 collider는 새 호송 길을 가로막으므로 제거했다. 출구 정적 소나무는 한 그루이며 뿌리를 실제 경사에 매몰하고 별도 실제 가지를 연결했다.

## 저작·배치와 저장

- authoritative 함수는 `tools/map-forge/stage6-broken-bridge.mjs`, 적용 CLI와 `shared/data/campaign.json`이다. common build도 같은 함수를 호출하며 재적용은 idempotent다. `stage6-location-art.js`는 새6장에만 활성화된다. `act1-spatial-art.js`에는 새6장 renderer가 준비된 경우 옛 받침을 중복 그리지 않는 좁은 guard만 추가했다.
- 초기 지상 군집은 교각 아래와 운반대 동쪽의 호송 위협으로 나누고, 날짐승은 세 교판 위 열린 공간에 둔다. 기존 AI·기예·HP/XP·정예·ID·수와 행동 상한을 바꾸지 않는다. 일반 적20 + 교각귀1이며 플레이어는 설오/담허/휘겸이다. objective HP1850을 보존한다.
- bridge-crows/bridge-boars/pursuit의 ID·조건·수·텍스트는 유지하고 spawn x/y·지지면·간격·여유 범위만 새 장소로 맞춘다. pursuit는 구조 뒤 운반대 뒤쪽 하부 길에서 따라붙는 위치다. 기존 encounter doubling에 따른 실제 각4마리는 기존 정책이며 이번 증량이 아니다.
- 운반대는 원래 x4100의 작은 하부 구조 공간에 있고, 구조 후 선두를 따라 `HonroWorld.top`으로 지면을 잡는다. midboss-stage6 제압과 exit6380 의미를 유지한다. 전역 revision20은 그대로, Stage6 campaign map revision만1이다. 이전 진행 중6장만 입구x330에서 재시작하며 성장·SP·장착·클리어를 보존한다.
- 현재장 우선 main/loader/web-build,1~5장 canonical 및 기존 쉼터/스킬/AI 구현은 미수정이다. 공유 원경은 한 번 저채도·저대비로 준비하고 새 bridge6는6장 진입에서만1회 요청한다. 다른5장/4장 소재 요청0이다.

## 실제 확인 범위

필요한 `npm run build`, 원본 구문·공백 검사, 실제 Chromium 1440×900 전체 목교/운반대 지점과390×844 모바일3뷰를 직접 확인했다. 모바일은 실제 중간 교판에 설오를 놓아 발/그림 정렬을 보는 명시적 pose fixture다. 정상 전투 완료의 증거가 아니다. pageerror0, 정적 렌더 battle JSON 불변. 고정 카메라12프레임에서 pictures2/paths0/far1/filterPasses3은 불변이다. 필터는 소재/원경 준비에만 있으며 매 프레임 필터나 무한 cache/새 RAF가 없다.

Native production App/Engine의 국소 fixture:

- 서쪽 잔해2개 일반 걷기/도약 진입 비용585.66, 동쪽 진입594.51로 각각 배우 행동 예산 안이다. 두 파손부의 일반 도약 비용268.17/271.34, 실제 중간·동쪽 교판 지지면 착지 확인.
- 하부 x330→6380을 기본 걷기로 통과했다. 짧은 구간마다 행동 예산을 재설정한 이동 진단이며 전체 한 턴 이동·정상 전투 플레이를 주장하지 않는다. 마지막 교각 접지/첫 잔해 높이 조정 뒤에는 영향받은 진입·하부 걷기·스폰만 다시 확인했다. 실제 one-way underside와 물리 몸체 머리 사이 최소 여유9.69 world를 확인했다.
- 출구 소나무 가지는 기본 수직 도약1회/비용75로 실제 지지면에 착지했다.
- 초기 적과 세 이벤트를 직접 spawn한 국소 fixture에서 solid 지형 내부 몸체 샘플0, 각 wave4마리 확인. 유한 이벤트 전체 스케줄/실제 AI 전투 턴을 플레이한 증거는 아니다.
- production rescue 판정으로 구조 후 운반대가 x4121.6→6260까지 기존 선두 추종으로 이동하고 매 step 하부 길의 높이와 일치했다. 교각귀가 살아 있으면 출구 미완료, 명시적 boss-dead predicate fixture에서는 구조한 운반대의 exit 도달 완료. 정상 전체 전투 완료와 구분한다. 최종 접지 조정은 구조 위치x4100 서쪽이며 구조 후 동쪽 호송 구간은 그대로다.
- 이전 실제6장 canonical 저장의 production discard/Continue에서 map revision0→1 및 입구x330 재시작, 획득 XP+17·성장/SP·장착·clears 보존을 확인했다. 다른 모든 장 canonical, 원본 유닛의 위치 외 능력 필드, 이벤트 조건·수·내러티브·목표 불변을 정적으로 비교했다.

전체 전투 플레이·전체 스킬/30장 순회/전체 verify는 실행하지 않았다. 증거는 `_local/reports/stage6-broken-bridge/`의 build.log, render-checks.json, local-checks.json, finish-local-checks.json, branch-check.json과 해당 국소 스크립트에 있다. 기존 검사 결과를 불필요하게 반복하지 않았다.

## Library 실제 화면

| 화면 | Library ID | 버전 |
| --- | --- | --- |
| 전체 목교·하부 길 | `libfile_d66b22cc3f78819191cde24c2465e06e` | v0 |
| 교각귀·운반대의 하부 구조 공간 | `libfile_9c69fcc9d4c081919b312e410b50c462` | v0 |
| 모바일 중간 교판 pose fixture | `libfile_d785c3d71f4c819193917a3a07293910` | v0 |

후속 미술 수정은 같은 ID를 교체한다. 부모 실제 화면 승인 후 위 master/Pages에 반영했다. 공개 실제 화면 확인은 부모가 담당한다.
