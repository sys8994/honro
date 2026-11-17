# 4장 외곽·접합 독립 검수

공통 SOP 기준. 사용자 저장/기존 브라우저 전투는 접근하지 않는다. 공개 UI 검수 및 master·Pages 반영 전이다.

## 확정 결함과 최소 수정
최종 production assetIds에서 act1-traced:stage04-body-v2가 실제 적용됨을 확인했다. 세로390×696 최소줌 좌하 표본에서 y617부터 수평 색 단절이 발생했다. 등록bounds 하단6000은 실제 sourceSolid/sourceInset clip 하단27500보다 좁다. raster=.0625, 첫 제외tile y8192의 화면y617.09가 관측과 일치한다.

bounds와reference.bounds만 {x:-6000,y:0,w:16600,h:27500}으로 보정한다. vector/viewBox/색/clip/충돌/카메라/저장은 불변. immutable vector SHA256 3b3cfea474ec64e5b1c9b1531ea24a8f91cb6904b1be89fc9f86e79fa355ac1c. tests/stage4-art-bounds.mjs 통과.

## 실행 범위
최종 production9개 물리지형 접점×3화면비27뷰 및 최소줌5위치×3화면비15뷰, 총42뷰 원본 생성. source/build/Engine/renderer를 쓰는 독립 Native fixture로 실제 공개 모바일이나 플레이 입력을 대신하지 않는다. 원본 terrain/units SHA c648dce51f9c9030f5d964a6b6fb845eda404dd24bf4dce37c5c8b691b3f643a. 수정후 A/B 검수 진행 중.

burned-gallery는 파괴 가능하므로 N/A 처리하지 않는다. 별도 메모리 broken flag fixture의 해당 접점3뷰를 추가하되, 실제 공격·파괴 전환 및 연속 플레이 검수로 부르지 않는다.

후보 fix/stage4-art-bounds-20261117만 보존. 공개 UI 미검수, 미배포. 전체 접점·상태행렬 최종합격 아님.
