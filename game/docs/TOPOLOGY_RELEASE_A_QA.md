# 2차 A 통합 검증 — 2026-10-08

## 고정 범위와 결과

- 범위: 1막 승인 보완, 15장 대표 복층 동굴, 23~28장 지상/수로 조사와 v2 분할·합류, 임시 M09·구간 재시도·v1 저장 호환. 16장 및 나머지 2막 확장은 B로 분리했다.
- 실행 원본: `0d9c152`. 최종 미술 검사만 tests-only `93b7bb8`을 적용해 재실행했다. 통합 후보 `e3ec0fd`와 runtime/engine/data/map/balance 경로 차이가 없음을 확인했다.
- 선택한 **52개 명령 그룹의 최신 결과가 통과**, 남은 실패 0이다. 묶음 안에 여러 검사와 중복 호출이 있으므로 독립 사례 52개라는 뜻은 아니다. 전체 `npm run verify` 통과나 게임 전체 완주를 뜻하지 않는다.
- 최초 미술 회귀 3개는 옛 지도/파티 전제로 실패했다. 역사 검사를 보존하고 새 범위를 분리한 뒤 `act3-production-shots`, `act3-art-regeneration`, `act3-canal-supports`를 독립 재실행해 모두 통과했다.

## 주요 확인 범위

- 두 HTML 빌드, TypeScript, `game` 단위 검사 묶음
- waterworks·forest/cavern·split 표준 묶음, 목표/서사/제작 지도 왕복, 캠프·여정·구저장 경계
- 현재 21~30장과 동결 v1 25~28장의 공간 이동; 실제 M09 발사·쌍문 사용·비행 중 Continue; 임시 기예의 영구 장착/랭크 비오염
- XP 중복 재현 후 단조 지급 수정, 반복 재시도와 저장 후 차액 지급; 복구 뒤 충돌 캐시의 현재 지형 참조와 새 엔진 결과 일치
- v1 편성 상한, 실제 과거 fire/hold/호송·현재 28장 fire/합류의 별도 저장·실패·재시도 검사
- 기존 전체 역사 해시와 경사·지지면·clearance를 유지한 정확 승인 delta, 미승인 변경 거부, migration·ACT1/2 공간·행동 회귀
- 공통 SVG 미술·충돌 경계, 현재/역사 운하 구조, 현재 배우의 실제 기본탄 사선, 반사 opt-in의 기존 화소 보존

## 전투 진단과 한계

- 구v1 24→27은 동결 입력 fixture 하나에서 이어지는 무아이템 production App/Engine 진단으로 19/32/24/25라운드에 모두 승리했다. 전원 생존, 가방 불변, engine-only item 호출 0회였다. 방어 30% 정책이며 공격 우선 첫 시도의 실패도 별도로 보존했다. DOM·Canvas·storage는 대체 객체다.
- 15장 무아이템 진단은 40·73턴에 실제 App 저장으로 재개한 정책 보완 실행이며 74턴 승리다. 최종 정책으로 새 전투부터 끊김 없이 완주한 증거는 아니다.
- 새 v2 23~28 전체 전투 완주, 사람의 난이도 판단, 브라우저/CUA와 성능 검증은 이 보고서에 포함하지 않는다. 직접 Chromium은 확인된 OS socket EPERM 때문에 반복 실행하지 않았다. 배포 후 별도 CUA 기록을 확인해야 한다.
- 넓은 선행의 ground-contact 묶음은 최종 소스 고정을 위해 실행 중 중단했으며 통과/실패 어느 쪽으로도 집계하지 않았다.

## 생성물

빌드 커밋: `255d2f9`. 두 파일은 같은 공통 런타임에서 생성했고, 통합 후보의 파일 바이트도 대조했다.

- `HONRO.html` SHA-256: `3ffae4903267c7058f2f91e8dd67d536b2df2f96a1e891f94743c3e6ee475c1b`
- `HONRO_WORKSHOP.html` SHA-256: `bf1edc0b2e8c98ea752b978a89a5718ef3c524fb983af9bd8e346c94d30c15b0`

검사 로그/초기 실패/재실행 요약은 검수 작업트리의 `_local/reports/topology-A-final/`에 남겼다. 명령 묶음은 `test:act3:waterworks`, `test:forest-cavern`, `test:act3:split`과 해당 개별 회귀 파일로 재현한다. `_local` 기록은 배포 파일이 아니다.


## Public Pages and representative UI verification — 2026-10-08

Release `cab313b9404c1cb4da82c62fdb017bbed1aae02b` completed [Pages workflow37719990814](https://github.com/sys8994/honro/actions/runs/37719990814). Both public HTML files returned HTTP200 and their full SHA256 matched the build recorded above.

Actual cloud-browser UI inputs, visible DOM and screenshots verified:
- Stage9 reused hall roof is clear of the old terrain/posts. Stage7 overview shows the connected tree branches; traversal/rescue completion was not tested there.
- Stage15 camera-start Playtest permits repeated real jumps and landings with75 movement cost and unchanged755HP, then re-enables jump/fire. The HUD still incorrectly shows terrain embedding; actual horizontal movement/physical blockage was not established in this check. The dedicated status-only correction is reserved for B and requires a same-location recheck.
- Game debug stage25 exposes the temporary fifth M09 card for the level1 untrained Damheo while preserving the normal four slots. In Workshop's default level18 pair, actual movement, M09 gate creation, Seol-o E crossing, mid-crossing retry, reinstallation and both companions' E arrivals complete the crossing. Retry restores the starting pair/resources and removes the old gates; M09 remains separate from the loadout.
- Stage27's two-person team, first of three crossings, temporary M09 and retry fit desktop500×761 and125%-zoom CSS400×609 without horizontal overflow. The narrow retry/card interaction works. This is narrow-desktop evidence, not mobile-UA, touch or phone validation.
- No non-extension game error appeared in the final100 inspected error logs from either tab. Debug was disabled and the original stage1 rest restored; normal saved progress was never imported/replaced.

Not tested: stage25 whole battle/seal completion, all three stage27 crossings,23→28 sequential campaign UI, persistent export/import/reload UI, performance, or normal continuous campaign completion. Stage16 and B maps were not part of this deployment. Node/fixture coverage remains distinct from these actual UI checks.
