# SOP v0.1 · 1장 기능 확인된 적용 초안

- [전체](stage1-01-overview.webp)
- [같은 카메라 충돌선](stage1-02-same-camera-debug.webp)
- [실제 게임 배율 고목/바위](stage1-03-pine-rock-contact.webp)

승인 재채색1870×841을 uniform6000/1870배, 6000×2698.3957world로 사용한다. 근경에 이전 .62 밝기 필터를 적용하지 않으며 독립 quietFar/기존 날씨·물 루프를 유지한다. 소스 blob은 전달값과 동일하고1장 근경과 quietFar만 요청한다.

주 경로 이동·일반 점프로 오른쪽 높은 출구 도달/arrival 준비, 고목 가지 접근, 상부 선택 사격대 접근을 적 없는 지형 fixture에서 확인했다. 초기 적8개/ID별 능력/행동 cap2를 보존하며 지상 접지/비행 여유를 확인했다. 확장된 지형을 옛 playProjection5400폭으로 잘라내던 상속값을 제거했고1장 revision3만 적용했다. 전체 방어전/기예/verify는 실행하지 않았다.

기능 확인 초안이며 **추가 돌턱의 단순 다각형 표현은 원화에 더 자연스럽게 섞이도록 미술 보정/부모 검수가 남았다.** 현 상태를 먼저 원격 저장해 전체 구도/재채색 및 지형을 볼 수 있게 한다.2~5장 runtime은 아직 변경하지 않았다. 원본PNG와 lossless1MB미만WebP, 정확한 카메라/실제 확인 범위는 manifest.json에 있다. master/Pages 미반영.
