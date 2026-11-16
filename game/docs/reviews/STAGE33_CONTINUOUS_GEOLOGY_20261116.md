# 33장 왼쪽 경계·계단 후보 보완

- candidate.json: 후속 편집한 native vector pack. production prefix/등록 규약에 맞춰 통합 필요.
- before/after: 동일한 1440×900, camera(500,1300), scale .53의 production Scene Canvas 합성. 브라우저 실플레이 검증이 아님.
- comparison.png: 위 이전, 아래 수정.
- 지형 충돌/배치/목표를 포함한 gameplay SHA256 전후 동일: b00cc29cb33d7e382950da0d6705faa575d2d6408fd58d1b25b3a3265650d743.

수정: 세계 x0에서 잘린 바위 후면을 외부 지형 벡터로 연장. Inkscape 16색 원화 trace 뒤 노드 최적화, alpha와 동일한 좌표 등록. 계단 sidewall의 잘못된 bounds를 실제 전체 좌표로 수정. 얇은 사각 텍스처 조각 대신 연속된 바위 측면 위 물리 디딤면을 표시. 수직면 표시는 어두운 색으로 낮춰 도식처럼 보이는 문제 완화.

추가 확장 지형 원본: generated_images/exec-ec148566-26df-448a-be54-70dbd194d41b.png (실제 기존 후면 암벽을 참조한 imagegen 원화).
source/: 세계좌표 등록 후 최적화 SVG 및 alpha. 최적화 40065→32870 선분, 684987→579467 bytes, 768/1536px 렌더 오차 검사 통과. 전체 pack은 새 지형이 추가되어 기존보다 큼. 이를 총용량 감소라고 보고하면 안 됨.

남은 한계: 기존 물리 구성 자체의 계단 폭과 각진 아치 모양은 바꾸지 않음. 시작 상부 재질 접합이 완전히 매끈하지 않음. 최종 공개 Pages UI에서 신규 진입과 이동 후 접합 재검수 필요. 게임 원본 소스와 remote는 아직 변경하지 않았음.
