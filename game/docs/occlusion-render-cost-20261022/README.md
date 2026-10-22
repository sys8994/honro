# 실루엣 합성 비용 · 2026-10-22

정상 idle의 느슨한 covers 후보가 실제로는 빈 마스크인 낭비를 확인했다. 수정 후보의 채택 여부는 후속 동일 픽셀 및 wrapper 없는3회 A/B 결과로 판단한다. 원래 점증 렉 전체의 원인 입증은 아니다.

기반은 architecture546f와 settledHits 정리를 포함한 `1c397248f42f365593be3a154c06d6d1ee5b2ac5`다. master/Pages를 변경하지 않는 별도 `fix/occlusion-render-cost-20261022` 브랜치다.

## 초기 분리 결과

Chromium headless,1280×800/DPR1, seed899411, 기존 QA level10 fixture. camp에서84 icon cached/active0/queued0/failed0 확인 뒤 현행11장 새 진입, 도입 대화 종료, 생산 App/Story의 정상 시작 배너 종료,900ms warmup, 자연 App rAF120frame. Stage11 미술·유닛 배치·게임플레이를 변경하지 않았다. 물리 기기 검사는 아니다.

`baseline-phase.json`은 renderer 메서드의 진단용 소스 복사에 시계만 삽입한 별도 실행이다. Canvas 명령 제출 및 그 시점에 발생하는 지연 작업의 elapsed이며 GPU pass/순수 CPU 분해가 아니다. production 소스나 빌드에 진단 훅은 없다.120frame의 총 silhouette608.7ms 안에서 setup/clear2.5, body redraw39.1, cover redraw26.4, color1.1,8방향 확대58.2, edge subtract0.2, edge intersect29.7, body intersect0.3, 최종2복사447.0ms다. 실루엣과 그 내부 단계를 다시 합산하지 않는다.

`baseline-alpha.json`은 **별도 readback 진단 실행**이다.120개 후보 모두 body/edge 최종 alpha가0이었다. 활성 설오(x720)와 뒤 순서 소단(x615)의 느슨한 covers 조건이 통과하지만 실제 몸·윤곽은 겹치지 않았다. 양의 alpha를 가진 화면 밖 후보는 이 idle 표본에 없었다. 이 파일의 `total`은 강제 readback/JS scan이 섞인 진단 elapsed이며 성능 근거로 사용하지 않는다. 빈 마스크 진단은 그 상태에서만 성립하며 임의 자세·충전에도 계속 빈 것으로 추정하지 않는다.

재현: `BUILD_ROOT=/workspace/honro-occlusion-baseline MODE=phase RUN=baseline-phase FRAMES=120 python tools/testing/occlusion-render-cost.py`, 별도 `BUILD_ROOT=/workspace/honro-occlusion-baseline MODE=alpha RUN=baseline-alpha FRAMES=120 JPG=1 python tools/testing/occlusion-render-cost.py`. source/build/도구 해시는 JSON에 있다. 원자료 및 자연 상태 JPG(<1MB)는 evidence에 보존했다. 두 최초 도구 준비 실패(브라우저 메서드 문자열의 따옴표 차이, 기본 npm cache 경로 부재)는 production 실패가 아니며, 각각 원본 source 기반 주입 및 `/tmp` npm cache 지정으로 해결했다.

## 단일 후보와 품질 경계

현재 후보는 기존 body/cover를 동일384×384·동일rs·동일 위치에서 그대로 재드로잉한다. 이 draw가 실제 사용하는 리그 행렬·경로의 control hull을 stroke/AA 여유와 함께 얻고,8방향 팽창 반경+필터 여유를 더해도 cover hull과 교집합이 없을 때만 이후 color/팽창/교집합/복사를 생략한다. 드로잉 전에 자세를 추정하거나 고정하지 않고 pose state 갱신과 `_occludedUnitIds`도 보존한다. 새 unit bitmap/cache, frame skip, lower LOD/해상도, 예측 궤적 변경은 없다.

경계 수집은 occlusion의 private context 요청이 있을 때만 작동한다. 정적 경로 hull은 기존 리그 renderer별로1회 파싱한다. 현재 absolute M/L/Q/C/Z의 모든 제어점 convex hull만 지원하며 arc/relative/알 수 없는 경로·debug는 null을 반환해 기존 전체 합성을 유지한다. 실제 현재 flex bow·활줄/화살·휘는 부적은 현재 생성 경로를 포함한다. 몬스터/보스/다른 body renderer 역시 경계를 제공하지 않으므로 전체 합성을 유지한다. 경계 정보는 해당 draw 중에만 존재한다.

초기 checker의15개 실제 Scene 사례×6frame에서 RGBA 정확 일치, pose state/후보ID/전투 JSON 일치였다. 정상 idle·charge는78→0회, 실제 겹침·충전 활/지팡이/검/부적·천·outline여백·큰boss·날개·viewport edge·portrait/DPR2·landscape는78→78회였다. Preview는 기존처럼0→0회다.4동행×2facing×5동작의40 mask에서도 hull 밖의 alpha가0이었다. 이 checker는 별도 readback/고정 render fixture이며 성능 근거가 아니다. 최종 clean SHA의 결과와3회 A/B는 다음 기록에 남긴다.

일반 build가 갱신한 party/actor runtime은 source SHA stamp만 바뀌었고 실제 asset JSON은 동일하다. HTML/web는 전체 공통 빌더 산출물이며 직접 수정하지 않았다. master·Pages·11장 미술 source·main/UI·정적 지형 캐시·엔진·밸런스는 변경하지 않는다.
