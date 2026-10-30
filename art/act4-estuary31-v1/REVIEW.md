# 낮은 하구 시안 1

## 상태
지리·분위기 참고용 후보. 최종 미술 및 인게임 검수 미통과.

- 생성: image_gen, graybox full.png와 사용자 승인 flat native style을 참조.
- 유지: 낮고 긴 흙둑 두 개, 강에서 바다로 열린 물길, 오른쪽 접안시설의 실제 기둥.
- 수정 필요: 첫 둑의 열린 침식 고랑이 희미해짐. 최종 플레이 레이어는 원본 보호 접지선을 따라야 한다.
- 수정 필요: 갈대/뿌리/잔돌 디테일 과다. 전체 이미지 추적 금지. 원경은 래스터로 유지하며 플레이 지형과 공통 장식을 분리 제작한다.
- 원경 원본은 지형/근경이 없는 별도 이미지로 제작해야 하며 이 통합 시안의 숨겨진 배경을 임의 추정해서 잘라 쓰지 않는다.
- 기준 지리: honro-act4-terrain-art-spec-v0.2.md의 낮고 긴 둑과 비대칭 갈대섬.
- 수직 이동 횟수와 발판 수는 참고 지표다. 이를 충족하려는 구조물 추가 금지.

## 생성 요청 요지
Side-view low alluvial estuary bank, two asymmetric reed banks, open erosion gutter in first bank, shallow central drainage, only one supported final timber jetty. Flat navy/slate broad planes and restrained sage rim. Original raster atmospheric blue dawn far landscape. No floating platforms, tall pillars, arches, HUD or characters.

## 실제 Inkscape 추적
terrain-source.png를 GUI Link import, Multicolor Colors 8 scans, Stack ON, Remove background ON, Smooth OFF, Speckles 2, Smooth corners 1.00, Optimize 0.200으로 추적. terrain-traced.svg 454179 bytes, 7 paths. PNG 링크 원본 포함 저작파일이며 엔진 경량 결과는 별도 생성한다.
입력칸에 8을 append하여 88로 첫 실행한 오류는 Undo 후 Ctrl+A 교체로 8을 화면 확인하여 재실행했다. 88 결과는 최종 SVG에 포함되지 않음(7 path 확인). 큰 복합 경로 352093자 등이 있어 형상 보존 최적화와 실제 크기 검수가 필수다.
