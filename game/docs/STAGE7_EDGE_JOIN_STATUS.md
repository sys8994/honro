# 7장 외곽·접합 독립 검수 후보

3장 후보5d111652를 기반으로 공통 author/renderer의7장 변경을 보존한다. 공개 UI·실기기·실제 전투 검수는 미완이고 사용자 저장·기존 전투는 조작하지 않았다. master/Pages 반영 보류.

## 확정 원인
최종 production은 act1-site:7:body로 교체된 돌당골 collage다. source37지형 접점×3화면비111뷰 및 최소줌 playcorner/전체15뷰, focuscorner12뷰 총138뷰를 수정전으로 캡처했다. 이 장 focusBounds는 playBounds와 같으므로 corner 중복 표본임을 밝힌다.

좌하/우하 미술 외곽·하단이 사각 절단되고 root-floor의 물리 폐합선이 검은 사각으로 보였다. 단순 metadata bounds 확대만으로는 실제 원본이 끝나는 공백을 채우지 못한다. 원본 source를 보존한 strip 연장과 renderer raster 범위 보완, root-floor의 비보행 폐합3선만 생략하는 방향으로 수정한다. 물리 지형을 연장하거나 가짜 발판을 추가하지 않는다.

## 보존 계약과 검수 한계
최종 stage 계약 hash7ec52e52f4ee62d9765747e8b0b143a753c9fd5cbcc1e47ee80371fd883e1789, physics5072cf3dcc49c5f2875482c7125e0c62d6176b3f2a70c1c8a50af33ff5779d6f를 보존한다. 원본 source경로와13추가발판 배치는 동일해야 하며 optimizer5path도 그대로 유지한다. 3장 optimizer11path 및 기존3장 pixel seam 회귀 테스트도 별도로 수행한다.

37개 지형은 모두 indestructible=true/hp99999라 실시간 파괴는 N/A. 주민구출2/3 증원, 계단 실제 이동, 유닛가림·재진입은 아직 미검수. 정적·합성 렌더 결과를 공개 플레이 합격으로 간주하지 않는다.

첫 외곽 연장 후보는 하단 source샘플의 색 접합과 우측 투명 공백이 남아 불합격 처리했다. 최종안0795f4a63b4f1c60f68749b723f713a4631455919bf14551dbb7f596c861c547은 실제 source alpha를 측정해 빈 구간 아래에 원본 불투명 행을 이어 붙였다. 하단은 마지막 source1067행을 하나의 연속 strip으로 이어 샘플 반복에 따른 색 점프를 제거했다. desktop 우하 직접 이미지에서 큰 공백 및 y337/y568 접합 점프가 제거됐고 전체138뷰 재검사 진행 중이다. 이 중간 후보를 최종 검수 증거로 사용하지 않는다.
