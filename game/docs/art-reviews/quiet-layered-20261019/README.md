# 승인 절제 레이어 · 실제 검수 화면

기존 Chromium 캡처 6개를 그대로 전달한다. 재촬영·추가 기능검사·그림 변경 없이 PNG를 무손실 WebP로 변환했다. 각 파일의 디코딩 RGBA가 원본 PNG와 완전히 일치하며 크기는 1440×960이다.

1장 source commit: `59f40888dc8a5443ca8a141447d31a07b325aeb8`

2장 source commit: `42cbcb5fade6e14cd2cc7267e57e7ad32a3736fa`

각 장 01은 일반 화면, 02는 같은 위치의 실제 collision debug, 03은 줌아웃이다. 파일별 경로·크기·동일 픽셀 해시는 manifest.json에 기록했다.

Library 저장은 승인된 1회 재조회에서도 `hosted apps tools/list request failed: network`로 실패하여 부모가 승인한 Git evidence 경로로 전달한다. 이 브랜치는 검수 산출물 전달용이며 master/Pages를 변경하지 않는다.
