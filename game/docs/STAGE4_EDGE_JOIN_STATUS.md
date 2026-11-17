# 4장 외곽·접합 독립 검수

공통 SOP 기준. 사용자 저장/기존 브라우저 전투는 접근하지 않는다. 공개 UI 검수 및 master·Pages 반영 전이다.

## 확정 결함과 최소 수정
최종 production assetIds에서 act1-traced:stage04-body-v2가 실제 적용됨을 확인했다. 세로390×696 최소줌 좌하 표본에서 y617부터 수평 색 단절이 발생했다. 등록bounds 하단6000은 실제 sourceSolid/sourceInset clip 하단27500보다 좁다. raster=.0625, 첫 제외tile y8192의 화면y617.09가 관측과 일치한다.

bounds와reference.bounds만 {x:-6000,y:0,w:16600,h:27500}으로 보정한다. vector/viewBox/색/clip/충돌/카메라/저장은 불변. immutable vector SHA256 3b3cfea474ec64e5b1c9b1531ea24a8f91cb6904b1be89fc9f86e79fa355ac1c. tests/stage4-art-bounds.mjs 통과.

## 실행 범위
최종 production9개 물리지형 접점×3화면비27뷰 및 최소줌5위치×3화면비15뷰, 총42뷰 원본 생성. source/build/Engine/renderer를 쓰는 독립 Native fixture로 실제 공개 모바일이나 플레이 입력을 대신하지 않는다. 원본 terrain/units SHA c648dce51f9c9030f5d964a6b6fb845eda404dd24bf4dce37c5c8b691b3f643a. 수정후 A/B 검수 진행 중.

burned-gallery는 파괴 가능하므로 N/A 처리하지 않는다. 별도 메모리 broken flag fixture의 해당 접점3뷰를 추가하되, 실제 공격·파괴 전환 및 연속 플레이 검수로 부르지 않는다.

후보 fix/stage4-art-bounds-20261117만 보존. 공개 UI 미검수, 미배포. 전체 접점·상태행렬 최종합격 아님.


## 수정후 독립 A/B 결과

42뷰 중40뷰 변경 픽셀0. 세로 최소줌 좌하/우하2뷰만 y617..695의 하단색 경계가 제거됐다. 전후 terrain/units SHA는 동일하다. 42뷰 contact sheet 및 수정후 세로 하단 원본을 직접 확인했다. 원본 미술 재생성이나 충돌 변경 없이 등록 영역만 고친 결과다.

burned-gallery broken flag fixture3뷰를 원본 접점과 직접 비교했다. 다리 발판/지지대가 제거되는 것을 확인했고, 주변 BODY와 구조물은 유지됐다. Engine을 진행시키지 않아 위의 유닛이 낙하하지 않은 상태다. 실제 공격→파괴→낙하 또는 저장 재진입 합격은 미검수로 유지한다. fixture terrain/units SHA는43f75e4527c1f0949f1b3cc2e024c1669e9c69ce25fbbddbb9a96fabbca1a2a1. 원본/수정후42뷰와 synthetic3뷰는 _local/reports/stage4-independent-{production,bounds-candidate,broken-gallery-candidate}/에 보존.
