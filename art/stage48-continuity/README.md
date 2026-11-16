# 48장 연속 암반 WIP (미배포)

기준 master c26abb7, 독립 fix/stage48-continuity-20261116. 하단 수평 절단·동쪽 가는 꼬리·최대 팬에서 배경 노출을 고친다. 원본 source near-import.json, 모든 stage gameplay/content, 다른 장 library는 불변 확인. 충돌·보행선·터널·저장은 변경하지 않는다.

concept-v3.png는 원본을 실제 카메라 여유를 포함하는 넓은 참조 캔버스의 상단 중앙에 배치해 만든 지지 암반 생성 시안이다. 원본의 상부 그림은 runtime에서 원래 벡터 그대로 보존한다. 신규분은 비보행 BODY 연장이다. 전체 장 재제작 또는 미술 합격이 아니다.

재현: concept-v3.png → trace-native.py (실제 Inkscape1.4 12색/alpha 추적, native-v3 원본) → terrain-node-optimizer epsilon0.3 (color-opt, 768/1536 raster gate, 실제 감량은 3 segment뿐) → partition-v3.py (240000자 compound 예산 내 native Inkscape Boolean 세로분할) → compile-v3.py → shared/assets/environment/act5/stage48-continuous-body.json. 한도 완화 없음. 원본/최적화/분할 SVG 보존.

첫 RBF 전체 교체 후보는 동쪽 접촉 오차와 길게 늘어진 하부 색면으로 폐기했다. 현재 후보는 원본 상부/터널/계단을 보존하지만 기존 암반 밑면과 새 하부 사이 수평 이음이 남아 있다. 절대 master/Pages에 배포하지 않는다. Native 전체 화면: _local/reports/stage48-v3b-overview/stage-48-overview.png. 아직 극단 팬/모바일/브라우저 검수 전이다. 그림-충돌 보존과 최종 미술 품질은 별도이며 현재 미완료다.
