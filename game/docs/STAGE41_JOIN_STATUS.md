# 41장 접합 수정 상태

기준 master `f20e8f4a39470ed632f01c9237cb95d4501c6eb0`. 41장만 작업한다.

원인·native 원본/최적화·채택/반려 범위는 [art README](../../../art/stage41-join/README.md)에 기록한다. 주요 변경은 반복 clip의 단일 coverage화, 서로 배타적인 서쪽 접합 coverage의 정확한 합산, 기존 서쪽 암영색 하나의 조정이다. 원본 근경/모든 충돌/다른 장/대사/진행 데이터는 유지한다.

## 완료 결과 · 2026-11-17

- 소스 커밋 `475658b07d9d4ed5e1a38f6f14b28824a5ff078a`, 공식 CI [44023080093](https://github.com/sys8994/honro/actions/runs/44023080093) 성공.
- CI 산출물 `2fb993a389af8d7504b169d60a4654df913cdb04`을 master에 fast-forward. 전체 tree `04d36178012069f3e1dbff171b0df43f8290a34a`는 로컬 검수 빌드와 동일.
- [Pages 44023734006](https://github.com/sys8994/honro/actions/runs/44023734006) 성공. 공개 HONRO.html/index.html/워크숍/manifest/41장 assets/game entry/ordered-common-18/campaign 8개 파일 바이트가 로컬 빌드와 동일.
- 공개 HONRO SHA256 `3c9bb3d49d882184afa355574c2c616288df6cbe92c1c2a9c842b452400420a1`, manifest `5c3b90372bb599ffb10e02cb9e1b7c3198a01968c6933e6b680c710fee6089fd`.

## 검수 범위와 한계

- coverage 394,049개 내부 표본, original geometry/gameplay 보존, 실제 합성과 독립 oracle 픽셀 차이 0, 실패 경로 scratch 해제, terrain-contact 및 build-retention 회귀 통과.
- Native Scene 1440×900 서쪽/동쪽/전체, 390×844 세로 화면 확인. walkableRemoved 0. 실제 모바일 기기나 FPS 측정은 아니다.
- 공개 새 탭에서 길을 열다 → 여정첩 → 5막 → 41장 → 진입 → 대화 넘기기. ‘디버그 · 기록 분리’를 확인해 일반 저장과 분리했다.
- 실제 공개 화면 서쪽 계단/지지면, 동쪽 및 하단에서 밝은 반복 clip 경계 제거 확인. 원본 얇은 구조선과 디버그 충돌선은 보존되어 보인다. 모든 선이 제거됐다는 주장이 아니다.
- 공개 조이스틱 두 차례 이동: 이동도 1100 → 1000 → 901, HP 365/365, SP 96/96 유지. 시작 발판에서 이동·접지 정상. 전체 경로 이동/전투/완주 또는 게임플레이 정량 기준 검수는 별도다.
- 같은 구도 Native 전후 비교 4개(전체/서쪽)를 Library에 저장했다. 공개 브라우저 캡처와 혼동하지 않는다.

