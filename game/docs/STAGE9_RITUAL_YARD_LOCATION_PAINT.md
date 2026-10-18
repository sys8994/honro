# 9장 바람 없는 마당 — 낮은 우물마당·무너진 회랑·문간

2026-10-18. 부모가 공개8장 전투/쉼터를21:14 UTC 확인했다.8장 쉼터 접지 보정6b4464a9c645922bdcca13c0bb00cbe8a4c3354e는 masterf21b0e035467aea18e9e52ebc77f7e16a1307ed3에 병합·push됐고 Pages39166221479의 해당 SHA/completed/success를 확인했다. 이번9장은 이 master에서 분기한 `art/stage9-ritual-yard-location-paint-20261018`의 전투만이다. 부모 미술 검토 전9장을 master에 반영하지 않는다.9장 쉼터·10장은 미착수다.

## 장소·지형·미술

- 기존3600×3500 전장을 유지한다. 마당을 낮은 수평 구도로 두고 서쪽 받이진850/2570, 우물1800/2485, 동쪽 받이진2800/2380 주변을 평탄하게 잇는다. 흙·자갈과 닳은 얕은 석재 구간, 몇 개의 이끼/풀빛 둔덕을 큰 면으로 나눈다. 깊은 지면은 큰 암반에서 어둡게 감쇠한다. 표면은 실제 polygon에 clip하며 새 밝은 외곽선을 추가하지 않는다.
- 새로 제작한 회랑은 전체 목조 기둥/석제 받침과 파손된 기와지붕이 있는 열린 한국식 구조다. 외부WebP1536×486/154162bytes를 원비율900×284.765625, x550/foot2580에 둔다. 세 받침은 기존 흙에 조금 묻히고 기둥 사이 아래 통행은 막지 않는다. 지붕 최상부의 실제 외곽을 one-way로 저작했다. 서쪽 접근·귀환은 실제 부러진 목재 경사에서 흙에 닿는다.
- 동쪽은 정적 고목의 밑동과 기존 돌 어깨/수피 우회로를 함께 읽는다. 두 경사 끝은 실제 지면에 연결한다. 상면과 넓은 마디 아래 형태는 실제 polygon이며 새 움직임/추가 보행면을 그림에만 넣지 않는다. 동쪽 루프는 암괴를 뿌리가 감싼 자연 갈래 전체 WebP1536×442/129456bytes로 그린다. 하나의 source를 한 번만 소비하는 고정1536×700 cache에 기존 joined 상면을 맞추고, 원래 그림의 마디/갈래/안쪽 빈 공간을 이어 둔다. 반복 수피 카드·기존 삼각 접합면·사각 암판을 그리지 않는다. 아래 경로와 받이진 앞은 비운다.
- 동쪽 문간은 전체WebP1152×622/236736bytes, 원비율760×410.347222..., x2920/foot2403의 낮은 돌담을 갖춘 출입구 한 점이다. 실제 밟을 수 있는 지붕만 one-way이고 문짝/돌담/기둥은 뒤 평면이다. 소단의 문턱 보행3274..3560은 같은y2390 지면으로 잇는다. 문간의 붉은 실은 한 줄만이며 기존 실제 소단/받이진 연출이 그대로 이어진다.
- 마른 우물은 사람 크기의 낮은 돌테두리/어두운 빈 내부로 표시한다. 기존 well/incenseYard, oldHall, receiver 및 habitat 기능 ID를 남기고 새 opt-in renderer에서 기존 중복 그림만 생략한다. 별도 큰 종이/문자/장식 군중은 없다.
- mountain-dusk는 같은 공유 자산 한 장을 낮은 대비/채도로1회 준비해 act1BackdropFrame 계약으로 그린다. 나무와 건축은 정적이며 기존 날씨·배우·받이진/실 연출을 보존한다. 새 RAF/환경 모션/프레임별 filter는 없다. world cache와 고정 사진/원경/수피/목재 canvas를 쓴다.

## 저작·스토리·진행 계약

- shared Stage9/13 tactical 저작기는 바꾸지 않는다. `stage9-location-paint.mjs`가 공통 author 뒤에9장만 opt-in하고 canonical JSON에도 동일하게 적용된다. 기존13장 및 다른29장 JSON/library는 불변이다. 실제 terrain과 tacticalRoutes/support/markers/anchors/actor·enemy 접지 위치를 함께 갱신했다. 원본 route ID와 양방향/일반이동 의미는 유지한다.
- receiver-west/east action=receiver, hs.receivers 두 진 목표/안정화/클리어/대사는 그대로다. 기존 초기 raw12명과 runtime density 편성, stats/HP/XP/AI/역할·encounters/초기상태를 바꾸지 않았다. 기존3+3 저작 증원은 같은 density에 의해 runtime6+6이며 ID/종류/경고/행동 기회 순서/유한 정책을 유지한다. 위치·지면만 새 구조에 맞춘다.
- npc-sodan은 fresh 때 roster 밖 hidden이며 첫 받이진 뒤에만 기존 장면으로 등장한다. sodan3350/2390→3274/2390, outcome은 exit3440/2390의 dx120→3560/2390으로 원래950ms/2100ms 보행을 사용한다. 새 적/플레이어로 바꾸지 않는다. story/interactions의 조건·대사는 변경하지 않았다.
- 전역 mapRevision20은 그대로이고9장 campaign map revision만1이다. 옛 진행 중9장 전투만 입구250에서 재시작하며 얻은 XP/SP/장착·클리어를 보존한다. 현재 장 우선 loader/main/web-build/시작 화면은 미수정이다.

## 실제 확인과 한계

build, JS 구문/소스 공백, 실제 Chromium1440×900 전체/동쪽 문간·뿌리와390×844 회랑3뷰를 확인했다. 카메라만 옮겼으며 배우 pose를 사진용으로 바꾸지 않았다. pageerror0, 초기 소단hidden,3frame 준비cache pictures3/far1/bark1/beam1/filter4 불변이다. 이는 작은 정적 확인이며 성능 전체 suite가 아니다.

생산 App/engine을 쓰는 국소 fixture에서 아래 받이진 접근/귀환과 서·동 우회로 총4경로를 기본 설오의 걷기·일반 점프로 양방향 통과했다. 적을 제외하고 이동 예산을 갱신하며 시작점 한 번만 초기화했다. 실제8개 결과는 `routes-pass-before-story.log`에 남겨 이후 재실행하지 않았다. 마지막 one-way 아래 마디 재질/형태는 상면 불변이므로 기존 이동을 반복하지 않았다. 초기24적+3동행+hidden소단 총28몸체의 접지/공중 여유, 소단 문턱의 설오/휘겸 몸체를 확인했다.

첫 서쪽 받이진 상호작용 위치를 명시 fixture로 준비한 뒤 기존 boundary/Story tick과 Engine.walk로 소단이3350→3274에 도착했다. 승리 상태를 명시한 outcome fixture에서도 실제3274→3560에 도착했고 중간 좌표 존재/몸체 여유/HP 불변을 확인했다. DOM/Canvas/시간 스케줄은 double이며 전체 정상 전투 완료나 공개 Pages에서의9장 연출 확인은 아니다. 이미 통과한 실제 이동 로그를 보존하고 뒤 배치 probe 실패 때문에 다시 돌리지 않았다.

증원 몸체 확인의 첫 수동 createEnemy probe는 생산 terrain projection을 생략하고 비행체를 지상 접지로 검사한 fixture 오류였다. 생산 코드를 고치지 않고 기존 HonroAllies.execute의 실제 placement로 두6명 증원을 만들어 지상/공중 여유를 확인했다. 경고 순서/타이밍은 정적 보존이며 전체 파동 끝까지 재현한 검사는 아니다. 옛9장 저장 한 건에 XP17을 추가한 Continue fixture에서9장 revision0→1/입구250 재시작과 XP/SP/loadout/clears 보존을 확인했다.

전체 전투·전체 기예·13장 test 묶음·30장/전체 verify는 실행하지 않았다. 증거 `_local/reports/stage9-location-paint/{build.log,render-checks.json,local-checks.json,remaining-checks.log,routes-pass-before-story.log,local-checks.log,library.json}`. 새 WebP source PNG와 trim/비율 유지 pipeline은 저장소에 보존한다.


## Library 실제 화면

- stage9-overview.png: libfile_e344c530953c819184e1697c35940b4a, version1
- stage9-gate-roots.png: libfile_a76d3c8858e0819188cfed9aceca294a, version1
- stage9-mobile-corridor.png: libfile_17db167965d08191bd584a2e0e3898b9, version0


## 부모 검토 뒤 동쪽 뿌리 갈래 보정

91a26a5의 실제 화면에서 두 긴 목재 띠/상단 사각 암판/녹색 접합부를 지적받았다. 이 부분만 별도 완성형 root-fork 자산으로 바꿨다. 원본 PNG를 보존하고 같은 trim/원비율 외부WebP pipeline에 추가했다. 암괴를 둘러싼 여러 뿌리가 고목 줄기에 닿아 양쪽 흙으로 내려가는 연속된 입체 형태다. 실제 노출 상면에 한 번 투영한 한 개 cache를 사용하며 각 경사 edge에 bark strip을 늘여 칠하지 않는다. 아래 통행의 투명한 틈과 앞쪽 배우 가독성을 남기고 기존 지면이 발끝을 묻는다.

실제 상면뿐 아니라 canonical terrain/author/routes/markers/anchors/units/events/story/save revision 전체가91a26a5와 동일하다. 따라서 소단·성장·4경로 검사를 반복하지 않고 build·실제 전체/동쪽 확대2뷰만 확인했다. pageerror0, picture4/far1/rootFork1/beam1/filter5가 정적3frame 동안 불변이다. 모바일v0는 이전 회랑 참고본 그대로 두고 전체/동쪽의 같은 Library ID만v1로 교체했다. 증거 `_local/reports/stage9-location-paint/root-finish/{build.log,render-checks.json,library.json,scope.json}`. 부모 미술 확인 전 master 미반영이다.


## v1 승인 배포

부모가 뿌리 연결/재질을 포함한 v1 실제2뷰를 승인했다. a5a6668090c1f75ff446568cf341235c6a476a3d를 master9e1fd5290b0bf77052405a9aa3b0b9c12af79666에 병합·push했다. 최신8장 접지 소스는 보존하고 충돌한 생성물만 재빌드했으며9장 승인 소스·지형·자산은 불변이다. 전투/연출/성장 검사는 반복하지 않았다. Pages39168421755의 해당 SHA/completed/success 확인, 공개 실제 화면은 부모 확인이다.
