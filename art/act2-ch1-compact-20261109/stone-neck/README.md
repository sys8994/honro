# 낮은 돌목 아치 — 제작 후보

선택 파일은 `optimized-v1/final.svg`(86,725B), `runtime/final.json`(88,604B)이다. 장면·정상 플레이·사용자 미술 승인은 아니다. `DELIVERY.json`에 선택 파일/해시/한계를 고정했다.

가이드2048×1024와 생성 원본1774×887을 혼동하지 않았다. 원본을 리사이즈하지 않고 실제 크기의1.10875pixels/world, source→world0.9019165727 균등 변환으로 worldBox[2200,1900,1600,800]에 등록했다. contact source=(166.3125,376.975),(554.375,354.8),(1086.575,354.8),(1441.375,388.0625)이다. source는 root가 기본 imagegen으로 제작한 원본과 실제 프롬프트를 보존한다.

실제 Inkscape8색/smoothtrue/colorSpeckle16·별도nativealphaSpeckle0을 사용했다. 첫 v1은 폴더명과 달리 smoothfalse/speckle0임을 실제 로그로 밝혀 보존하고, 정확한 인자8 16 true로 v2를 다시 추적했다. 실제 native RAW110,575B에서 동일한 topsoil 역할의 인접brown 두색만 native path-union으로 정리하고, 정확한 full-page white trace background만 main-gray underpaint로 바꿨다. 이끼olive와명암 역할은 유지했다.

원본 접촉 오정합은 기존 nativealpha를 안쪽 group에 그대로 둔 채 별도14source-pixel top-fill band를 뒤에 놓고 새 바깥 group에 실제 Inkscape contact clip을 적용했다. 하부 아치 형상을 코드로 새로 그리지 않았다. y440..887 alpha 픽셀 변화는0이다. 실제 중앙하부floorx2680..3180과44×89world 배우 사각형은 arch alpha와 겹치지 않았고 최소 머리 여유는71.25world다. 상승합류의 끝부분은 후면아치/전경길 관계를 실제 장면에서 별도로 봐야 한다.

source→native RGB MAE1.077/255, palette/underpaint 의도저작.147/alpha0, contact 의도저작.309를 최적화와 분리했다. 동일 authoredRAW에서 nativeSimplify 두 후보와precision6을 독립 제작·측정했다. precision6만 선택했으며 구간/segment 수는 줄지 않았다. 최종10paths(clip포함),75subpaths,2010segments,maxpath21727자,embeddedimage0이다.

기존 HonroVectorArt/HonroEnvironment 검증0오류, 같은 engine RAW→FINAL1600/2640/3200px는 RGB·alpha·접촉·하부 보호영역 모두0오차다. 별도 SVG reference→engine RAW의1pxAA차이는 접촉 픽셀 한도에 미달하므로 미통과로 남겼다. 원본/추적/저작 전체와 실제engine 일반·200%접촉/하부개구부를 직접 보았으나, 공통 Scene의 앞길/뒷암대·모바일/최소줌·브라우저 실제 플레이/성능·배포 검수는 부모의 후속 범위다.

자동 렌더·비교·손실·clearance보고서는 `_local/reports/act2-redesign-20261109/stone-neck/`, 이전 trace설정/거절후보는 `_local/archive/act2-redesign-20261109/stone-neck/`에 보존했다. 실제 이동표는 `RELOCATION.json`이다. art에는 source·guide·prompt·actualnativeRAW·authoredRAW·선택final SVG/asset·설정/재현script를 남겼다.
