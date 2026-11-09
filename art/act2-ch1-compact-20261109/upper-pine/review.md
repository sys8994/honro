# Upper pine 제작 후보

B-open 실제 upper 접촉선과 뿌리 소켓을 기준으로 생성·편집·추적했다. 그림 원본에는 배우·지면·원경·UI가 없으며 투명 배경이다. 폭1700×높이850 world, 1774×887 source. 소켓→최고 접촉 높이는308.18 world로92배우3.35명이다.

실제 Inkscape1.4.4 8색 trace raw는 보존했다. 원본 그림 접촉은 최대10.77sourcepx 아래여서, 최적화 전에 동일 상부 목재색의3~14.41px 인접 밴드를 추가하고 실제 native union/intersection으로 접촉을 등록했다. 이 편집은 손실 없는 최적화로 계산하지 않는다.

색만 비교한 simplify0.0001은 실제 엔진에서 보호부 silhouette1px 차이가 생겨 반려했다. precision6를 채택해 실제 기존 HonroVectorArt의 등록raw→final을1x/2x 비교했다. 보호 silhouette0px, RGB MAE0.00103/0.00057로 기존 한도 내다. 원본 SVG→engine AA 비교는 보호 silhouette1px로 별도 미통과이며 최종 장면 접합 검수가 남아 있다.

전체와 접촉·뿌리·세 갈래 빈 공간200%를 직접 열어 비교했다. 큰 줄기·뿌리·구멍 형태가 보존됐다. 오른쪽 끝은 접촉 등록으로 작은 직선 캡이 보이고, needle 색은8색 추적에서 갈색에 가까워졌다. 미술 승인은 하지 않았다. root 소켓 아래로 뿌리끝이 약70sourcepx 내려가므로 BODY 뒤에 묻히는 실제 접합을 확인해야 한다. 하단 통로 배우가 나무 앞에서 지나가는 L1-back 연출이 필요하다.

`final-world.asset.json`은 좌표 변환이 내장되어 world(0,0),scale1 배치다. `final.asset.json`은 source좌표이므로 world(1650,1650),scale1700/1774 배치다. 동시에 변환하지 않는다. 최종메타데이터와 hash는delivery.json. 실제플레이·브라우저·배포는 이 자산 작업에서 수행하지 않았다.

자동 trace/render/optimizer 출력 보고서와 PNG는 `_local/reports/act2-redesign-20261109/upper-pine-production/`에, 반려 Boolean·simplify 후보는 `_local/archive/act2-redesign-20261109/upper-pine-production/`에 보존했다. 원본 source·native RAW·접촉 등록 RAW·최종 SVG/JSON·설정·재현 script는 art에 남긴다.

## pine 잔여halo source 교정

후속공통Scene center에서가지아래·구멍·뿌리에밝은점선이보여재조사했다. 원본가시/opaqueRGB최대[115,96,83],opaque중앙값[90,72,62]인데유일한색역외pass는fullcanvas#fefefe underpaint였다. 이path8만기존midwood#57453b로실제Inkscape object-set-property 편집했다. RAW및precision6양쪽에서모든path d·나머지7core색·접촉등록밴드d가문자열완전동일함을assert했다. 원본이미지/nativeRAW/등록alpha는불변이다. 새source저작은edge-authored/로분리했으며손실없는최적화로계산하지않는다.

compiledworldvector전후차이도fill1개뿐이고clip/transform/bounds/reference/foot/anchor/collision은동일했다. 실제L1before/after의nearwhite(alpha>=128,RGB>150)는1233→0px,alpha전후변경0px였다. 원본alpha경계안쪽거리90%가1px이하,최대4px의가장자리흰혼합이었다. 실제뿌리·구멍·왼끝200%를직접열어밝은점선제거와구멍/얇은뿌리보존을확인했다.

새source저작RAW/FINAL을기존L1및gameplaycontext1x2x로비교해보호silhouette0px,보호RGBmax0.000759/255로모두기존한도통과했다. 전체silhouette최대1px은기존1.5px한도안이며보호부0이다. 최종worldasset599,339B. 실제공통Scene재캡처검수는별도항목으로기록한다. 브라우저·실제플레이·배포통과는이수치가증명하지않는다.
