# 10장 소단 — 놓지 못한 밤: 당산나무와 의식 마당

2026-10-18. 승인9장 쉼터ee566fcdefba3f6f5075d75a81a1a1537457ca60을 master8b660c821ef7034a0cd9c2f76cd41da33bcc2918에 병합·push했다. 승인 tree와 같아 검증을 반복하지 않았고 Pages39169269197 해당 SHA/completed/success를 확인했다. 부모가21:55 UTC 공개9장 전투/쉼터의 실제 픽셀을 확인했다.9장 공개 확인은 완료이며 반복하지 않는다.

이 master에서 `art/stage10-guardian-location-paint-20261018`을 분기해10장 전투만 작업했다. 부모 미술 확인 전 master에 반영하지 않는다.10장 쉼터·11장은 미착수다.

## 한 형태의 나무·실제 상면·마당

-9장 나무를 확대하지 않고 네 개의 굵은 가지가 몸통에서 직접 갈라지는 새 한국 당산나무를 제작했다. source PNG를 보존하고 alpha 여백만 잘라1074×1436/774018bytes 외부WebP를 준비했다. 배치는x1920/y1090, 높이1400/너비1400×1074÷1436이며 가지와 몸통·뿌리는 같은 완성 원화 한 점이다. 가까운 나무는 blur 없이1회 색감 준비만 한다. 나무를 흔들지 않는다.
- 네 기존 ID altar-step-1/2/3/platform의 실제 one-way 상면은 원본 그림의 가지 윗선을 읽어 같은 source crop[6,5]/scale1400÷1436으로 저작했다. 별도 떠 있는 바위·잘린 bark strip·녹색 삼각 연결부는 그리지 않는다. 기본 점프 착지 예시는2380/2160.83→2580/2030.28→2400/1872.05→2560/1712.98이며 실제 나무 분기에 닿는다.
-5000×3900 및 Play Bounds를 유지한다. 중앙은 낮고 넓은 둥근 능선과2300높이의 의식 자리, 양쪽은 흙·자갈 길/회랑 기초로 연결된다. 뿌리 끝과 기초는 기존 단일 지면 앞면에 묻힌다. 실제 terrain에 clip한 흙/서로 다른 큰 암반/세 곳의 낮은 석재·이끼빛 구간을 쓰며 깊은 곳은 어둡게 감쇠한다. 가짜 외곽 skirt나 별도 걷는 면은 없다.
- 왼쪽은 새 온전한 열린 회랑1536×536/174108bytes, x1000/width760/foot2685다. 오른쪽은9장의 무너진 회랑을 x3420/width850/foot2685로 사용한다. 두 자산은 각각 원비율이며 기둥·석제 받침 사이가 열려 있다. 원화의 지붕 윗선을 실제 one-way로 저작했다. 기존 gallery-link ID는 같은 지붕 상면에 맞추고 중복 목재판을 그리지 않는다. 낮은 접근대만 실제 목재/뒤쪽 받침으로 지면에 연결한다.
- 옛 upperShrine/ritualDais/oldHall/guardian glyph는 새 opt-in에서 중복 표시하지 않는다. 요소/기능 ID와 기존 raw 재질·내구·oneWay 저항 계약은 보존하며 예전 visual-only 지지면 메타데이터도 새 땅으로 갱신한다. 소단·적 원본 디자인과 기존 날씨·물·받이진/실 연출은 유지한다.
- 원경은 같은 mountain-dusk를 좀 더 어둡고 낮은 대비로1회 준비해 act1BackdropFrame 계약으로 그린다. readiness가10장일 때만 forestFar/forestRock/forestSoil/guardianTree10/guardianHall10/ritualCorridor9를 요청한다. 새 RAF·모션·매 frame 필터는 없다. 공통 world cache와 visual debug toggle을 사용한다.

## 주박·협력·방어·저작/진행

- fresh narrativeRevision1의 두 받이진은 collected, hs.receivers=2로 시작한다. 재설치 과제를 만들지 않았다. 소단은x2500/y2300의 실제 의식 지면에 서며 원래 본체 보호와 비살상 규칙을 유지한다.
- 바깥 주박의 기존96×126 template/ward property와 fresh boss maxHP58% 내구도를 유지한다. 새 의식 공간의 아래 통행 여유를 위해 canonical author가x=boss.x-285/y=boss.y-240으로 둔다. 기존 fresh author는 이미 있는 descriptor를 다시 만들지 않고 prepareFresh가 동일58%를 적용한다. 실제3366/5803을 확인했다. boss HP를 줄여 협력을 유발하는 방식이 아니다.
- 기존 주박 해제→offering→대화 종료 accepted→side2 고정 channeler/ritual anchor→6번의 온전한 적 턴 방어 흐름과 대사를 유지한다. finaleSites westHall1650/2670, eastHall3550/2670은 실제 support를 사용하며 번갈아 습격한다. 초기 sodan-hounds raw2/runtime4, 첫 finale8/후속6, cap28·행동 상한·HP/XP/종류/AI·경고 순서는 그대로다.
- 새 처마에서 까마귀 한 몸이 겹친 국소 실패에 한해 mission.rush에10장 새 paint opt-in의 crow만 기존 requireFlightClearance 옵션을 전달했다. 기존288world 배치 범위·원자 생성·수·스케줄은 바꾸지 않고 기존 Terrain.place가 실제 비행 몸체 여유를 갖춘 가까운 위치를 고른다. 옛/사용자 정의 전투는 이 조건에 들어오지 않는다.
- 단독 stage10-location-paint author를 공통 build의 마지막 장별 저작 단계에 두고 canonical JSON에도 같은 함수를 적용한다. 원래 guardian-tree author는 미수정이며10장만 최종 opt-in한다. actual terrain·markers·ritual/receiver/altar/exit/westHall/eastHall anchors·원본 spawn과 legacy visual supports를 함께 갱신했다. 다른29장 JSON/library, main/current-stage loader/web-build와1~9장 동작은 바꾸지 않았다.
- 전역 mapRevision20은 유지하고10장 campaign map revision만1이다. 이전 진행 중10장 전투만 입구330으로 재시작하며 성장/SP/장착·클리어를 보존한다.

## 최소 확인과 증거의 범위

build·소스 구문/공백과 실제 Chromium1440×900 전체/나무·의식 자리 및390×844 모바일3뷰를 확인했다. 카메라만 옮겼고 배우 pose는 사진용으로 강제 변경하지 않았다. pageerror0, receivers2/초기 보호/실제 주박 존재, picture3/far1/beam1/filter4가 정적3frame 동안 불변이다.

국소 생산 App/Engine fixture에서 적을 제외한 기본 설오로 아래 길의 걷기, 양쪽 회랑 각2번의 일반 점프, 실제 네 가지에4번의 일반 점프로 착지했다. 이동 예산은 여러 이동 턴을 가정해 갱신하며 시작점 한 번 외에 좌표 보정은 없다. 자동 walker가 발판 끝을 걸어 나가거나85world 차이에 점프를 누르지 않던 입력은 명시된 일반 점프 순서로 맞췄다. 지형을 검사 통과용으로 순간 이동시키지 않았다. 통과한 아래 길/각 접근 로그를 단계별 보존하고 이후 반복하지 않았다.

초기20몸체와 의식 아래 설오/휘겸 여유를 확인했다. 초기 sodan-hounds 실제4명과 finale의 실제8+6×5 배치를 기존 spawn 코드로 생성해 지상 접지/비행 여유를 확인했다. 까마귀의 첫 처마 겹침은 위의 한정된 배치 옵션으로 해결하고 그 관련 finale만 다시 확인했다.

명시 actor boundary·주박에 대한 damage·적 턴 종료 counter fixture에서 본체 HP 보호, 주박58%/해제, 실제 협력 대화 accepted 뒤의 side2 channeler 전환과 의식 지면을 확인했다. 매 적 턴 경계 전에 적 무리를 정리한 fixture이며5번째 경계까지 complete=false/6번째만 true, 원래6개 wave 기록을 확인했다. 실제 AI 전투 여섯 턴을 정상 플레이로 완주했다는 증거는 아니다. DOM/Canvas/시간 스케줄은 double이다.

옛10장 저장 한 건의 XP17을 추가한 Continue fixture에서 revision0→1/입구330 재시작과 XP/SP/loadout/clears 보존을 확인했다. 최종 source idempotence/다른29장 불변은 정적 비교다. 전체 전투·모든 기예·30장/전체 verify·다른 장 검사 묶음은 하지 않았다.

증거 `_local/reports/stage10-location-paint/{build.log,render-checks.json,verification-summary.json,static-checks.json,bodies-checks.json,route-*-checks.json,initial-event-checks.json,finale-checks.json,save-checks.json,library.json}`. 관련 실패 로그도 보존한다.

## Library 실제 화면

- stage10-overview.png: `libfile_2ea4b6609c88819195c37c34ec986ed7`, version0
- stage10-tree-ritual.png: `libfile_85db8352b36081919d7fa05ea683b311`, version0
- stage10-mobile-tree.png: `libfile_1ac95892ebe4819185ffc23f91685bf2`, version0
