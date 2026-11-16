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
