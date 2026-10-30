# 클릭 후 진입 성능 조사 — 2026-10-21

기준 실행 코드/배포 master: `583f3c5cadf3ea1c2d436be7a57c2483761c551e`. 작업 브랜치: `codex/entry-render-performance`. 이 후속 작업에서는 유효한 추가 속도 개선을 확인하지 못했다. 실험용 실행 변경은 모두 되돌렸고 검수 자료와 재현 도구만 남긴다. 초기 준비시간 증가·다른 대기화면·진행률 숨기기를 개선으로 계산하지 않았다. 지형·스테이지·이미지 원본은 변경하지 않았다.

## 원인별 관측

390×844 Chromium 모바일 모사, CPU slowdown4, DPR1. 계측 실행은 비교 측정과 별도로 수행했다. 다음은 개별 표본이며 포함 관계가 있어 합산하지 않는다.

- 새 시작은 쉼터와 첫 대화를 함께 만든다. `showRest` 약284~327ms. 대화 초상화는1200×1500 임시 Canvas에서 실제 벡터 인물을 그리고 alpha bounds를 계산한다. `unit` 약29~33ms, getImageData 약19~21ms. 이미지 파일을 여러 번 디코딩해서 초상화를 만드는 구조가 아니다.
- 21장 이어하기: `continue`349ms 안에 mount304ms, 그 안에 HUD220ms, 초상화4개154ms가 포함됐다. 초상화별600×750 임시 Canvas4개, readback 합25ms, unit 합64ms. 네 인물의 HUD가 실제로 표시되므로 단순히 일부를 숨기거나 뒤로 미루지 않았다.
- 첫 전투 render는 표본에 따라296~402ms. 정적 지형 타일 약91~118ms, 원경 약37~63ms, 가림 실루엣 약31~45ms. 첫 화면에서 생성한 타일은3개였다. 전체 지형을 미리 그리는 것이 아니며 타일별 terrain4회, 가시성 검사99회(합2~6ms), surfaceZones3회(합1~2ms), terrainReadability3회(합11~22ms)였다. 이 결과로 전 맵 사전 준비나 가시성 검사 하나를 주범으로 지목할 수 없다.
- 후속 원경 이미지 준비와 화면 raster cache 생성 때문에 두 번째 frame도 첫 frame보다 항상 가볍지는 않다. 첫 두 frame 이후에는 같은 카메라의 기존 캐시를 사용한다. 처음 필요한 출력까지 생략하는 변경은 하지 않았다.
- 프로파일의 나머지 시간에는 Canvas 실제 그리기/동기 readback, 레이아웃, JS 호출/프레임 처리 등이 포함된다. GPU/컴포지터 시간을 완전히 분리한 Android 실측이 아니므로 숫자를 순수 JS 실행 시간이나 실제 화면 표시 완료 시간으로 단정하지 않는다.

## 실험과 폐기 이유

초기 스크리닝은 조건별3회, CPU4, 로컬 무제한 HTTP에서 도구 wrapper를 넣고 비교했다. 아래는 클릭 이후 두 rAF 중앙값(ms)이다. 표본 순차 실행이며 이를 통계적 효과로 주장하지 않는다.

| 실험 | 새 시작 | 21장 이어하기 |
|---|---:|---:|
| 원본 | 322 | 1079 |
| alpha bounds를 행의 첫/끝 불투명 픽셀로 계산 | 355 | 1032 |
| 쉼터 첫 layoutRest 중복 호출 제거 | 336 | 1123 |
| 위 후보 + willReadFrequently Canvas | 336 | 1174 |
| 위 layout 후보 + 초상화 Scene 재사용 | 362 | 1131 |

픽셀 스캔 변경은 새 시작을 개선하지 못했고 이어하기 차이도 다른 표본 변동과 비슷했다. willReadFrequently는 readback을 빠르게 만드는 만능 옵션이 아니며 이번에는 그리기/전체 진입에서 이득이 없었다. 초상화 Scene 재사용은 인물별 새 Scene이 공통 인물 Path2D를 준비하는 중복을 줄이는 가설이었다. 실제 전체 진입 이득이 없고 캐시 수명·NPC 렌더 상태 공유 위험이 추가되므로 폐기했다. 저장소의 기존 source별 캐시는 유지한다.

가장 작은 후보인 `startMotion`의 첫 layoutRest 호출 제거를 분리해 추가 교차 측정했다. mountRestCamera 안에서도 layoutRest가 호출되지만, 중간 style write/layout flush가 있어 겉으로 중복처럼 보인다고 전체 성능 이득을 보장하지 않는다. 후보의 정확한 diff는 evidence/candidate.patch에 있다. 해당 patch는 적용되지 않았다.

## 교차 측정: 작은 후보도 채택하지 않음

기준 배포물과 후보 빌드 스냅샷을 각각 고정했다. gzip6 HTTP서버, CPU4, latency40ms, download2MiB/s,390×844. 각 조건5회, 반복마다 before→candidate / candidate→before 순서를 번갈아 총40회 탐색했다. cold는 새 context, warm은 같은 context 재방문. 매 탐색에 동일 synthetic21장 저장을 주입한다. HTML/정적 자산 max-age600은 실험 서버 설정이며 실제Pages 캐시를 측정한 것이 아니다.

| 조건 | ready 기준→후보 ms | 클릭 후 기준→후보 ms | 클릭 후 기준 범위 | 후보 범위 |
|---|---:|---:|---:|---:|
| 새 시작 cold | 1426→1379 | 353→396 | 311–393 | 376–424 |
| 새 시작 warm | 666→718 | 217→246 | 197–242 | 228–268 |
| 21장 cold | 1534→1542 | 1244→1239 | 1122–1314 | 1152–1303 |
| 21장 warm | 957→925 | 748→787 | 729–887 | 730–939 |

ready는 준비 marker 관측, 클릭 후는 실제 trusted click capture부터 두 requestAnimationFrame까지다. 이전 인트로 보고서의 Playwright 화면/audio 검사 후 두rAF 수치와 관측 지점이 다르므로 서로 직접 비교하면 안 된다. 이 지표도 원경 모든 픽셀의 디코딩·GPU 표시 완료나 실제 모바일 입력 지연을 모두 의미하지 않는다. 오디오 context running은 별도로 확인했다.

새 시작은 오히려 늦고, 21장 cold의 약5ms 차이는 범위에 비해 미미하다. 시작 전 준비 경로는 동일한 후보인데 ready에도 수십ms 편차가 발생했다. 따라서 이 결과를 개선으로 채택하지 않았다. “더 빠르게 만들 수 없다”는 증명이 아니라 이번 네 후보에 실질 이득이 없다는 근거다. 기존에 적용한 인트로 준비 약0.2초 개선 외에 추가 성능 개선을 보고하지 않는다. 클릭 후 지연은 남은 문제다.

다음 최적화는 실제 기기에서 벡터 body/가림 합성·초상화 raster 생성의 CPU/GPU 비용을 분리하고, 시각 출력·캐시 무효화·애니메이션을 보존하는 공유 raster/geometry 설계를 검증해야 한다. 해상도·실루엣·가림 정책을 낮춰 시간을 줄이는 방식은 이번 결과에 포함하지 않았다.

## 검수와 evidence

실험 코드를 되돌린 최종 실행 상태에서390×844/1280×800 각각 새 시작·21장 이어하기의 정상/최대 줌을 확인했다. 쉼터 wheel 최대1.35, 전투 공용 zoom 경로 최대1.65, 실제 이미지 원경 readiness, audio running,21장/3턴 및 저장된21장 유지, 현재장만 준비([1] 또는[21]), pageerror0을 확인했다. 대화는 실제 대화 넘기기 버튼으로 완료했고 전투 스크린샷은 실제 턴 배너가 사라진 뒤 촬영했다. 검사 때문에 그림·HUD를 숨기지 않았다. 저장 세부 항목·실패 재시도 검사는 기준 SHA 통합 때 통과한 startup stage-checks 결과를 재사용한다. 이번에는 실행 변경이 없으므로 전장 검사를 반복하지 않았다.

Library 업로드는 기존 반복 network 오류 이후 더 시도하지 않았다. 사용자 요청에 따라 민감정보 없는 게임 화면만 Git evidence로 제공한다. [evidence 폴더](evidence/entry-render-2026-10-21/)에9장의 PNG, checks.json, paired.json(원시40회), paired-summary.json, experiments.json, 미적용candidate.patch를 저장했다. 이는 로컬 실제 화면이며 Pages 직접 검증 사진이 아니다. 공개사이트403은 다시 시도하지 않았다.

재현: `tools/testing/entry-render-performance.py`는 HONRO_ENTRY_BEFORE/HONRO_ENTRY_CANDIDATE에 고정 배포물 루트, HONRO_ENTRY_SAVE에 synthetic 저장 JSON 경로를 받는다. REPS 기본5이며 출력은 `_local/reports/entry-render/paired.json`이다. 세부 Canvas/메서드 계측은 `tools/testing/entry-render-profile.py`에 같은 HONRO_ENTRY_SAVE를 전달한다. 실제 원시 계측과 사진 재현 스크립트는 `_local/reports/entry-render/`에도 보존했다.

버튼 제거 확인용 [세로 인트로 PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/evidence/entry-render-2026-10-21/verified-title.png)를 추가했다. 390×844 로컬 Chromium에서 실행 SHA `583f3c5cadf3ea1c2d436be7a57c2483761c551e` 통합 검수 때 촬영한 원본이며, 하단 왼쪽 Workshop Map 버튼이 없고 중앙 새 시작 버튼이 표시된다. 원본 `_local/reports/intro-audit/verified-title.png`와 바이트가 동일하다. 이후 후속 실험은 모두 되돌렸으므로 이 브랜치의 실행 코드와도 같다. 공개 Pages 직접 촬영 또는 최신 9장 작업 검수 이미지로 해석하지 않는다.
