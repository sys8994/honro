# 폐기한 실험

이 폴더의 frame/rAF 수치는 **최종 원경 준비 조건을 교정하기 전** 스크리닝이다. 원경 폴백/최종 그림의 준비 시각과 큰 실행 편차가 섞여 있어 최종 효과나 회귀 원인으로 사용하지 않는다.

- `tile-lru.patch`: 미커밋 벡터 타일 다중 LOD/LRU/캔버스 재사용 후보. 관련 `unprepared-*cycle*.json`은 같은 저장의 반복 줌 raw다. 타일 할당 감소와 보유 메모리 증가가 관측됐으나 체감/frame 개선을 입증하지 못해 폐기했다.
- `screen-buffers-final-after*.json`: `bd3b2c18552ae19dbded5096501b97ee470256a6`의 화면 버퍼 재사용+근접 캐시 중간 후보. 최종 실행에 없다.
- 원경 준비 조건을 바로잡아 다시 측정한 유효한 근접6줄 후보 비교는 상위 `measurements/verified-before*.json`, `verified-after*.json`이다. 이 후보(`1ba769a8`)도 결과가 혼재해 폐기했다.

최종 `b013e3458181d73f7a3af70128348af8ec41c289`의 실행 바이트는 원본 `f8cc1a82`와 같다. 과거 실험 커밋을 단독 통합하지 않는다.
