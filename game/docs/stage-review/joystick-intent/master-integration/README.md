# 승인된 P0 입력의 master 통합 검수

부모가 구현/최종 검수/390px 원본 화면을 검수해 입력 범위의 master/Pages 반영을 승인했다. 최신 master `27efe8eb`에 승인 입력 tip `adda49d2`만 충돌 없이 병합하고 생성물을 다시 빌드했다. 미승인 병렬 브랜치를 가져오지 않았다. `shared/data`, `shared/map`, `shared/assets`, 지형/기예 저작 tools 및 balance 설정의 소스는 기준 master와 동일하다.

| 검사 | 통합 결과 |
|---|---|
| npm run build | PASS: Game·Workshop·직접 embedded 문서 248개 자산 |
| game typecheck | PASS |
| joystick-intent | PASS: 순수 방향/크기 120조합 및 반경·히스테리시스·독립 물리 |
| charge-input | PASS: 기존 키보드/포인터 충전 126조건 |
| combo-landing-turn | PASS: 기존 S13 방향/추가 행동 14조건 |
| web-split | PASS: 실제 생성 해시/바이트, canonical 캠페인 재구성, Game/embedded 진입, embedded 저장 격리, 직접 iframe 연결 |
| joystick-intent-browser | PASS: 생성 문서의 CDP touch → PointerEvent/캡처 → production frame/물리 255판정·429상태·614이벤트, 브라우저 예외0 |
| test:runtime-contracts | FAIL (기존 master에서도 동일): 아래 기준선 비교 참고 |

## 실제 생성 문서의 대표 입력

[대표 trace](representative-trace.json)에 상/하 양쪽 19/20/21도, aimOnly의 큰 방향 전환/중앙 통과, 45도 시작 후 x=.15/y=.98 미세 이동+상향 조준, 수직 복귀를 추렸다. aimOnly는 이동 호출 0, 월드 x/y/이동도 유지이며 raw 노브만 변했다. ±.61 방향 전환에서 sin(angle) 높낮이가 보존됐다. 21도 및 45도 이후 미세 입력은 실제 이동과 예산 소비가 발생했다. 전체 255개 판정도 통과했다. 원본 전체 trace는 `_local/reports/joystick-master/browser/input-trace.json`에 보존한다.

- [390×844 CSS px 원본 PNG](../evidence/mobile-390-aim-only.png)
- [844×390 CSS px 원본 PNG](../evidence/mobile-844-aim-only.png)
- [소스/생성 문서 SHA-256](build-provenance.json)

PNG는 실제 로컬 Chromium/DPR2 캡처다. 조준 라벨과 raw 노브가 보이고 이동도는 1964/1964다. 기존 7 CSS px 라벨은 작은 보조 표기이며 노브/버튼을 가리지 않고 pointer-events:none이다. 실폰에서 손가락에 가려지는 상태와 가독성은 미검증이다.

## 역사 계약 실패의 기준선 비교

`test:runtime-contracts`는 첫 승인 소스 `shared/build.mjs`에서 actual `5c45b65b6406110bebdad6023cdee005e8a41bd09842d4526dabaedbb8e33c82`, expected `3942fa9bdacce8b434e3847ccfd68a88c4f6bac8dfa5c193ea974aff6a1e0a68`로 실패했다. 별도 detached worktree `/tmp/honro-joystick-master-baseline`의 원래 master `27efe8eb`에서 실제 동일 명령을 실행해 같은 실패를 재현했다. [통합 실패 로그](runtime-contracts.log.txt)와 [기준 master 실패 로그](runtime-contracts-baseline.log.txt)를 구분해 보존한다. 해당 소스는 이번 입력 변경에서 바꾸지 않았다. 역사 해시 계약을 완화하거나 unrelated 소스를 수정해 통과로 만들지 않았다. 현행 생성물/공유 연결은 별도 web-split 검사에서 통과했다.

## 공개 배포와 남은 범위

이 기록은 master 푸시 직전의 로컬 통합 증거다. 원격 최종 SHA와 그 SHA의 Pages run 결론, 실제 공개 페이지 접근 결과는 배포 후 최종 응답에 별도로 보고한다. 로컬 PASS를 공개 브라우저 PASS로 표시하지 않는다. 현재 실행 환경의 `gh api .../pages`는 Forbidden을 반환했으며 권한/터널 제한을 우회하지 않았다. 지원되는 연결 GitHub 읽기 도구로 Actions run 상태를 확인한다.

실제 폰 터치·iOS/Safari·OS 회전은 미검증이다. CDP 브라우저 합성과 실장치 검증을 구분한다.
