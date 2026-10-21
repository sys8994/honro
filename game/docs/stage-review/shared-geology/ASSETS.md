# 공통 화강암 모듈 — 원본과2장 배치 검토 후보

모두 이미지 생성/래스터 편집 없이 제작한 SVG이며 기존 compileSVG→공통 Library→Scene.landmark→HonroVectorArt.draw 경로를 사용한다.2장/12장 좌표나 나무/캐릭터/발판은 자산에 없다. foot는(0,0), collision은 비어 있고 rearOnly/noWalkRim이다.

| assetId | 원본 | bounds | heightM | scaleRange | 부착 |
|---|---|---|---|---|---|
| geology:granite-vertical | shared/assets/environment/geology-granite-vertical.svg | -1040,-2330,2080,2360 |2330/60|.85–1.1|foot를 뒤쪽 기반에, upper/middle/lower-rear socket을 지지 접점으로 사용|
| geology:granite-foundation | shared/assets/environment/geology-granite-foundation.svg | -1120,-870,2240,900 |870/60|.85–1.15|foot를 뒤쪽 기반에, mass-seat는 위 암벽과 겹치는 접점|
| geology:granite-ledge-neck | shared/assets/environment/geology-granite-ledge-neck.svg | -350,-560,700,590 |560/60|.65–1|foot는 아래 지지면, ledge-back(0,-460)은 실제 암턱 뒤쪽 접점|

등록: tools/environment/build-geology-art.mjs, 공통 빌드 호출 shared/build.mjs. 소품은 별도 자산으로 둔다. native 원본은 인물 높이92 대비 폭4–8명 정도의 중간 암반을 중심으로 두 큰 봉우리/한 낮은 어깨가 연결된다. 좌상단 광원·찬 회색 팔레트는 기존 act1-scene:valley-granite에 맞췄다.

원본 첫 검수에서 반복된 밝은 상면 띠와 세 봉우리의 규칙성이 보였다. 중앙 능선을 낮추고 밝은 면을 좌상단의 부분 풍화면으로 축소해 재렌더했다. source-review의 전체(.98/1배)와 상/하부1배 근접, 지지/연결 원본 및 같은 인물/세계 배율의 기존 화강암 비교를 직접 열었다. 이는 배치 적합성 검토용 원본 후보이며 부모 미술 통과나 장 개편 완료가 아니다.

최종 원본은 source-final이다. 배치 첫 검수 이후 반복 상면8개를 제거하고, 동쪽 중간 돌출부를 위로 엇갈리게 옮겼다. 전체/상부/하부/지지/연결/기존 자산 비교6장을 다시 직접 열었다. 원본 자산은2,080×2,360/2,240×900/700×590이며 새 나무나 발판이 포함되지 않는다. 기존 화강암의 넓은 명암 면과 연결하되 풍화 모서리를 더 둥글게 다듬은 후보이다. 둥근 덩어리가 쌓인 인상까지 완전히 해소했다고 판단하지 않는다.

shared/runtime/geology-art.js의 prepare/draw가 공통 배치 경로다. 실제 terrain 지지점 또는 명시한 비충돌 rearDatum에 foot/socket을 맞춘 canonical-element를 Scene.landmark로 그린다. 뒤쪽 장식 기반은 보행면이나 새 충돌이라는 뜻이 아니다. 재사용 검사는 합성된12장 크기/좌표 예제에 세 자산을 동일 원본으로 배치해 평행 이동과 상태 불변을 확인한다. 실제12장 지도는 수정하지 않았다.

2장 인스턴스는 tools/environment/act1-scene-composition.mjs의 design.geologyComposition에만 있다. 수직4/지지4/연결7개이며 원본 배율 범위 안에서 두 실제 절벽과 화면 외곽을 잇는다. Stage2 전용 렌더에는 색면/경로 목록을 추가하지 않는다. 세부 검수와 미해결 문제는 [FINAL_REVIEW.md](FINAL_REVIEW.md)에 기록했다. master 통합/배포는 하지 않았다.

재현: node --expose-gc tools/testing/geology-modules-native.mjs OUTPUT. Native Scene/공통 벡터 출력이며 게임 HUD/전체 전투 증거가 아니다. tests/geology-modules.mjs는 기존30장/Library 무변경(3자산 등록 외), 등록 재실행·metadata·socket·zero collision을 검사하며 자동 미술 판정을 하지 않는다.
