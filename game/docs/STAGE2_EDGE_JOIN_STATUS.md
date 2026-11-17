# 1막 2장 외곽·접합 재검수

기준: 공통 TERRAIN_EDGE_JOIN_AUDIT_SOP.md. 공개 초기 관측은 master e89242ee 전달 이후 기존 Pages, 새 문서 통합 기준 master 7d238d20. 장 전체 검수 완료가 아니다.

## 위치 목록과 관측
- W/T: 서쪽 높은 능선, 소나무 수관, 하강 암대/가지 지지. 공개 전체·좌상 극단 pan 표본에서 잘림 관측 없음. 모든 지지 확대/실제 착지는 미검수.
- E/T: 동쪽 능선과 소나무·선반. 공개 전체·우하 pan 표본 확인. 전 구간 연속 보행/확대 미검수.
- C: 중앙 빈 계곡과 낮은 상여 호송길. 원본 빈 공간과 동행/적 배치를 보존. 보행/호송 완주 미검수.
- B: BODY/rear 아래 확장과 tile 경계. 공개 최소줌 부근 우하 미니맵 pan에서 화면 전체 폭 수평 색 경계 재현. 확대하면 사라지고 다시 축소하면 동일 경계 발생.
- 모바일: Native 390×696 사전 진단만. 공개 모바일 viewport 및 실기기 미검수.
- 상태: 기본 상태만. 파괴·기믹 영향별 목록의 추가 소스 분류 및 상태 검수 미완. 미확인 상태를 N/A로 표시하지 않는다.

공개 화면은1331×894 캡처이며 CSS/DPR은 별도 실측하지 않았다. 정상 여정첩→1막2장→진입, 디버그·기록 분리. 실제 공개 화면과 Native는 분리한다.

## 확정 원인과 최소 수정 후보

BODY/rear의 clip/path가 x -6000..10300, 하단 y30000까지 실제 불투명하게 이어지는데 asset.bounds는 x-4000,y0,w12300,h4500이었다. renderer._landmarkVisible이 이 bounds로 타일을 선별해 y4871 부근 이후 자산을 빼고 밑그림을 노출했다. 1331/6800 줌과 기존 raster-scale 계산에서 이 tile 경계가 관측 위치와 일치했다.

두 자산의 bounds/reference.bounds만 실제 clip 전체를 포함하도록 변경한다.
- BODY: x-6000,y-212,w16300,h30212
- rear: x-6000,y-57,w16300,h30057

벡터 path/clip/색/viewBox, 충돌, 보행면, 배우, 목표, 카메라 제한은 불변이다. 새 미술·Inkscape 재추적은 필요 없다. 기존 최적화 vector 해시도 그대로 보존한다. 자산 ID를 바꾸지 않으며 이전 전투의 자체 저장 미술을 강제 교체하지 않는다.

## 실행한 검증

- tests/stage2-art-bounds.mjs: 실제 clip 전체가 metadata에 포함, vector SHA 불변, non-collision 통과.
- production Native Scene 전후 각3뷰. 시작1331×763/.94은 변경 픽셀0. 하단1331×763/zoom1331÷6800은 y689..762에서만 변화하며 직선 경계가 사라졌다. 모바일 Native390×696/zoom390÷6800은 y629..695만 변화. 전후 terrain/units SHA 모두86d2783bad413acd61b946b233c49905b41c73aacbb077cdd27b037b53157824.
- Stage2로 범위를 제한한 기존 act1-local-art-save 검사: 저장 왕복, 변이 격리, provider 독립, 이전 inline 호환, 잘못된 저장11건 원자적 거부 통과. 전체 Act1 검사는 Stage3 Missing table에서 실패했으며 전체 성공 아님.
- 과거 stage2-continuous-candidate 검사는 현재 author 순서와 geometry source lock 불일치로 중단. 가드나 기대값을 완화하지 않았다.
- npm run build 성공,809개 발행 파일 생성. 로컬 generated 변경은 아직 미배포 후보다.
- 공개 기존판에서 시작 도약 후 HP365/365, 이동도1100→1025, 착지 후 이동·발사 가능 복귀 확인. 수정후 공개 입력 증거는 아니다.

## 미검수와 현재 상태

공개 검수 전투를 휴식터로 전환하는 초기화가 자동 안전검토에서 거부되어 취소했고, 동일 조작을 새 탭이나 다른 방법으로 우회하지 않는다. 모바일 viewport 조정용 브라우저 키 조합이 게임 도약에 전달되어 반복하지 않았다. 기존 전투는 보존한다.

확정 결함 B는 수정후 Native 확인, 공개 수정후 확인 대기다. 장 전체 위치/상태행렬은 미완료이며 모바일·재진입·모든 접점/상태·성능 비교는 미검수다. 후보 원격 보존/CI와 실제 master·Pages 통합/공개검수를 분리한다. 공개판에서 해당 수정의 실제 화면을 확인하기 전 완료라고 보고하지 않는다.


## 2026-11-17 추가 정적·Native 검수와 CI

후보 소스 commit1df10c1d8625681a0cc64bf4b0931e63eb5b2cc9의 [CI44027224452](https://github.com/sys8994/honro/actions/runs/44027224452)가 성공했다. immutable vector/bounds 회귀와 official runtime build를 모두 통과했다. master·Pages 반영이나 공개 수정후 시각 합격을 뜻하지 않는다.

추가 source 목록: stage02-body-source.json의14개 물리지형 모두 breakable=false다. canyon-ground, left-high-ground, right-cliff-ground, 서측3개 stone/3개 tree-branch, 동측2개 stone/2개 tree-branch/right-climbing-root다. 따라서 해당 지형 파괴 전후는 해당 없음(소스 근거). 동행·호송·UI가림과 재진입은 별개이며 공개 상태 검수 미완을 유지한다.

Native production Scene, DPR1, 정적time2, 카메라는 현행 HonroBounds.constrain 적용. terrain/units SHA는15뷰 전후 모두 위 기록과 동일. DOM UI와 실제 모바일 기기는 포함하지 않는다.

| 뷰 | 크기/요청 줌 | 전후 변화 |
|---|---|---|
| 전체 |1331×763 /1331÷6800|0픽셀|
| 서상·동상 모서리 |1331×763 /1331÷6800|각0픽셀|
| 서하·동하 모서리 |1331×763 /1331÷6800|각 y689..762 하단만 변화, 수평 색경계 제거|
| 서상/서중/서하/호송길/동하/동중/동상 접점7곳 |1331×763 /.94|각0픽셀|
| 세로 축소 |390×696 /390÷6800|y629..695 하단만 변화|
| 세로 보행 |390×696 /.82|0픽셀|
| 가로 축소 |844×390 /844÷6800|0픽셀|

요청 접점 좌표는(600,800),(1250,1500),(1300,2400),(2500,2950),(3450,2500),(3700,1600),(4000,600)이며 실제 제한 후 카메라 x/y/scale은 report.json에 기록한다. 원본 클립·분리 자산의 보여지는 연결을15뷰 contact sheet로 직접 확인했다. 이것으로 연속적인 모든 좌표나 공개 모바일을 통과로 바꾸지 않는다.

재현 도구: tools/act1-vector-production/capture-stage2-bounds-audit.mjs. 기본은 후보, HONRO_STAGE2_BOUNDS_BASELINE=1은 기존 좁은 bounds만 메모리에서 복원한 대조다. 저장·저작 소스를 변경하지 않는다. 각 결과는 _local/reports/stage2-bounds-audit-{before,after}/에 저장한다. 이번 실행 원본15뷰는 stage2-sop-native-{before,after}/에, 최초 비교는 stage2-bounds-{before,fix}/에 보존했다.

Native 캐시 부담 진단1표본: 동일1331×763 하단 줌에서 warm render30회. 수정전/후 p50=51.19/49.83ms, p95=66.61/59.62ms, 최대102.66/67.53ms. tile12개, world cache12,780,288B와 screen slot각4,062,212B로 동일했다. 초기render+settle은887.34/931.44ms였다. 공유환경 단일표본이므로 속도 개선이나 브라우저 FPS를 주장하지 않는다. 실제 브라우저/실기기 성능은 미측정이다.

결론: 확정된 bounds 누락은 정적·Native에서 해결되고 관련CI 통과. 공개 수정후·전체 상태행렬은 여전히 미완. 다음 장은 착수하지 않았다.
