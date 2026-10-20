# 나루 근경 직접 저작

사용자가 고른 `ferry-outcrop-r25/stage03-normal.png`의 회올리브 암면을 전체 산체로 잇는 작업 소스다. `native-body.svg`는 이미지 추적·시트 반복 없이 직접 만든 Path와 broad linear gradient만 담는다. 기존 16차 A/B/C 원본과 나루의 진행 방향을 유지한다.

근경은 한 장면이다. `stage3-vector-front.js`가 이 원본, A/B/C의 국소 노출부, 같은 공간의 불규칙 지표 상면을 함께 그린다. 보행선 뒤의 가까운 지표를 포함한 독립 시각 외곽을 사용하며 collision polygon으로 전체 장면을 자르지 않는다. 인물은 그 뒤에 그린다. 기존 물리·파괴 발판·퀘스트/표적 좌표는 별도로 보존한다. 새 rear 엔진이나 별도 원경 세트는 없다.

`tools/environment/extract-vector-campaign-parts.py`가 SVG의 실제 경로/gradient를 공통 네이티브 자료로 옮긴다. 배포의 근경 원본은 벡터이며 기존 가시 영역 world tile cache를 쓴다. 화면 전체 거대 캔버스를 매 idle 프레임 다시 그리지 않는다. 원경 이미지는 기존 경로를 유지한다.

실제 화면과 판정은 `game/docs/art-review/vector-correction-v2/manifest.json`의 immutable capture/sourceState를 따른다. 이 README나 경로 수는 미술 합격 증거가 아니다. r42는 전체 공간은 연결됐으나 신규 바위가 너무 크고 단순해 FAIL이다. r25에 맞는 중간 파단면을 추가 교정 중이며 최종 전체 미술 검수와 master/Pages 반영은 아직 없다.
