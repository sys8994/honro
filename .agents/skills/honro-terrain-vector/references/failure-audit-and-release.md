# 시행착오 감사 색인과 누락 보완

사용자 2026-10-31 11:26 UTC `Sentinel_9a5e266f53388191bc2482aa4bbbf667`: “참고로 너의 시행착오들 전부 잘 파악해놓고 sop에 반영해놔”. 기존 절차를 다시 복제하지 않고 아래 색인에서 연결한다. 확정은 해당 관찰 범위의 원인만 뜻하며 전체 게임 합격이 아니다. 새 실패도 같은 여섯 필드로 기록하고 관련 후보를 재검증한다.

참조 약칭: **G**=`game-integration.md`, **E**=`environment-rollout-corrections.md`, **S**=`sharpness-acceptance.md`. 모두 이 references 폴더 안에 있다. 증거 경로는 프로젝트 기준 `_local/reports/` 아래이며 다른 환경에 없으면 원본 담당자의 artifact를 받아 확인한다.

## 기존 내용의 여섯 필드 감사

| 항목 / 기존 절차 | 증상 | 원인·확실성 | 폐기한 방법 | 채택 해결 | 재발검사·증거 | 남은 한계 |
|---|---|---|---|---|---|---|
| 스켈레톤·참조 G§1 | 보기 좋은 시안과 실제 통로 불일치 | 확정: 스타일 그림/옛 package를 활성 설계로 오인 | 원본 없는 즉흥 좌표 그림, 시안만으로 합격 | canonical·스켈레톤·승인 구도 대조, 물리 proxy 별도 | approved32/README, stage별 보존 검사 | 합리적 구도도 재미 증명 아님 |
| 지리·환경 G 환경 gate | 공중에 뜬 컷아웃·좌우/하부/천장 단절 | 확정: 비플레이 연장 누락 | 줌 제한·단색 slab·반복 절벽 봉합 | 별도 연결 지반/해저/측벽, 실제 허용 viewport | approved31-environment/HANDOFF, 38 환경 HANDOFF | 대표 화면 밖 범위·실제 브라우저 별도 |
| 2.5D·지지 G§1 | 천막 위 적·후면 암벽이 길을 막음 | 확정: 원근 깊이를 같은 solid로 해석 | 가짜 발판·길 평탄화·억지 점프 할당 | 실제 앞쪽 보행 띠/지지·몸체/머리 여유 | approved32/README, 35/README, 39/FAILURE_PREVENTION | 동선 시험 ≠ 전투 전략성 |
| FORE G v40 | 수중 암반이 마른 스티커처럼 덧칠됨 | 확정: FULL BODY 뒤 옛 하단 FORE 중복 | 모든 FORE 삭제·추가 바위로 덮기 | 중복만 제거, 의미 있는 근경 보존 | approved31-environment/physics-invariance-v40, layer-order 화면 | 최종 장면/목격 따로 검증 |
| 거대 배율 E | 바위 facet·나무가 비정상적으로 큼 | 확정: 넓은 canvas를 단일 배율 확대 | 큰 대숲을 그대로 배치 | 원배율 접합 strip + 저대비 심부/외곽층 | approved35-environment/HANDOFF, 38/HANDOFF | 비플레이 접합은 픽셀 불변 강제 아님; 보호 ROI 별도 |
| matte/compound G§2·E | 흰 선·막힌 구멍·색 얼룩 | 확정된 사례: 흰 hidden RGB, Boolean/clip/cursor 손실; 모든 선의 원인은 아님 | 흰색 전부 삭제·전체 Boolean 분해·alpha 계속 축소 | nearest-opaque RGB, 원본 alpha/order/compound, bounded dParts | approved36-environment, 40/FAILURES, 원본/import 비교 | 기존 BODY 전체 재trace는 palette 변화 가능 |
| Native/Chrome E | clip/saveRestore 두 방식 결과가 다름 | 확정: Native 최소재현 차이, Chromium154 동일 | Native만 보고 공유 renderer leaf 변경 | Native QA workaround 격리, Chrome 최종판정 | approved36-environment/clip-save-restore-repro.html, BROWSER_HANDOFF.json | Native diff0을 다른 renderer로 일반화 금지 |
| smoothing/색수 S§2 | 둥근 edge·색띠, 저색수에서 목재 녹색화 | 확정: 31의 12/16/20색 재질 손실 | 전역 색수 절감·후처리 sharpen | 의미 팔레트 유지, smoothing=false 등 장별 선택 | sharpness stage31 HANDOFF, protected alpha/geometry | 설정은 source별 재검증; 숫자만으로 미술 승인 금지 |
| DPR/캐시 S§1 | 확대 흐림 | 확정된 코드 요인: 낮은 raster scale/DPR; JPEG 재확대도 별개 | 캐시 OFF·smoothing OFF로 계단화 | 실제 DPR/zoom/cache 대조, 원본 PNG 전후 | sharpness-chromium 패치, 부모 보고 62d90b2 | 코드 fix ≠ 미술 색띠 해결 |
| 추출 용량 E·S§3 | 작은 계단 asset인데 JSON 수십 MB | 확정: clip 밖 원본 전체 경로 반복 | 압축만 하고 런타임 비효율 방치·한도 인상 | 사용 범위·cursor 보존 bounded cull, 재사용 색면 교정 | approved40/FAILURES, sharpness stage40/report-v2 | cull도 RGB 차이 가능; fresh 객체로 검사 |
| 조수 G§3 | 물벽·Infinity·잘못된 복귀 | 확정: 장식 solid를 floor로 샘플·좌표 불일치 | 지형 평탄화·수위/피해로 덮기 | low-ground ID/finite 검사, 실제 수면·bank 계약 | act4-event-geometry/README, 33 water tests | 38 no tide 보존; 저/고/저+전투 결합 별도 |
| 조작/난도 G§4 | 반복 점프·전투 패배를 과난도로 판단 | 확정 사례: 착지 검사 순서·잘못된 지원면/장거리 held input | 적 약화·실패 seed 삭제 | 도착 우선·합법 전략·오류별 로그·정상 성장 | approved31-combat/ADAPTER_CONTRACT, V30_RESULTS | 소표본 승률/인간 재미 일반화 금지 |
| SOUL/영수증 G§4–5 | 예측 hit와 실피해 불일치·보스 압력 누락 | 확정: predictor/live friendly 충돌 차이; warning 영수증 fixture | 예측값을 실제 피해로 보고·주입 영수증을 UI 목격으로 보고 | 실제 target/HP, predictor parity, 주입 필드와 runtime SHA 고정 | approved31-combat/CONTROLLED_STRESS_RESULTS, ADAPTER_CONTRACT | 통제 전투 ≠ 실제 경고/UI/전체 미션 |
| 문·클리어 G§3·5 | 도착/전멸인데 mission 미완료 | 확정된 위험: door/exit/카메라·probe·receipt 좌표 계약 불일치 | ID만 유지·forceclear·gate 삭제 | 모든 XY/높이·관측·retry 동시 정합 | act4-event-geometry, 32 NPC threshold fixture | quiet→문/구출→승선→승리/저장 정상 경로 필수 |

## 추가 1 — 39장 잔존 보스 그림자

- **증상:** 난파선/하늘을 가르는 긴 어두운 수평선.
- **원인(확정):** embedded BODY로 unitBody는 숨겼지만 큰 boss의 일반 지면 그림자가 남음. 물 제거만으로는 픽셀 변화 0, 해당 그림자만 제거하면 문제 띠만 변했다.
- **폐기:** 물 수위/마스크 수정, 모든 39장 그림자 또는 보스 자체 삭제.
- **채택:** 정확한 embedded wreck 연결 guard를 unitBody와 그림자에서 공유. 연결이 없거나 깨지면 기존 fallback, 일반 배우 그림자·HP바·공격·HP·승리조건 유지.
- **재발검사/증거:** `approved39-environment/SHADOW_HANDOFF.md`, `shadow-water-isolation.json`, production equivalence 및 `tests/act4-wreck-embedded-shadow.mjs`. 화면상 선만 보고 물 탓으로 단정하지 않고 층별 격리한다.
- **한계:** 보스 생존 승리 계약은 유지하지만 이 미술 수정이 전투/미션 통과를 증명하지 않는다.

## 추가 2 — 실제 주민 drop과 moving deck

- **증상:** 영웅은 지나가는데 주민이 경사/단차에서 멈춤, 여러 주민이 switchback에서 막힘, 배가 움직일 때 프레임 비용 급증.
- **원인:** 실제 side2 resident의 support 요구/hero-only drop 가드, 실제 몸체 간 충돌과 승하선 순서가 확인됐다. moving-frame 캐시 무효화 문제도 해당 production fixture에서 확인됐다. 모든 느림을 같은 원인으로 취급하지 않는다.
- **폐기:** NPC를 active hero/side0으로 위장, teleport·HP/AP 보충, 전역 support-free 이동, 이동 budget/속도 임의 증대, 정적 15명 배치만으로 수송 완료 주장.
- **채택:** 제한된 resident drop API와 지리적으로 지정된 bounded step-off, 실제 착지·HP/reset 검사, 먼 berth 우선 등 충돌을 피하는 순서. 이동 배와 정적 world cache의 책임을 구분하고 실제 바뀐 영역만 적절히 무효화한다.
- **재발검사/증거:** `approved40/FAILURES.md`, `HANDOFF.md`, `npc-return-event-v10.json`, `actual-event-v12/manifest.json`. 실제 4주민 observer+physics+water fixture는 complete=false에서 끝났고 116.708초 pacing 문제가 남았다. 해당 Native moving-frame p95 389.85→8.50 ms, worldBuild45→1은 측정 범위 그대로 기록한다.
- **한계:** 명시 boarding-dialogue 시작 fixture ≠ 실제 목격·대사 시작. follow-camera p95 34.48 ms와 cold build 약1.74초도 남았으므로 모바일60fps·정상 mission 완료를 주장하지 않는다. 최신 pacing 변경은 별도 버전의 실제 결과가 필요하다.

## 추가 3 — source/master/compiled 실행본 parity: 출하 차단 gate

- **증상:** 부모의 실증 보고에서 현재 master 실제 31장은 17 units/6 terrain이나 같은 source의 정식 rebuild는 10 units/1 terrain이 됨.
- **원인:** **실행 산출물과 rebuild 결과 불일치는 관찰됨. 정확한 생성 경로/원본 선택 원인은 아직 미확정.** 소스가 최신이라는 이유만으로 생성물도 동일하다고 추정하지 않는다.
- **폐기:** 원인 규명 전 master 생성물 덮어쓰기, 생성 HTML 수작업 패치, 틀린 roster를 새 정상값으로 채택, 기존 build 실패를 숨긴 채 배포.
- **채택:** 현재 배포 실행본·source commit·입력 데이터·공식 build 명령·의존 버전·출력 SHA를 보존하고 격리된 정식 rebuild와 대조한다. stage ID별 units/terrain ID·수·배치·스킬·목표·asset/manifest를 비교하고 의도된 차이만 남긴다. source→compiled→실제 실행본이 연결되기 전 master 반영 차단.
- **재발검사/증거:** 각 빌드의 입력/출력 manifest와 실제 앱에 로드된 31장 구조 dump, 기존17/6과 rebuild10/1을 재현하는 artifact를 출하 담당자가 확보한다. 현재 숫자는 부모 보고이며 이 문서 작성자가 새 build를 실행한 결과가 아니다. 공식 build가 실패하면 정확한 실패 단계와 기준 버전 결과를 보존한다.
- **한계:** parity 원인 미확정, 정식 build/배포 검증 미완료. 단위 테스트·Native candidate 성공은 이 gate를 대체하지 못한다.

## 추가 4 — 전송 실패·중복 승인·증거 보존

- **증상:** 큰 asset 전송 재시도에서 승인 요청이 반복되고 소비 환경의 수신/해제가 완료되지 않음.
- **원인:** 도구 전송의 제한·실패·불명확 결과가 있었음. 프로젝트 업무 승인이 없다는 뜻으로 재해석하지 않는다. 정확한 서비스 실패 원인은 확인한 범위만 기록한다.
- **폐기:** 이미 승인된 업무를 반복 재질문, 실패/불명 전송을 같은 방식으로 계속 재시도, 차단 우회, 업로드 성공만으로 수신 완료 선언, 실패 artifact를 덮어쓰는 재생성.
- **채택:** 한 담당자가 전송 상태(미시도/진행/성공/실패/불명)를 기록하고 불명 결과는 확인 후 판단한다. 중단된 대형 업로드는 다시 실행하지 않는다. 허용된 작은 source patch만 root에 전달하고 asset 소비 환경 검증은 따로 기다린다. 실패 원본·해시·진단 로그와 새 시도 관계를 보존한다.
- **재발검사/증거:** 패키지 manifest, 정확한 bytes/SHA, 수신 결과, 압축 해제 후 각 파일 hash, 실제 소비 실행을 단계별 확인한다. 토큰·비공개 도구 정보·환경 내부 시스템 경로는 프로젝트 문서에 기록하지 않는다.
- **한계:** 업무 승인은 도구 제한을 없애지 않는다. root 통합 전 로컬 patch나 Library 파일을 배포 완료로 보고하지 않는다.

## 추가 5 — 패키지 압축·manifest·모바일 HTML

- **증상:** JSON에 art가 중복돼 전달물이 크고 모바일에서 전후 비교·상태 확인이 어려움.
- **원인:** asset 중복과 개별 gzip 효율 한계는 확인됨. 모바일 HTML 자체 결함은 이 감사에서 새로 실증하지 않았으며 아래는 예방 gate다.
- **폐기:** 원본 손실 압축으로 크기만 줄이기, JPEG 확대를 선명도 증거로 사용, 오래된 candidate를 새 report와 섞기, 총 gzip 크기만 보고 무손실 묶음 압축 가능성을 배제.
- **채택:** source/runtime/candidate/render SHA를 묶는 manifest, 중복 없는 검토판, 패키지 단위 무손실 압축을 사용한다. 8 QA JSON 58.7 MB → gzip23.8 MB → tar.xz5.68 MB 사례는 전달 최적화이며 런타임 최적화가 아니다. 해제 메모리/환경 호환성도 확인한다.
- **재발검사/증거:** 아카이브의 경로/해시 검증과 소비 환경 해제, HTML의 모바일 가로/세로 및 실제 브라우저 링크·원본 PNG 로드·전후 동일 crop/zoom·장별 상태 표시 확인. 설명보다 단계별 핵심 지표/이미지를 우선하고 오프라인 번들이라면 외부 링크 의존도 표시한다.
- **한계:** 현재 새 HTML/압축판 조립 중. Library 업로드 성공 ≠ 소비 성공, Native 전체 캡처 ≠ 브라우저 플레이.

## 당시 멈춰야 할 완료 표현 (2026-10-31 11:28 기록)

10장 sharp 미술 후보는 부모 보고상 로컬 검증 완료(40은 main+9 추출 색면 교체). production Native 전체 10장 캡처 진행 중이며 신규 후보의 실제 브라우저·정상 완주·master 배포는 미완료다. 과거 버전 검증을 새 후보 통과로 바꾸지 않는다. 이 감사는 기존 진단을 보존하며 새로운 플레이·배포 성공을 만들지 않는다.


## 후속 해결 — source/compiled parity 복구 (2026-10-31 12:10 UTC 기록)

앞의 추가 3은 당시의 실패 이력으로 보존한다. **source/compiled 불일치 원인은 후속 조사로 확정됐고 기존 배포 내용과 source의 parity는 복구됐다.** 아래 결과는 root 및 별도 cloud 작업의 확인 보고에 근거하며, 이 문서 작성자가 새 build/배포를 실행한 것은 아니다.

- **증상:** 기존 공개 실행본의 31장과 동일 source 정식 rebuild의 배우/지형 수가 달랐다.
- **원인(확정):** master `cc33f68`의 commit message 자체가 `Deploy verified Act 4 runtime and compact loading ahead of source synchronization`이었다. compiled 런타임을 source 동기화보다 먼저 배포해 source가 뒤처졌다.
- **폐기:** 차이를 원인 불명으로 영구 방치하거나 rebuilt의 다른 데이터를 정상으로 간주해 덮어쓰기, compiled만 먼저 배포하는 순서.
- **채택 해결:** 보존 source snapshot `74628ce460059fc7ab4458a798f53a1ca20ba052`에서 기존 배포와 정확히 맞는 runtime 및 world literal parts를 복구했다. 기존 게임 내용을 바꾸지 않는 source 동기화이며 새 sharp 미술 배포가 아니다.
- **재발검사/확인 증거:** 정식 build의 활성 output **732개**에 대해 bytes/SHA를 비교하고 1–40장 전체 stage JSON이 동일함을 검증했다. canonical world parts는 32,073,198 bytes, SHA256 `801df923ce89d8747f337f0b71e2ae38c604a8efbd6250d56e885b931af9f1b5`. parity 복구 commit `f86d149de3d39e46b613cd4ab5b03f7aab77c2d7`, 확인된 master `736f462ecb3585b5384449b5bf8741695493752e`, Pages run `41198544961` success. root가 실제 공개 Chrome reload 후 78자료 로딩 완료와 ‘길을 열다’ 활성 상태를 확인했다.
- **미검증 한계:** 위 성공은 기존 공개 게임과 source/build의 동등성 복구다. 신규 sharp 미술, 새 지형의 정상 완주, 신규 전투/승선 합격 또는 그 배포를 뜻하지 않는다. master SHA는 이 기록 시점의 값이다.

**이후 출하 순서:** source → 정식 build → 활성 manifest 전체 output bytes/hash → 모든 stage 데이터 비교 → 실제 공개 실행본 확인. 의도된 새 feature는 바뀔 영역을 명시하고 그 차이를 별도 검수한다. 의도된 차이가 있으므로 전부 byte-identical해야 한다고 강제하지 않되, 설명 없는 차이는 출하 차단이다. compiled를 source보다 먼저 배포하지 않는다.

## 추가 6 — release guard와 QA의 순환 차단

- **증상:** 미검수 후보의 production package가 불완전해 정식 build가 차단됨. 이 제약을 격리된 QA preview에도 그대로 적용하면 검수 증거를 모을 수 없어 영구 미완료가 된다.
- **원인(구분):** 미완성 production package의 출하 차단은 정상 guard다. 검수용 후보의 실행까지 모두 금지하는 것은 QA/출하 경계 설계의 순환이다. guard 자체를 제거해야 한다는 뜻이 아니다.
- **폐기:** 정식 release guard 우회·해제, QA 생성 HTML을 공개 배포, 검수 편의를 위해 적 제거/중간 위치/경고 receipt 주입 후 정상 플레이 합격으로 보고.
- **채택 해결:** production Engine/App/Story를 사용하는 **격리 QA-only build/importer**의 목적·입력 SHA·출력 위치·fixture 여부를 명시한다. 공개 배포 경로와 분리하고 같은 production 게임 동작으로 후보를 검증한다. 정상 입장부터 실제 적/스토리/관측을 거치는 플레이와 조작기/기믹 진단 fixture를 구분해 별도 결과로 남긴다.
- **재발검사/확인 증거:** source branch `codex/act4-stage31-browser-harness`, commit `f69cb3c`의 재사용 로더에서 실제 **38 units** 진입이 성공했다고 root가 보고했다. roster·시작 위치·Engine/App/Story 출처·관측 주입 없음 여부·후보/runtime SHA를 정상 플레이 run에 연결한다. QA 산출물에는 QA-only 표식을 유지하고 production release guard는 그대로 둔다.
- **미검증 한계:** 38 units 정상 진입은 정상 완주가 아니다. 완주 task는 진행 중이며 QA 생성 실행본은 공개 배포/최종 완료 증거가 아니다. 정식 package·build·release gate는 검수 뒤 별도로 통과해야 한다.
