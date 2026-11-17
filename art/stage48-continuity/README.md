# 48장 연속 암반 WIP (미배포)

기준 master c26abb7, 독립 fix/stage48-continuity-20261116. 하단 수평 절단·동쪽 가는 꼬리·최대 팬에서 배경 노출을 고친다. 원본 source near-import.json, 모든 stage gameplay/content, 다른 장 library는 불변 확인. 충돌·보행선·터널·저장은 변경하지 않는다.

## 현재 후보와 보존 원칙

concept-v7.png는 실제 카메라 여유까지 포함한 넓은 참조 캔버스의 상단 중앙에 원본을 둔 비보행 지지 암반 시안이다. 상부 계단/갈고리/터널의 원본 벡터는 그대로 보존한다. 새 BODY에는 collision이 없다. source-seam.json은 원본 색면 경계에 따른 partition이며, 모든 실제 접촉선 아래 최소 15 source units를 남긴다. 원본 source silhouette 두 개는 svgpathtools로 진짜 절대 명령으로 직렬화했다. 단순 m→M 치환은 사용하지 않는다. 새 alpha 밖의 원본은 그대로 보존한다.

## 재현

concept-v7.png → trace-native-eight.py (Inkscape1.4, 8색/alpha 실제 Native 추적; native-v7 원본) → tools/terrain-node-optimizer/optimize_svg.py epsilon0.3 (768/1536 raster gate) → partition-v7.py (기존 240000자 compound/60000자 subpath 예산에 맞춘 Native Inkscape Boolean 분할) → compile-v7.py → shared/assets/environment/act5/stage48-continuous-body.json.

한도를 완화하지 않았고 최신 v7에는 좌표 양자화가 필요하지 않았다. 최적화 실제 감량은 report.json을 따른다. 각 원본/최적화/분할 SVG와 alpha, 추적 기록을 보존한다. derive-source-seam.py는 원본 그림 렌더와 색 경계에서 clip을 추출하는 보조 재현 스크립트이며 새로운 보행선이나 지형을 생성하지 않는다.

## 폐기/보류한 시안

- 첫 전체 RBF 교체는 원본 접촉 오차 및 과도한 세로 늘림 때문에 폐기.
- v3/v4는 원본 보존 접합을 개선했으나 하부 암면이 지나치게 컸다.
- v5는 작은 동일 방향의 무늬가 과도하게 반복되어 다른 재질처럼 보여 미술 불합격. 12색은 과중해 6색도 시험했으나 미술 사유로 채택하지 않았다.
- v6 생성 시안도 면이 너무 커 Native 적용 없이 보류.
- v7은 중간 크기 판상암의 크기·방향 변화를 늘린 재검수 후보. 아직 승인/배포 아님.

## 극단 세로 팬 렌더 경계

320×1200, x6520 y4734 zoom3.75/66에서 월드8192 타일 경계가 화면796.477px에 걸리며, 보조 outside clip만 소수 픽셀이라 색면의 antialiasing이 누적된 가는 선이 생겼다. 1px overlap이나 흰 바탕 제거로 해결되지 않았다. 보조 clip을 renderer 본체와 동일한 getTransform+Math.round 경계에 맞추면 사라진다. 48장에만 적용했고 색 덮개/에셋 왜곡/충돌 수정은 하지 않았다.

## 검수 범위

`node tests/stage48-continuity.mjs --baseline-all`: 기준 master의 전체 stage/content/타 장 에셋 및 48장 원본 vector 불변, 신규 collision=[] 검사. 병렬 변경 통합 시 --baseline-all은 기준이 다른 변경을 의도적으로 감지하므로 최신 master와 별도로 대조해야 한다.

`tools/act5-edge-fix/capture-stage48.mjs`: 실제 production Scene의 Native Canvas fixture, 원본 배우/충돌, 지정 카메라. 렌더 전후 gameplay state 불변. 브라우저 조작이나 실제 라운드 검증이 아니다. 로컬 증거는 `_local/reports/stage48-v7-{overview,west,east,bottom,portrait,extreme}`. 최종 미술 승인과 브라우저 검수 전까지 master/Pages 배포 금지.

### 남은 시각적 한계

v7 전체 검수에서 이전 후보의 과밀·동일 방향 반복은 감소했지만, 하부 신설 지지 암반과 원본의 질감 차이는 여전히 보인다. 이를 해결 완료로 보고하지 않는다. 동서 확대에서 원본 캔버스 양 끝의 직사각 보호영역과 생성 alpha가 만나 생기는 작은 수직 톱니를 발견하여, 실제 보행/터널과 떨어진 양끝 하부 지지 구역의 clip 연결을 정리하는 v7b를 검수한다. 원본과 새 지지대의 연결 영역만 바꾸며 원본 보행면을 수정하지 않는다. 신규 art는 source y544 위에는 그리지 않아 생성 시안의 상부 중복 조각이 나타나지 않게 한다.

v7b 확대에서 수직 톱니는 줄었으나 원본 양끝 바깥에 신규 생성된 상부 복제의 일부가 작은 평평한 어깨처럼 남는다. 현재 WIP는 이 접합까지 해결된 완성본이 아니며 계속 수정한다. 원본 색면과 신규 면의 질감 차이도 남아 있다. 이 상태를 배포하지 않는다.

### v7c 접합 보정

`derive-support-clip.py`가 기존 두 원본 Native 실루엣과 원본 foot→신규 alpha y740 정확 교점을 잇는 하부 support gate를 실제 Inkscape Boolean UNION한다. 결과 `support-mask-native.svg`/`support-mask.json`을 신규 alpha와 교차해 사용한다. 기존 사각 보호영역과 y544 컷은 제거했다. 따라서 생성된 상부 복제가 밖으로 나오는 어깨와 원본 캔버스 x0/1536의 톱니는 추가하지 않는다. 원본 자갈/암괴의 불규칙 외곽은 그대로 남는다. sourceSeam, 원본 vector, 보행선은 불변이다.

최종 로컬 후보 캡처는 `_local/reports/stage48-v7c-*`이며, 앞선 v7/v7b 실패 상태와 혼동하지 않는다. 전체/동서확대/하단/390×844/320×1200 극단 팬으로 구분한다. 극단 동쪽 세로 팬의 타일 경계 선은 사라졌고 하부 암반은 화면 바닥까지 이어진다. 아직 실제 브라우저/라운드 플레이 미검증이며 질감 차이에 대한 미술 종합 판단 전이다.

## 순차 진행 전환으로 v8에서 중지 (2026-11-16)

사용자 지시로 47장 완료 후 한 장씩 진행하기 위해 추가 수정/배포를 중지했다. 마지막 진행 중이던 v8 전체 Native 캡처는 정상 종료됐으나 화면을 아직 검수하지 않았고 승인되지 않았다. 현재 WIP 코드가 참조하는 후보는 v8이다. v7c 미술 불합격은 그대로 기록한다.

v8 재개 위치:
- `concept-joint-v8.png`: 원본+신규 하부를 큰 배율로 놓고 끊긴 암맥을 연결하도록 재설계한 접합 시안.
- `concept-v8.png`: 접합 시안을 전체 연속 BODY에 다시 적용한 시안. Native8색 원본/최적화/분할/alpha는 `native-v8/`.
- `compile-v8.py`, `partition-v8.py`를 통해 현재 stage48-continuous-body.json 생성.
- `source-seam-v8.json`: 실제 최하위 보행선 아래15 source units까지 원본을 남기고 잘린 비보행 암괴 끝은 새 그림으로 교체하려는 후보. 이전 source-seam.json은 변경하지 않았다.
- `support-mask-v8.json`: 원본 실루엣+접촉선 envelope Native UNION 후 원본 tunnel hole을 정확히 Native DIFFERENCE. 현재 shared/act5-world.mjs가 이 v8 파일을 참조한다.
- 전체 캡처 `_local/reports/stage48-v8-overview/stage-48-overview.png`, report는 `native-qa-v8-pending.json`. 상태-pure render 검사만 통과하며 미술 검수는 아직 하지 않았다.
- 재개 후 우선 전체 화면과 실제 충돌 overlay, 동서 확대를 보고 접촉선·터널·외곽 접합을 검증할 것. 기존 tests/stage48-continuity.mjs의 source-seam 읽기 경로는 아직 v7 기준이므로 v8 검증으로 오해하지 말 것. v8 전용 보존/터널 회귀를 확인해야 한다.
- v8은 별도 접합 시안이므로 v7c의 팬/줌 QA를 그대로 승계하지 않는다. 세로/극단팬 및 공개 브라우저/라운드 검증은 모두 미완료.
- master/Pages 미변경. 통합 전 최신 master와 47장 등 병렬 변경을 반드시 보존할 것.

## 2026-11-17 순차 재개

기준 master55c92e361e5a8a2104006d12ff6d2c46b059dd95에서 별도 브랜치로 기존 WIP를 이식했다. 43/46/47 변경과 전체 gameplay/content, 다른 장 assets 보존 검사를 통과했다. 기존 v8 전체·서쪽 화면은 인공 수평 어깨와 재질 크기 불일치로 반려. 원본 전부를 보존하고 support gate만 아래로 내린 v9도 y655 수평 접합이 드러나 반려했다.

v10은 원본 크기 근거리 지질 시안, v11은 전체 심부 지질 후보다. 두 자산을 단순 겹친 후보는 사각 패치 경계가 명확하여 반려했다. 이 합성의 근거리 연결부를 다시 그린 v12를 실제 Inkscape로 처리 중이다. v11-bleed는 투명 RGB만 nearest opaque RGB로 확장하고 원래 alpha를 보존한 별도 추적이다. 수치 통과를 미술 합격으로 사용하지 않는다.

현재는 WIP이며 master/Pages 미변경. 실제 브라우저·라운드 플레이 미실시. 완료나 배포 가능 상태가 아니다.

### v12 후보 검수 및 공개 검수 경로

활성 자산은 v11-bleed 심부와 v12 원배율 접합이다. 색면 분할 경계는 두 Native 렌더의 저대비 경로를 선택하고 Inkscape 교차로 만들었으며 실제 화면에서 사각 패치가 남지 않는지 확인했다. 원본 보호·심부·접합은 각각 색면을 먼저 합성하고 최종 coverage를 한 번 적용한다. native-source-alpha를 재귀적으로 제거한 복사본만 새 지지체에 쓰며 원본 asset 데이터는 그대로다.

Native 전체·서쪽·동쪽·하단·390×844·320×1200에서 계단 원형, 터널 개구부, 외곽/하단 지지 연속을 확인했다. 새 합성 회귀와 전체 gameplay/content/다른 장 asset SHA 불변 검사 통과. 터널 내부(경계 1 source pixel 제외) 1,982점, 원본 접촉+5 source units 330점 보존. Boolean 경계의 2표본에서 1 source pixel 이내 판정 차이가 있어 정확한 무오차 실루엣이라고 주장하지 않는다.

로컬 브라우저는 localhost 연결 거부와 file:// 보안 정책 차단으로 미실시했다. 제한을 우회하지 않는다. 정식 CI 통과 후 master/기존 Pages에 반영하고 공개 게임에서 즉시 확인하는 순서로 진행한다. 실제 공개 검수 전까지 브라우저/플레이 검증 완료로 기록하지 않는다.
