# 실루엣 합성 비용 · 2026-10-22

정상 idle의 느슨한 covers 후보가 실제로는 빈 마스크인 낭비를 확인했다. 수정 후보의 채택 여부는 후속 동일 픽셀 및 wrapper 없는3회 A/B 결과로 판단한다. 원래 점증 렉 전체의 원인 입증은 아니다.

기반은 architecture546f와 settledHits 정리를 포함한 `1c397248f42f365593be3a154c06d6d1ee5b2ac5`다. master/Pages를 변경하지 않는 별도 `fix/occlusion-render-cost-20261022` 브랜치다.

## 초기 분리 결과

Chromium headless,1280×800/DPR1, seed899411, 기존 QA level10 fixture. camp에서84 icon cached/active0/queued0/failed0 확인 뒤 현행11장 새 진입, 도입 대화 종료, 생산 App/Story의 정상 시작 배너 종료,900ms warmup, 자연 App rAF120frame. Stage11 미술·유닛 배치·게임플레이를 변경하지 않았다. 물리 기기 검사는 아니다.

`baseline-phase.json`은 renderer 메서드의 진단용 소스 복사에 시계만 삽입한 별도 실행이다. Canvas 명령 제출 및 그 시점에 발생하는 지연 작업의 elapsed이며 GPU pass/순수 CPU 분해가 아니다. production 소스나 빌드에 진단 훅은 없다.120frame의 총 silhouette608.7ms 안에서 setup/clear2.5, body redraw39.1, cover redraw26.4, color1.1,8방향 확대58.2, edge subtract0.2, edge intersect29.7, body intersect0.3, 최종2복사447.0ms다. 실루엣과 그 내부 단계를 다시 합산하지 않는다.

`baseline-alpha.json`은 **별도 readback 진단 실행**이다.120개 후보 모두 body/edge 최종 alpha가0이었다. 활성 설오(x720)와 뒤 순서 소단(x615)의 느슨한 covers 조건이 통과하지만 실제 몸·윤곽은 겹치지 않았다. 양의 alpha를 가진 화면 밖 후보는 이 idle 표본에 없었다. 이 파일의 `total`은 강제 readback/JS scan이 섞인 진단 elapsed이며 성능 근거로 사용하지 않는다. 빈 마스크 진단은 그 상태에서만 성립하며 임의 자세·충전에도 계속 빈 것으로 추정하지 않는다.

재현: `MODE=phase RUN=baseline-phase FRAMES=120 python tools/testing/occlusion-render-cost.py`, 별도 `MODE=alpha RUN=baseline-alpha FRAMES=120 JPG=1 python tools/testing/occlusion-render-cost.py`. source/build/도구 해시는 JSON에 있다. 원자료 및 자연 상태 JPG(<1MB)는 evidence에 보존했다. 두 최초 도구 준비 실패(브라우저 메서드 문자열의 따옴표 차이, 기본 npm cache 경로 부재)는 production 실패가 아니며, 각각 원본 source 기반 주입 및 `/tmp` npm cache 지정으로 해결했다.
