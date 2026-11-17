# 12장 하단 재질 접합 독립 검수 후보

최종 production compact package의 Native 검수다. 공개 UI·실기기·실제 상태 전이는 미검수이며 사용자 저장·기존 전투를 조작하지 않았다. master/Pages 보류.

## 결함 원인
일반지형12개 모두 파괴불가이며 별도 파괴 표적은 없다. ground1/2의 실제 그림과 등록 범위는 최소줌/최대focus를 덮으므로 bounds 문제는 아니다. 다만 세로 좌하 y663에서 긴 수평 색 경계가 재현됐다. actual vector만 직접 그려도 alpha255 상태로 색이 바뀌며, 둘째 source 재질의 사각 하단 y736이 world10500, 화면663.44에 정확히 대응했다. 타일8192/16384 경계나 배경 노출과 구분한다.

## 최소 합성 수정
둘째 source의 마지막 불투명1px행을 이루는 원본8path를 순서·색 그대로 재사용하고 world10498..30100의 보행영역 밖만 연속 확장했다. 단색으로 단순화하면 일부RGBA가 달라 그 방법을 쓰지 않았다. 원본기존경로·배치·clip 및 optimizer28path 주소/내용은 동일하고 ground1/2 chunk수도 유지한다. 기존30MB optimizer 원본은 변경하지 않았다. 작은 등록표에 기존3/7 등록과 새12 등록을 함께 보존했다.

최종 vector hash: ground1 233d597df9ccb6e73f12f3640b24af23b5cdd8b842c053a0f2e63fc411ae05c9, ground2 56339be09b480e1133d03f7e238968bdb6b4bea3944da2fa7c79a69d66d55500. tests/stage12-ground-skirt.mjs는 원본stage/source/기타asset 불변 및 최종 renderer node/compound 예산을 검증한다. 등록 재생성은 멱등이다.

공식 pack-act2-compact.mjs를 추가flag 없이 실행했다. stage/source/모든asset(vector·bounds 포함)은 기존후보와 정확히 같았고 artStats.bytes만 total1957648→2427466, ground1435698→1905516으로 갱신되어 새 값을 유지했다. 실행 전후 백업을 보존했다.

## 결과와 범위
접점12×3화면비36뷰, playcorner/전체15뷰, 실제focus극단12뷰 총63뷰 A/B.59뷰는 픽셀동일, 세로 playcorner하단2뷰 y663..695 및 focus하단2뷰 y650..695의 접합부분만 바뀌었다. 물리 SHA cbb3860fb8f41dc731e1b66495cc878ee65de528dd9dec51ec118a3f87b799f6 동일. portrait2의 y0..662도 픽셀동일이며 하단 수평 색 경계 제거를 직접 확인했다. 같은 로컬 결합 트리에서3장 pixel seam·7장 폐합선 회귀도 재통과했다.

나무 공통asset을 padding200 canvas로 측정한 alphaLocal[-210,-773..358,4]는 등록범위 안이고 상부여유22px.5개 배치/scale·원본불변을 check-stage12-tree-bounds.mjs로 재현한다. 한 배치의 world상부−42.829는 map y0 밖이지만 등록상부−59.769와 허용focus상부−1800 안이며 잘림이 아니다.

동일동행 왕복, sign 조사, route-exit, 재진입·가림·모든 최대줌/접점위치 조합 및 공개 UI는 미검수다. 이 후보는3/7장 후보 bf672d7f 기반이므로3/7 코드와 등록도 포함하지만 다른 장의 독립후보를 모두 포함하지는 않는다.
