# 7장 살아 있는 사람을 꺼내는 법 — 산비탈 거처 회화·지형

2026-10-18. 승인된6장 쉼터 `1f07a815`를 master `517da2e9517b6be4f132ca87388a3393f5532db2`에 병합·push했고 [Pages run39157354005](https://github.com/sys8994/honro/actions/runs/39157354005)의 completed/success를 확인했다. 승인 tree가 같아 기존 전투/쉼터 검증은 반복하지 않았다. 이 master에서 `art/stage7-root-village-location-paint-20261018`을 분기했다. 이번 검토 단위는7장 전투뿐이다. 부모의 실제 화면 승인 전 master에 병합하거나 배포하지 않는다. 7장 쉼터/8장은 미착수다.

## 장소와 실제 지형

- 3600×5000 월드에서 옛 공중 목재 tier/zigzag ramp를 실제 하나의 산비탈 `village-hill`로 바꿨다. 낮은 흙마당 y4300, 가운데 암반 마당 y3500, 위 당집 마당 y2650이 기본 보행 경사로 연결된다. 아래 y4650 `root-floor`는 낙하를 받으며 두 정적 one-way 뿌리로 원래 길에 돌아올 수 있다. 실제 polygon과 렌더 clip이 같고 그림 전체를 레벨 바닥으로 쓰지 않는다.
- 연결된 밑동·뿌리·갈라진 큰 줄기를 가진 느티 고목 한 점과 온전한 한옥 한 점을 새로 제작했다. source PNG를 보존하고 `tools/environment/stage7-assets.py`로 투명 여백만 잘라 비율을 유지한 외부 WebP로 준비한다. 고목1073×1427/812178 bytes, 아래 집1200×672/299164 bytes. 7장 진입 때만 요청한다. 가운데는 기존 온전한 나루 작업채, 위는 기존 한국식 당집 그림을 재사용한다.
- 아래 집/가운데 작업채/위 당집은 각 실제 평탄부에 기초를 붙인다. 건물 몸체는 장식이며 벽 collider가 아니다. 원래 그림의 지붕 실루엣을 읽은 별도 one-way 상면만 밟는다. 서쪽 뿌리/가운데 갈래/위 처마 곁 lookout도 실제 one-way이며 같은 고목 몸통에서 준비한 bark 소재로 그린다.
- 산비탈 표면은 얇은 흙·이끼, 서로 다른 크기의 암면 네 군락, 어두운 깊이로 이어진다. 밝은 외곽선 대신 실제 상면의 흙과 암반 명암으로 경계를 읽는다. 저채도·저대비 공유 산 원경은 `act1BackdropFrame`을 사용해1회 준비한다. 고목 전체·원경·집에 새 흔들림은 없다. 기존 날씨/물 구현을 보존한다.
- 옛 rootHut/hollowRoot/rootShrine 등 중복 장식 그림과 주민/서식지의 fallback 집 glyph만 숨긴다. 실제 주민 몸체·이름표·상호작용 marker는 남긴다. 기존 element ID와 퀘스트 참조는 보존하며 장식 collision이 추가되지 않는다.

## 게임 규칙과 저장

- 저작은 `tools/map-forge/stage7-root-village.mjs`와 적용 CLI, canonical JSON이며 build도 같은 idempotent 함수를 쓴다. `stage7-location-art.js`는 새7장 디자인에만 활성화된다. 새7장에 대해 옛 act1 scene 재저작을 건너뛰고, reentry의 두 실제 뿌리 recipe를 exact canonical fingerprint일 때만 복구한다. 과거/사용자 정의 지형은 바꾸지 않는다.
- 덕수/월이/칠복의 원본·HP600·이름·대사·각 resident target·세 번 구조 의미를 보존한다. 초기 적11마리가 기존 encounter doubling에 따라 실제22마리가 되는 정책도 유지한다. 아래 마당/지붕, 가운데 처마, 위 당집/공중으로 지원면과 좌표만 재배치한다.
- `yard-hounds`와 `upper-crows`의 ID·조건·종류·수·텍스트를 유지한다. 기존 정책상 각4마리다. 들개를 경사면이 아닌 아래 평탄 마당으로 옮겨 몸체가 땅에 끼지 않게 했고, 까마귀는 비행 몸체 여유를 요구하는 공간 배치만 한다. AI·행동 상한·기예·HP/XP는 변경하지 않는다.
- `rescue3`의 기존 실제 target 거리/높이 판정, 구조 후 shield60/해결 상태, count≥3와 그 뒤2턴 안정화 규칙을 그대로 쓴다. 이번 변경으로 목표의 의미를 단축하지 않는다.
- 전역 mapRevision20을 유지하고 Stage7 campaign revision만1로 올렸다. 이전 진행 중7장 전투만 입구x100에서 다시 시작하며 성장·SP·장착·클리어는 보존한다. 다른 장 canonical, 현재장 우선 main/loader/web-build와 스타트업 최적화는 변경하지 않는다.

## 실제 확인 범위와 한계

`npm run build`, 변경 JS 구문/소스 공백 검사, Chromium1440×900 전체 마을·가운데 암반 마당 및390×844 위 당집3뷰를 직접 확인했다. 카메라만 옮겼고 배우를 다른 발판에 강제 배치하지 않았다. pageerror0, 12개 고정 카메라 프레임에서 battle JSON 불변, 준비 cache는 pictures4/far1/bark1/filterPasses5로 불변, villageTree7 요청1회 및 무관4/5장 구조 요청0이다. 렌더 hook은 새 RAF를 만들지 않으며 필터는 준비 canvas에만 적용한다.

생산 App/gameplay를 불러오는 국소 fixture에서 적을 제외하고 기본 걷기·도약으로 아래→가운데→위 주민, 세 선택 사격 뿌리와 각 one-way 지붕, 실제 아래 낙하→두 뿌리 재진입을 확인했다. 구간마다 일반 턴 이동 예산을 새로 부여했으며 전체 전투 성공을 증명하는 테스트는 아니다. 실제 상호작용 eligibility/use로 덕수→월이→칠복의 collected/shield/해결/count1/2/3 및 count3 전 objectiveReady 차단·후 허용, 기존 안정화 차단을 확인했다. 초기22마리와 해당2개 증원 각4마리의 solid 몸체 겹침 없음, exact reentry 복구, 이전 실제7장 저장에서 XP+17/SP/장착/클리어 보존과 Continue 재시작을 확인했다. 다른 장 JSON/원본 unit stats 불변과 저작 재적용 동일성은 데이터 비교만 했다. 전체 전투/기예/30장 실행/전체 verify는 하지 않았다.

상세 증거는 `_local/reports/stage7-root-village/{build.log,local-checks.json,render-checks.json,library.json}`과 실제 PNG3장이다. Library 신원은 아래에 기록한다.

## 6장 쉼터 공개 화면 차이 확인

부모가 공개 Pages에서 옛6장 쉼터를 봤다고 알려, 배포 성공 외에 `517da2e`의 실제 산출물을 검사했다. `HONRO.html` → `web/entries/game.86b211186bc25929.js` → `shared-runtime-journey-art.cc603a73d9655606.js` / `shared-runtime-rest-journey.f98246a19878a958.js`가 직접 연결된다. 해당 art에는 `paintedRest6`, stage6 dispatch와 `bridge-approach-end-and-abutment`가 포함되고 rest는 실제 place.stageId를 넘긴다. 배포 후 이 쉼터 소스는 변경되지 않았다. 실제 로컬 디버그 지도에서6장 선택을 클릭한 결과 `debugRestStage:6`, 제목 ‘나무다리 위 길목’, `data-journey-art:stage6-painted`, bridge manifest 존재를 확인했다. `_local/reports/rest-stage6-location-paint/deploy-artifact-check.json`에 기록했다. 이 실행 환경의 공개 Pages HTTP 요청은 tunnel403으로 차단되므로 공개 UI를 재확인했다고 주장하지 않는다. 공개 화면 차이의 원인은 아직 확정하지 못했으며 부모의 URL/진입 파일 확인이 남는다.

## Library 실제 화면

- stage7-village-overview.png: `libfile_a5069b9cf1a481918641db5352559ab5`, version0
- stage7-middle-court.png: `libfile_272400538ad08191a2ebfad26cf9fff2`, version0
- stage7-mobile.png: `libfile_8de07ff28f40819188097b85e8b9ad69`, version0
