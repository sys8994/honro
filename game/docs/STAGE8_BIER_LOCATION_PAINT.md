# 8장 돌아오는 빈 상여 — 장례 창고·상여터 회화와 실제 다중 경로

2026-10-18. 승인7장 쉼터1a40463ceb5b5c4045bf55b85c58e1345b6dbd4f를 최신 master `bac66908ddbce6dee79adc2c2e9f0d53b6d906cd`에 병합·push했다. 승인 tree와 동일하므로 검증을 반복하지 않았고 [Pages run39160419009](https://github.com/sys8994/honro/actions/runs/39160419009)의 해당 SHA/completed/success를 확인했다. 부모가19:57 UTC 공개 Pages의7장 쉼터와 전투 입구·중간 마당의 실제 화면을 확인했다고 전달했다. 7장 공개 확인은 완료이며 반복하지 않는다.

8장 전투만 `art/stage8-bier-location-paint-20261018`에서 별도로 작성했다. 부모 실제 화면 승인 전 master에 반영하지 않는다. 8장 쉼터·9장은 미착수다.

## 장소·자산·실제 지형

- 9600×5500, 서쪽 창고와 아래뜰, 중앙 아래뜰, 높은 뿌리 사격길, 하부 배수 귀환로, 동쪽 상여터의 기존 경로 의미와 support ID를 유지한다. 기존 `stage8-bier-geometry.mjs`의 BIER_LAYOUT를 참조하는 좁은 `stage8-location-paint.mjs`에서 실제 polygon과 모든 관련 위치를 같이 저작한다. 기존 전투 저작기/편성 정책을 다시 만들지 않는다.
- 새로 제작한 온전한 한국식 긴 목재 장례 창고와 개방된 상여집 두 점을 사용한다. source PNG를 보존하고 `stage8-assets.py`로 투명 여백만 잘라 비율을 유지한 외부 WebP로 준비했다. 창고1536×580/308858 bytes, 상여집1152×661/210694 bytes다. 사람·완료 주민·별도의 상여 모형이 없는 건축 자산이며 실제 빈 상여 boss 원본은 그대로다.
- 창고는x1570/width1180/foot3800, 상여집은x7600/width800/foot3000에 원래 비율로 둔다. 집 몸통·기둥은 장식이며 새 막힌 벽이 아니다. 그림에서 읽은 별도 지붕 상면은 one-way다. 기존 상여터 one-way 교판은 그대로이고, 뒤쪽 판면·실제 흙에 닿는 기둥/가새로 원근이 있는 상여집 기초를 연결한다. 새 지붕만 해당 원래 지역의 activation supports에 추가하며 기존 반경/높이/상한은 유지한다.
- 서쪽 창고 앞은x1550~2800/y3800의 마당이다. 서쪽 결박은x2520/y3800으로 약49.6만큼 낮아지고, 동쪽 결박x7920/y3000과 boss 시작x8290/y3000, 중앙 도착5950 또는6150/y4250은 그대로다. 마당/경사 접점2800은 정확히 맞춰 실제 통로 연결을 보존한다.
- 긴 직선형 지면·어깨·상여길은 넓은 능선 제어점과 곡선 연결로 짧은 흙길/암면의 기울기가 바뀌게 했다. 사격길 양끝은 기존 실제 암반 어깨에 닿으며, 중앙 정적 고목의 원래 뿌리 픽셀을 실제 root polygon에도 같은 좌표로 그려 임의의 공중 판자처럼 보이지 않게 했다. 가까운 암면은 서로 다른 군락/스케일과 얇은 흙, 큰 어두운 깊이로 구분한다. 깊은 면의 볼록 모서리는 안으로 둥글려 기존 solid의 subset으로 만들었으며 통과한 보행 상면은 바꾸지 않았다.
- 필수 동선/지역 활성화에 쓰이지 않는 옛 큰 서쪽 돌 아치를 입구의 낮은 접지 암반으로 정리했다. 해당 옛 ceiling 참조도 제거했다. 창고 뒤의 작은 암면과 기존 앞쪽 하부 통로 뒤로 물러선 암면은 배경 평면이며 새 걷는 면/충돌 벽이 아니다. 실제 위 마당·반사석·낮은 엄폐물·얇은 목재 screen·배수/상승 one-way는 남는다.
- 구 s8-art-* 요소는 실제 asset collision이 없음을 확인한 뒤 제거했다. 기존8장 벡터 원경과 지형 hook은 새 paint opt-in에서만 물러나고, 과거/사용자 정의 장면에는 기존 렌더를 유지한다. 새 원경은 조용한 공유 mountain-dusk 한 장이며 act1BackdropFrame 계약과1회 준비 canvas를 사용한다. 기존 날씨/물/배우/상여 원본을 유지하고 새 환경 모션·RAF는 없다. 지형 디버그 윤곽 toggle은 공통 renderer에 남아 있다.

## 사건·편성과 저장 계약

- `honroStage8BierRevision:1`, `density36e9`, 원본 s8-0..35의36 편성/9 정예, 모든 원본 unit stats·AI·HP/XP·역할과 encounter ID를 보존한다. boss와 별도로 생성되는 결박 questTarget2개는 일반 편성으로 재해석하지 않는다. activeLimit4/저작 populationCap45와 기존 runtime cap override는 그대로다.
- 두 결박 기능과 첫 결박/상여 정착/낮은 체력의 세 이벤트 ID·조건·종류·수·warning·유한 정책은 유지한다. 실제 증원은 기존3·3·2이며 density의 첫3은 산개2+까마귀1이다. 위치와 support만 새 지형으로 재계산하고, 새 지붕 아래/위의 공중 여유를 위해 동쪽 초기 날짐승 및 몇 증원 공중 위치를 조정했다.
- canonical anchors, design.bier nodes/routes와 space 연결·sites·surfaces·rooms, honroStage8BierSpec movement routes/destinations 및 entries의 members/alternates/variants, 원본 spawn 위치를 같은 실제 상면으로 갱신한다. 기존 경로 ID와 지지면 ID, 지역의 기존 activation support/반경/높이는 유지하고 새 지붕을 해당 지역에만 등록한다.
- 두 결박 뒤 예고와 플레이어 행동 기회, 실제 전폭 몸체/방해물 검사, 안전한 경계에서 재시도, 실제 걷기 출력을 복사하는 staged 이동은 그대로다. 곡면의 실제 frame 이동에서0.01 world 미만 잔여 예산이 walkStep의 진행 epsilon에 걸려 가짜 ‘끊긴 지지면’이 되던 경우에만 작은 loop guard를 추가했다. 마지막 검증된 위치에서 다음 frame을 시작하며 좌표를 강제 보정하거나 장애물 검사를 건너뛰지 않는다. 목표·성장·상여 AI/공격/보상 로직은 다시 쓰지 않았다.
- 전역 revision20은 유지하고8장 campaign map revision만1이다. 이전 진행 중8장 전투만 입구x770에서 재시작하며 얻은 성장·SP·장착·클리어를 보존한다. 1~7장과 다른 장 JSON/공유 library는 불변이고 main/current-stage loader/web-build/시작 화면 최적화는 미수정이다.

## 최소 확인과 실제 한계

필요한 build, 변경 JS 구문/소스 공백 검사와 실제 Chromium1440×900 전체 전장·창고/위 뿌리길,390×844 동쪽 상여터3뷰를 직접 확인했다. 카메라만 옮겼으며 배우/적/boss pose를 화면을 위해 강제 변경하지 않았다. pageerror0, 고정12frame battle JSON 불변, picture3/far1/wood1/filterPasses4가 증가하지 않았고 새 root crop canvas는 만들지 않는다. 새 창고 요청1회, 무관4/5장 자산 요청0이다.

생산 App/engine을 불러오는 국소 fixture에서 AB/BC 주 접근, BD/DF 위 사격 경로, CG/GH 하부 귀환·재진입을 기본 걷기/도약으로 확인했다. 적은 이 이동 fixture에서 제외했고 이동 예산은 구간마다 일반 턴을 가정해 재부여했다. 위쪽 목재 내리막 끝에서는 실제 착지를 기다린 뒤 도약한다. 특수 기예/순간 이동/좌표 보정은 쓰지 않았다. 먼저 통과한 경로는 이후 다른 부분 수정 때 반복하지 않고 해당 실행 로그를 보존했다.

초기36 일반 편성의 지형 몸체/공중 여유, 기존 증원 members/alternates/variants18개 위치의 지형·비행 여유를 확인했다. 세 유한 증원은 실제 생산 spawn 경로로3/3/2를 생성했다. 경고/행동 경계는 명시 fixture이며 모든 전투 상황의 유한 증원 타이밍을 끝까지 재현한 검사는 아니다. 다른 보스 위치의 variant는 지형 여유만 확인했다.

두 실제 결박 descriptor를 해제한 국소 fixture에서 행동 기회 전 이동 차단을 확인했다. 첫 검사에서 intro 턴 배너가 아직 pause인 경우와 story queue를 아직 drain하지 않은 경우는 fixture에서 정상 경계를 준비했으며 production pause/queue 정책을 바꾸지 않았다. 동행을 실제 경로에 둔 blocked fixture에서 boss가x8290에 머물고, 동행을 비운 다음 안전한 경계에 재시도했다. 이후 실제15 world/frame 이내, 최대4 world 보행 probe의 이동으로8290,3000→5950,4250에 도착했고 각 frame 몸체 여유/HP 불변을 확인했다. 사전 물리 경로 길이는2854.209 world다. 상여를 강제 배치하거나 장면 완료 flag만 넣지 않았다.

이전 실제8장 저장에 XP17을 더한 단일 Continue fixture에서 map revision0→1, 입구770 재시작과 성장/SP/장착/클리어 보존을 확인했다. 원본 unit stats/encounter/event 의미·activation 반경/높이/caps/경로 ID와 다른 장 JSON/library 불변, 저작 idempotence는 정적 비교다. 마지막 underside 코너 마감은 기존 solid의 subset 및 보행 상면 불변을 확인했으므로 통과한 이동/구조/저장 검사를 반복하지 않았다.

이는 국소 접근/이동/접지/저장 및 실제 화면 증거다. 기존 방대한8장 전체 검사 묶음, 전체 전투/전원 기예/30장 실행/전체 verify는 하지 않았다. native App harness의 DOM/Canvas/시간 스케줄은 double이며 전체 정상 전투 완료나 공개 Pages의8장 화면을 검증한 결과가 아니다.

증거: `_local/reports/stage8-bier-location-paint/{build.log,render-checks.json,local-checks.json,save-data-checks.json,finish-geometry-checks.json,verification-summary.json,library.json}`. 먼저 통과한 경로의 세 로그도 이 폴더에 보존한다.8장은 검토 브랜치 commit/push 후 부모 미술 검토를 기다린다.

## Library 실제 화면

- stage8-battle-overview.png: `libfile_d5b4dfb590b881918ad0ab0b60562a6d`, version0
- stage8-funeral-store.png: `libfile_7cf90e1d70008191ad411926c31b58c6`, version0
- stage8-mobile.png: `libfile_b5f5971448508191a4f9c9f9d2b50b21`, version0
