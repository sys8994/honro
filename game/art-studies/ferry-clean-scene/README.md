# 나루 근경 저작 — 현재 후보는 실패

사용자가 선호한 r25 회올리브 벡터 암면을 하나의 지형으로 잇는 작업이다. 현재 `native-body.svg`는 `tools/environment/author-ferry-continuation.py`가 공유 지층 윤곽을 먼저 만들고 그 내부에 파단면을 넣은 r48 실험이다. 실제 normal/wide/mobile 검수에서 반복 띠와 과대하고 단순한 침식면이 드러나 실패했다. 이 소스는 출시/채택 후보가 아니라 실패 보존 지점이다.

r47의 A/B/C 콜라주와 변형 조각 채움은 사용자 피드백에 따라 중단했다. 그 원본과 캡처는 Git 및 미술 manifest의 immutable sourceState에 남아 있다. 재질 유사성, 단일 SVG 또는 공유 윤곽만으로 자연스러운 공간 연속성을 판정하지 않는다.

`stage3-vector-front.js`는 시각 외곽과 근경 상면을 캐릭터 전에 그린다. 충돌 지면은 별개이고 전체 근경을 collision polygon으로 자르지 않는다. 앞으로 필요한 앞 가림 요소는 공간상 인물 앞이므로 캐릭터 이후에 그려야 한다. 현재 실험은 그런 요소를 추가하지 않는다. 물리·카메라·퀘스트·캐릭터는 보존한다.

`extract-vector-campaign-parts.py`가 SVG를 공통 native 경로로 추출하며 기존 world tile cache를 사용한다. 실제 판정은 `game/docs/art-review/vector-correction-v2/manifest.json`의 캡처와 실패 근거를 따른다. 부모 승인·최종 전체 미술 검수·master/Pages 반영은 없다.
