# 10장 외곽·접합 독립 검수 후보

최종 production project/compiler/Engine/renderer의 Native 검수. 공개 UI·실기기·실제 전투 검수와 분리하며 사용자 저장 및 기존 전투는 조작하지 않았다. master/Pages 반영 보류.

## 확정 결함과 최소 수정
floor-v4 등록bounds 하단6800은 실제 canonicalSolid/contactInset 하단27900보다 좁았다. 세로하단 y594 잘림은 타일8192 누락으로 348+(8192−3900)*390/6800=594.16에 발생한다. bounds/reference만{x:-6000,y:1300,w:17000,h:26600}으로 확대했다. 원본 vector SHA1a882672ea3b133b06f1deef8f3faba42a86911556d7d3dfb3be16695f320c01, viewBox/clip/collision 및 build stage SHA5b12c72408e2111aed80f33aaf9c8ef902f456dbdf2b54b4f313dd24e90fc917 불변. tests/stage10-art-bounds.mjs PASS.

## A/B 범위 및 상부 나무
source12 접점×3화면비36뷰, playcorner/전체15뷰, 실제focus(-320,-1800)..(5320,4140) 극단12뷰 총63뷰.59뷰는 픽셀동일, 세로 playcorner하단2뷰 y594..695 및 focus하단2뷰 y580..695만 복원. 물리 SHA cb9f6608e6363bc1cd5f5504545a2f3d968a6615c261ce7d5ba1a58766c13ab6 불변.

나무는 bounds보다 사방200px 큰 메모리canvas에 실제최종vector 전체를 그려 alpha범위를 측정했다. local[-996,-1655..1047,168]은 등록[-1040,-1660..1060,180] 안에 있고 상부여유5px. placement(2500,2180,scale1) 및원본불변, world[1504,525..3547,2348]. check-stage10-tree-bounds.mjs는 probe자체clip 없음도 검사하며 PASS. 상부 수관 잘림은 미관측이다. 접점 카메라에서 화면을 벗어나는 수관은 자산 clipping과 구분한다.

## 상태 및 한계
source12중 일반battle지형11은 indestructible99999, sodan-binding은3366HP 파괴가능questtarget. binding broken 독립fixture3뷰에서 broken이Engine후 유지됨 및 렌더순수성을 확인했고 desktop에서 바깥주박 제거와 주변 접합을 직접확인했다. 실제타격/단계전환을 실행한 것이 아니다.

주박 bound/손상→broken→offering→accepted→protecting, 협력후6턴방어, withdrawal escape→withdrawing→safe 및 문닫힘, 받이진·가림·재진입은 미검수. 모든최대줌/접점위치/모든상태조합 및공개UI 완료를 뜻하지 않는다.
