# 3막 고밀도 도시 공통 재료 · 추가 3종

기존 성문·담장·관창 3종과 같은 palette/side-view/공통 SVG 경로로 회랑·기록고 내부·돌다리를 더했다. 운영 registry·campaign·shared build·두 HTML에는 포함하지 않는다. 도시 prototype에 제공하는 **비활성 재료**이며 맵 선택, 궁궐 정체, 이야기·장부 내용, 물길, 적과 기믹을 확정하지 않는다.

소스는 `workshop/drafts/act3-town-assets/`이며 추가 metadata는 `dense-extension-manifest.json`이다. 기존 `manifest.json`은 처음 3종 그대로 보존한다.

## 구조와 사용 계약

- `open-two-storey-gallery.svg`: 폭 1460, 높이 620의 뷰박스. 마루 상면은 −18/−234, 층간 216. 중앙은 앞벽과 난간 없이 열고 양 끝만 낮은 난간을 두었다. 바닥 아래 부재 끝은 −205이므로 아래층 실제 수직 여백은 187이다.
- `archive-cutaway-frame.svg`: 폭 1500, 높이 825의 뷰박스. 3칸의 절개 내부, 바닥 상면 −18/−234/−450. 상층 마루는 X 391에서 끝나 오른쪽 계단 여백을 남긴다. 계단 자체는 그리지 않았다. 바닥 하단은 각각 −203/−419로 아래층 실제 여백 185를 남긴다. 서가는 익명 묶음이며 이야기 단서를 넣지 않았다.
- `three-arch-stone-bridge.svg`: 폭 1500, 높이 340의 뷰박스. 실제 상판 상면은 Y=−264, 접지는 Y=0. 세 홍예는 투명하며 물 표현을 내장하지 않았다. 낮은 난간 받침은 뒤쪽 시각재료로, 보행을 가로막는 장애물로 자동 변환하지 않는다.

세 재료의 anchor/foot은 `(0,0)`이고 원본 SVG와 world unit은 1:1이다. `scaleRange`는 0.85–1.65를 허용한다. 배율1.5일 때 층간은324이지만 보 두께를 뺀 순수 통로는 회랑280.5/기록고277.5다. 캐릭터 몸높이92의3.5배인322를 통로의 최소 높이로 삼는 맵이라면 이 배율만으로는 충족하지 않는다. 더 큰 배율 또는 별도 배치/구조 조정과 검증이 필요하다. 높이 차를 점프만으로 오를 수 있다고 보장하지 않으며, 실제 연결 계단·중간참·머리 여유·발판 끝의 충돌은 prototype 담당이 확인한다.

## 그림과 물리의 분리

모든 `collision`은 빈 배열이다. `suggestedSolids`는 선택 가능한 지형 제안이며 자동 등록 코드가 없다. 회랑/기록고에서는 마루만 제안하고 뒤쪽 기둥·서가·대들보 전체를 충돌 사각형으로 만들지 않는다. 열린 앞면과 오른쪽 계단통을 유지해야 한다.

돌다리 `arch-body`는 SVG 내부의 cubic 홍예를 각각12분할해 만든 단일 오목 polygon이다. 세 아치의 아래쪽이 열린 실루엣이며 전체 bounds 사각형으로 대체하면 수로를 막는다. `level-coping`은 얇은 수평 상판이다. 이후 맵은 이 제안의 material, 지형과의 이음, 교대/교각 접지를 실제 정본 terrain polygon으로 확정해야 한다. 깊은 강에 놓을 경우 그림의 기둥이 허공에 뜨지 않게 바닥을 맞추거나 별도 긴 받침 재료를 설계한다.

## 검증과 시안

```sh
node tests/act3-dense-assets.mjs
node tests/act3-dense-assets.mjs --check-baseline
node tools/environment/preview-act3-dense-assets.mjs
node tools/environment/preview-act3-dense-assets.mjs --clean
```

검사는 XML, 기존 compiler/VectorArt, 안전 어휘, 실제 paint/처마 bounds, 9개의 투명 영역, 11개 접지점, 6개의 실제 바닥 상면, 7개 제안 polygon과 그림의 일치, 경로 캐시, 390px 카드에서 비율을 유지한 축소, 활성 입력의 draft 등록 금지를 확인한다. `--check-baseline`은 제작 기준 c0b6672와 활성 원본·두 HTML의 바이트 동일성을 확인하는 선택 증명이다.

Native 시트와 검사 수치는 `_local/reports/act3-dense-assets/`에 생성한다. 깨끗한 사용자용 PNG는 기술표기를 제외하고 미술 재료 시안임을 표시한다. 실제 Game/Workshop UI, 물리 통과, 점프·계단 완주, 성능, 최종 map/미술 승인의 증거와 구분한다.
