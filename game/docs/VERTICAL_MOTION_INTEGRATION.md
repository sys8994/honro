# 수직맵 · 공개 모션 통합

2026-10-10. 모션 `ca03e11fbca6e70cba80e08e61d42597f522c5ef`와 수직14/22 `416ec9ce14ace0a6fe0352459acea5716985939a`를 병합했다. 모션은 공개 master2322c6d와 동일 tree인 입력이다. package.json 테스트 추가만 충돌했고 두 등록을 보존했다. 양 HTML은 공통 빌드 결과다. 기존14/22 문서의 과거 원격 상태는 당시 기록이며 현재 배포 상태를 뜻하지 않는다.

검증 중 저장점이다. 현재22 source-boundary는 원래 fixture를 수정하지 않고 이미 공개된 두 렌더 모션 파일의 정확한 전후 SHA만 허용한다. 나머지126개 고정 소스, 다른29장,608기존자산과22 gameplay 계약 및 모션 회귀는 별도 검사한다. 전체 verify, 실제 브라우저, 성능과 Pages 완료를 이 저장점으로 주장하지 않는다.

## 통합 소스의 직접 재검증

- 두 HTML 공통 재빌드와 TypeScript 통과. Game 11,636,955 bytes, Workshop 11,747,469 bytes. Native VM의 양 HTML 초기화·공유 초기화·편집기 프로젝트 독립성·Playtest 자식 원문 exact 통과. 실제 브라우저 동작을 뜻하지 않는다.
- 현재14 행동6묶음과22 계약7묶음 전체 통과. 원래22 경계 fixture 불변,126개 고정 소스+공개모션2파일 exact전후,29다른장·608기존자산·22부정변이, 원본canonical 재생성과4변조거부 포함.
- 22 기본 traversal84/필수gate연결 및 원본003 hash-checked 조건부 FE귀환8항목 재검증. 후자는 정상분기완주가 아니며 위치 주입·분리 fixture의 제한을 유지한다.
- 최신 모션: 설오 전체 팔 레이어, 휘겸 비율1,205포즈, 검그립10케이스, 실제 follow-through/cancel20케이스와 캐릭터23항목 통과. 모션전용33파일은ca03e11, 맵전용30파일은416ec9c 원본exact. 생산모션을 되돌리지 않았다.
- 14와22 각각 Native16컷을 재생성했다.22 전체/접점과14세로 화면도 직접 검토했으며 기존 큰 석축·반복감/자연암반 단순함의 제한은 그대로다. Native 렌더를 새 미술승인·브라우저·Pages 증거로 바꾸지 않는다.
- 통합28a4a4c에서 새 정상자원22 실행: R28 원래5목표 완료·4명생존, 초기26/정예6·유한9명·행동cap3, 생산 Continue5회 exact, 정상쉼터→23장 도착과 전체battle Continue exact. 실제 UI방어 사용, 외부 live상태/자원쓰기0. 합법 진입 보상원장 기반 개별장 관측이며 이전21장 연속플레이나 정상선택귀환 완주는 아니다. 자동 qualityBlockers 빈 배열을 독립적인 전술/미술 승인으로 해석하지 않는다.

## 실패·미검증 분리

`npm run verify`는 build/typecheck 후 rc20-map-audit→stage12-redesign의 과거 combat-density 전체 project hash에서 실패했다(actual d369e6f0acc142a212a0fa9cb0567646f205618d5acc9abee557fc780a89a54b / expected4e6862fce73a458b6ca04566d898fb0531822a95934059eb981585eaf2469722). `node tests/migration.mjs`도 원래580자산 membership/order 경계에서 실패했다. 두 오류를 변경하지 않은416ec9c에서도 직접 재현했다. golden/기대값을 통과 목적으로 수정하지 않았다.

`python -X utf8 tests/integration.py`는 Chromium의 socket() Operation not permitted로 launch 이전에 차단됐다. 추가 density aggregate는 상태조회 취소 후 완료결과를 확보하지 못했으므로 통과로 세지 않는다. 전체 integration/performance, 실제 Game·Workshop·Playtest 브라우저 조작·Pages 직접 검수와 새 후보의 독립 최종 디자인 검수는 남아 있다. 이 작업자는 원격 mutation을 하지 않았다.

상세 원본은 로컬 검증 packet의 `verification-summary.json`, `preservation.json`, `stage22-fullplay/result.json` 및 trace/Continue 원자료, Native 전후 화면에 연결한다. 최종 게시 담당이 원격 ref와 배포 바이트 및 실제 Pages를 확인한 뒤 배포 상태를 별도로 갱신한다.
