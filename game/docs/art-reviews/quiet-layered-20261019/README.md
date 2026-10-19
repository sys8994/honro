# 승인 절제 레이어 · 실제 검수 화면

2026-10-19 마감 source commit: `c351b705bd7190a673966ce41708196b7f8a9b6e`. master/Pages 미반영.

이번에 새로 촬영한 1440×960 Chromium 화면은 아래 세 개뿐이다. PNG를 무손실 WebP로 변환했으며 디코딩 RGBA는 원본과 완전히 일치한다.

- [2장 일반](stage2-quiet-01-upper-and-procession.webp)
- [2장 동일 camera collision debug](stage2-quiet-02-same-camera-collision.webp)
- [1장 일반](stage1-quiet-01-normal.webp)

원화/색은 그대로 두고 1·2장 전용 원경 framing만 조정했다. 2장 시작 바위와 오른쪽 큰 바위 상면 contact를 원화에 맞췄다. 오른쪽 마지막 접근점은 낮은 정상부 source x1500이며 일반 점프 후 정상부를 걸어 올라갈 수 있다. 지형 추가/원화 변형은 없다.

기존 `stage1-quiet-02-same-camera-collision.webp`, 두 장의 `03-zoomout.webp`는 **마감 전 보존 화면**이다. 이번 1장 일반 화면과 동일 framing으로 재촬영한 debug가 아니다. manifest의 captureStatus/source commit으로 구분한다.

build·시작 grounding·바뀐 양쪽 상면 접근의 일반 점프·오른쪽 정상부 보행만 확인했다. 이번 세 화면 pageerror0이며 aspect/zoom cover는 소수 수식 입력으로 확인했다. 전체 전투/호송/저장/스킬/다른 장 검사는 반복하지 않았다.

Library의 승인된 재시도도 `hosted apps tools/list request failed: network`로 실패했던 상태이므로 부모가 승인한 기존 Git evidence 경로로 전달한다. 이번 작업에서 Library 재요청은 하지 않았다.
